"""Chart calculation service using local Swiss Ephemeris files."""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dateutil import tz

from app.models.schemas import NatalChartRequest, NatalChartResponse, GeoLocation
from app.services.astrology_core import (
    GeoLocation as CoreGeoLocation,
    HAVE_SWE, HAVE_SWE_FILES, SWISS_FLAGS, swe, house_sign_breakdown
)


class ChartService:
    """Service for chart calculations."""

    def __init__(self, swe_path: str = None):
        """Initialize chart service with the local ephemeris_data path."""
        # Find project root where 'ephemeris_data' lives
        root_dir = Path(__file__).resolve().parent.parent.parent
        self.ephe_dir = root_dir / "ephemeris_data"
        self.swe_path = str(self.ephe_dir)
        self._setup_swiss_ephemeris()

    def _setup_swiss_ephemeris(self):
        """Setup Swiss Ephemeris with local directory."""
        global HAVE_SWE_FILES, SWISS_FLAGS

        if HAVE_SWE:
            swe.set_ephe_path(self.swe_path)
            SWISS_FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED
            HAVE_SWE_FILES = True
        else:
            SWISS_FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
            HAVE_SWE_FILES = False

def _compute_natal_chart(self, dt_local: datetime, lat: float, lon_east: float, tz_name: str,
                             house_system: str = "WHOLE", asteroids: Optional[List[int]] = None,
                             swe_path: str = None, star_scope: str = "MAJOR_GC",
                             star_method: str = "STELLA_PARTILE") -> Dict:

        chart_data = self._compute_natal_chart(
            dt_local,
            request.location.lat,
            request.location.lon,
            request.timezone,
            house_system: str = "WHOLE", asteroids: Optional[List[int]] = None,
            asteroids=requested_asteroids,
            swe_path: str = None, star_scope: str = "MAJOR_GC",
            star_scope=star_scope,
            star_method: str = "STELLA_PARTILE") -> Dict:
        )

        return NatalChartResponse(
            datetime_utc=chart_data["datetime_utc"],
            location=chart_data["location"],
            angles=chart_data["angles"],
            houses=chart_data["houses"],
            house_system=chart_data["house_system"],
            planets=chart_data["planets"],
            asteroids=chart_data.get("asteroids", {}),
            fixed_stars=chart_data.get("fixed_stars", []),
            aspects=chart_data["aspects"],
            moon_phase=chart_data["moon_phase"],
            sect=chart_data["sect"]
        )

    def _compute_natal_chart(self, dt_local: datetime, lat: float, lon_east: float, tz_name: str,
                             house_system: str = "WHOLE", asteroids: Optional[List[int]] = None,
                             swe_path: str = None) -> Dict:
        """Compute natal chart."""
        from app.services.astrology_core import (
            planet_longitudes, swiss_angles_and_houses, is_day_chart,
            part_of_fortune, moon_phase_info_from_lons, find_aspects,
            deg_to_signpos, house_index_for_longitude, norm360,
            _retrograde_swiss, _retrograde_pyephem, whole_sign_houses,
            equal_houses, placidus_houses_placeholder, GeoLocation,
            cusp_signs, intercepted_signs,
            _ascendant_precise_pyephem, _mc_from_lst_pyephem
        )

        if dt_local.tzinfo is None:
            dt_local = dt_local.replace(tzinfo=tz.gettz(tz_name))
        dt_utc = dt_local.astimezone(tz.UTC)
        loc = GeoLocation(lat=lat, lon=lon_east)

        if HAVE_SWE and swe_path:
            swe.set_ephe_path(swe_path)

        lons = planet_longitudes(dt_utc)
        hs = house_system.upper()

        if HAVE_SWE:
            house_code = {
                "PLACIDUS": b'P',
                "WHOLE": b'W',
                "EQUAL": b'A',
                "KOCH": b'K',
                "REGIOMONTANUS": b'R',
                "CAMPANUS": b'C',
                "PORPHYRY": b'O',
                "ALCABITIUS": b'B',
                "TOPOCENTRIC": b'T',
                "MORINUS": b'M',
                "VEHLOW": b'V',
            }.get(hs, b'P')
            asc, mc, houses = swiss_angles_and_houses(dt_utc, loc, house_code)
        else:
            asc = _ascendant_precise_pyephem(dt_utc, loc)
            mc = _mc_from_lst_pyephem(dt_utc, loc)
            if hs == "WHOLE":
                houses = whole_sign_houses(asc)
            elif hs == "EQUAL":
                houses = equal_houses(asc)
            else:
                houses = placidus_houses_placeholder(asc, mc, loc, dt_utc)

        day_chart = is_day_chart(dt_utc, loc)

        planets: Dict[str, Dict] = {}
        order = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "TrueNode", "Chiron"]
        for name in order:
            if name not in lons:
                continue
            lon = lons[name]
            sign, deg_in_sign, _ = deg_to_signpos(lon)
            house_i = house_index_for_longitude(houses, lon)
            retro = _retrograde_swiss(dt_utc, name) if HAVE_SWE else _retrograde_pyephem(dt_utc, name)
            planets[name] = {"lon": lon, "sign": sign, "deg": deg_in_sign, "house": house_i, "retro": retro}

        pof_lon = part_of_fortune(asc, planets["Sun"]["lon"], planets["Moon"]["lon"], day_chart)
        s, d, _ = deg_to_signpos(pof_lon)
        planets["PartOfFortune"] = {
            "lon": pof_lon,
            "sign": s,
            "deg": d,
            "house": house_index_for_longitude(houses, pof_lon),
            "retro": False
        }

        aspects = find_aspects({k: v["lon"] for k, v in planets.items() if k != "PartOfFortune"})
        phase_name, phase_angle = moon_phase_info_from_lons(lons["Sun"], lons["Moon"])

        house_splits = house_sign_breakdown(houses)
        cusp_sign_list = cusp_signs(houses)
        intercepts = intercepted_signs(houses)

        # -------------------------------------------------------------
        # ASTEROID CALCULATIONS
        # -------------------------------------------------------------
        calculated_asteroids: Dict[str, Dict] = {}
        requested_asteroids = asteroids or []

        if HAVE_SWE and requested_asteroids:
            import swisseph as swe_calc

            AST_OFFSET = getattr(swe_calc, "AST_OFFSET", 10000)

            # Native Swiss Eph IDs inside seas_18.se1
            NATIVE_MAP = {
                1: getattr(swe_calc, "CERES", 17),
                2: getattr(swe_calc, "PALLAS", 18),
                3: getattr(swe_calc, "JUNO", 19),
                4: getattr(swe_calc, "VESTA", 20),
                2060: getattr(swe_calc, "CHIRON", 15),
                5145: getattr(swe_calc, "PHOLUS", 16),
            }

            hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
            tjd_ut = swe_calc.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour_decimal)

            for ast_id in requested_asteroids:
                try:
                    ast_num = int(ast_id)
                    lon = None
                    retro = False

                    if ast_num in NATIVE_MAP:
                        target_id = NATIVE_MAP[ast_num]
                    else:
                        target_id = AST_OFFSET + ast_num

                    res, _ = swe_calc.calc_ut(tjd_ut, target_id, swe_calc.FLG_SWIEPH | swe_calc.FLG_SPEED)
                    lon = float(res[0])
                    retro = bool(res[3] < 0)

                    if lon is not None:
                        s, d, _ = deg_to_signpos(lon)
                        h_i = house_index_for_longitude(houses, lon)
                        calculated_asteroids[str(ast_num)] = {
                            "id": ast_num,
                            "lon": lon,
                            "sign": s,
                            "deg": d,
                            "house": h_i,
                            "retro": retro
                        }
                except Exception as ast_err:
                    print(f"Skipping asteroid {ast_id}: {ast_err}")

# -------------------------------------------------------------
        # FIXED STARS & SAGITTARIUS A* (GALACTIC CENTER)
        # -------------------------------------------------------------
        fixed_star_conjunctions = []

        if HAVE_SWE and star_scope != "NONE" and star_method != "NONE":
            import swisseph as swe_calc

            # Star Database: (SwissEph Query Name, Display Name, Category, Cosmic Ascendance Max Orb)
            CATALOG_STARS = [
                # 4 Royal Watchers
                ("Aldebaran", "Aldebaran", "Royal Star", 5.0),
                ("Regulus", "Regulus", "Royal Star", 5.0),
                ("Antares", "Antares", "Royal Star", 5.0),
                ("Fomalhaut", "Fomalhaut", "Royal Star", 5.0),

                # Major Behenian Stars
                ("Algol", "Algol", "Behenian Star", 3.0),
                ("Alcyone", "Alcyone (Pleiades)", "Behenian Star", 2.5),
                ("Sirius", "Sirius", "Behenian Star", 3.5),
                ("Procyon", "Procyon", "Behenian Star", 2.5),
                ("Spica", "Spica", "Behenian Star", 3.0),
                ("Arcturus", "Arcturus", "Behenian Star", 3.0),
                ("Vega", "Vega", "Behenian Star", 3.0),
                ("Altair", "Altair", "Behenian Star", 2.5),
                ("Deneb Algedi", "Deneb Algedi", "Behenian Star", 2.5),
                ("Benetnasch", "Alkaid (Benetnasch)", "Behenian Star", 2.0),
                ("Alphecca", "Alphecca", "Behenian Star", 2.0),

                # Additional Major Stars
                ("Betelgeuse", "Betelgeuse", "Major Star", 2.5),
                ("Rigel", "Rigel", "Major Star", 2.5),
                ("Bellatrix", "Bellatrix", "Major Star", 2.0),
                ("Castor", "Castor", "Major Star", 2.0),
                ("Pollux", "Pollux", "Major Star", 2.0),
                ("Deneb", "Deneb", "Major Star", 2.0),
                ("Markab", "Markab", "Major Star", 2.0),
            ]

            stars_to_scan = []
            for item in CATALOG_STARS:
                cat = item[2]
                if star_scope == "ROYAL_BEHENIAN" and cat not in ["Royal Star", "Behenian Star"]:
                    continue
                stars_to_scan.append(item)

            hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
            tjd_ut = swe_calc.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour_decimal)

            # Targets: Planets, ASC, MC
            target_bodies = {p_name: p_data["lon"] for p_name, p_data in planets.items()}
            target_bodies["ASC"] = asc
            target_bodies["MC"] = mc

            for star_query, display_name, category, cosmic_orb in stars_to_scan:
                s_lon = None
                try:
                    # Look up star coordinates
                    res, _ = swe_calc.fixstar2_ut(star_query, tjd_ut, swe_calc.FLG_SWIEPH)
                    s_lon = float(res[0])
                except Exception as e:
                    # If file-based lookup fails, try moseph fallback flag
                    try:
                        res, _ = swe_calc.fixstar2_ut(star_query, tjd_ut, swe_calc.FLG_MOSEPH)
                        s_lon = float(res[0])
                    except Exception as e2:
                        pass

                if s_lon is None:
                    continue

                max_orb = 1.25 if star_method == "STELLA_PARTILE" else cosmic_orb

                for body_name, b_lon in target_bodies.items():
                    diff = abs(s_lon - b_lon)
                    if diff > 180:
                        diff = 360 - diff

                    if diff <= max_orb:
                        s_sign, s_deg, _ = deg_to_signpos(s_lon)
                        deg_int = int(s_deg)
                        min_int = int(round((s_deg - deg_int) * 60))
                        if min_int >= 60:
                            deg_int += 1
                            min_int = 0

                        orb_deg = int(diff)
                        orb_min = int(round((diff - orb_deg) * 60))
                        if orb_min >= 60:
                            orb_deg += 1
                            orb_min = 0

                        fixed_star_conjunctions.append({
                            "star": display_name,
                            "category": category,
                            "star_lon": round(s_lon, 4),
                            "star_sign": s_sign,
                            "star_deg": f"{deg_int}°{min_int:02d}'",
                            "body": body_name,
                            "body_lon": round(b_lon, 4),
                            "orb": round(diff, 4),
                            "orb_formatted": f"{orb_deg}°{orb_min:02d}'"
                        })

            # ---------------------------------------------------------
            # SAGITTARIUS A* (GALACTIC CENTER)
            # ---------------------------------------------------------
            if star_scope in ["MAJOR_GC", "ALL"]:
                # Astronomical J2000 coordinates for Sgr A*: 266.9533° (~26°57'12" Sag)
                # Precesses at ~50.29 arcseconds/year (0.013969°/year)
                years_from_j2000 = (tjd_ut - 2451545.0) / 365.25
                gc_lon = (266.9533 + (years_from_j2000 * 0.013969)) % 360

                gc_max_orb = 1.25 if star_method == "STELLA_PARTILE" else 3.0

                for body_name, b_lon in target_bodies.items():
                    diff = abs(gc_lon - b_lon)
                    if diff > 180:
                        diff = 360 - diff

                    if diff <= gc_max_orb:
                        s_sign, s_deg, _ = deg_to_signpos(gc_lon)
                        deg_int = int(s_deg)
                        min_int = int(round((s_deg - deg_int) * 60))
                        if min_int >= 60:
                            deg_int += 1
                            min_int = 0

                        orb_deg = int(diff)
                        orb_min = int(round((diff - orb_deg) * 60))
                        if orb_min >= 60:
                            orb_deg += 1
                            orb_min = 0

                        fixed_star_conjunctions.append({
                            "star": "Sagittarius A* (Galactic Center)",
                            "category": "Cosmic Point",
                            "star_lon": round(gc_lon, 4),
                            "star_sign": s_sign,
                            "star_deg": f"{deg_int}°{min_int:02d}'",
                            "body": body_name,
                            "body_lon": round(b_lon, 4),
                            "orb": round(diff, 4),
                            "orb_formatted": f"{orb_deg}°{orb_min:02d}'"
                        })

        return {
            "datetime_utc": dt_utc.isoformat(),
            "location": {"lat": lat, "lon": lon_east, "tz": tz_name},
            "angles": {"ASC": asc, "DS": norm360(asc + 180), "MC": mc, "IC": norm360(mc + 180)},
            "houses": houses,
            "house_system": hs,
            "planets": planets,
            "asteroids": calculated_asteroids,
            "fixed_stars": fixed_star_conjunctions,
            "aspects": aspects,
            "moon_phase": {"name": phase_name, "angle": phase_angle},
            "sect": "DAY" if day_chart else "NIGHT",
            "house_signs": house_splits,
            "cusp_signs": cusp_sign_list,
            "intercepted_signs": intercepts,
        }
