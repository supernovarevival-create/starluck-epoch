"""Chart calculation service using local Swiss Ephemeris files."""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
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

    def compute_natal_chart(self, request: NatalChartRequest) -> NatalChartResponse:
        """Compute a natal chart from the request."""
        dt_local = datetime.fromisoformat(request.datetime_local)
        if dt_local.tzinfo is None:
            dt_local = dt_local.replace(tzinfo=tz.gettz(request.timezone))
        dt_utc = dt_local.astimezone(tz.UTC)
        hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        tjd_ut = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour_decimal) if HAVE_SWE else 0.0     

        requested_asteroids = getattr(request, "asteroids", []) or []
        star_scope = getattr(request, "star_scope", "MAJOR_GC") or "MAJOR_GC"

        raw_star_method = getattr(request, "star_method", "STELLA_PARTILE") or "STELLA_PARTILE"
        if "COSMIC" in str(raw_star_method).upper():
            star_method = "COSMIC_ASCENDANCE"
        elif "NONE" in str(raw_star_method).upper():
            star_method = "NONE"
        else:
            star_method = "STELLA_PARTILE"

        chart_data = self._compute_natal_chart(
            dt_local,
            request.location.lat,
            request.location.lon,
            request.timezone,
            house_system=request.house_system,
            asteroids=requested_asteroids,
            swe_path=self.swe_path,
            star_scope=star_scope,
            star_method=star_method
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
                             swe_path: str = None, star_scope: str = "MAJOR_GC",
                             star_method: str = "STELLA_PARTILE") -> Dict[str, Any]:
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
        hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        tjd_ut = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour_decimal) if HAVE_SWE else 0.0

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

        # -------------------------------------------------------------
        # BLACK MOON LILITH (MEAN LUNAR APOGEE = 12)
        # -------------------------------------------------------------
        if HAVE_SWE:
            import swisseph as swe_calc
            # SE_MEAN_APOG = 12
            res, _ = swe_calc.calc_ut(tjd_ut, getattr(swe_calc, "MEAN_APOG", 12), swe_calc.FLG_SWIEPH | swe_calc.FLG_SPEED)
            lilith_lon = float(res[0])
            s, d, _ = deg_to_signpos(lilith_lon)
            planets["BlackMoonLilith"] = {
                "lon": lilith_lon,
                "sign": s,
                "deg": d,
                "house": house_index_for_longitude(houses, lilith_lon),
                "retro": bool(res[3] < 0)
            }                         

        raw_aspects = find_aspects({k: v["lon"] for k, v in planets.items() if k != "PartOfFortune"})
        formatted_aspects = []
        for a in raw_aspects:
            if isinstance(a, dict):
                p1 = a.get("p1", "")
                asp_type = a.get("aspect", "")
                p2 = a.get("p2", "")
                off = a.get("off", 0.0)
                formatted_aspects.append(f"{p1} {asp_type} {p2} (orb {off:.2f}°)")
            else:
                formatted_aspects.append(str(a))
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

            NATIVE_MAP = {
                1: getattr(swe_calc, "CERES", 17),
                2: getattr(swe_calc, "PALLAS", 18),
                3: getattr(swe_calc, "JUNO", 19),
                4: getattr(swe_calc, "VESTA", 20),
                2060: getattr(swe_calc, "CHIRON", 15),
                5145: getattr(swe_calc, "PHOLUS", 16),
            }

            for ast_id in requested_asteroids:
                try:
                    ast_num = int(ast_id)
                    lon = None
                    retro = False

                    if ast_num in NATIVE_MAP:
                        target_id = NATIVE_MAP[ast_num]
                    else:
                        target_id = AST_OFFSET + ast_num

# Try high-precision Swiss Ephemeris file first
                    try:
                        res, _ = swe_calc.calc_ut(tjd_ut, target_id, swe_calc.FLG_SWIEPH | swe_calc.FLG_SPEED)
                    except Exception:
                        # Fallback: calculate using internal orbital elements without crashing
                        res, _ = swe_calc.calc_ut(tjd_ut, target_id, swe_calc.FLG_MOSEPH | swe_calc.FLG_SPEED)

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
        # URANIAN / TRANS-NEPTUNIAN HYPOTHETICAL POINTS (IDs 40-47)
        # -------------------------------------------------------------
        URANIAN_BODIES = [
            (40, "Cupido"),
            (41, "Hades"),
            (42, "Zeus"),
            (43, "Kronos"),
            (44, "Apollon"),
            (45, "Admetos"),
            (46, "Vulkanus"),
            (47, "Poseidon")
        ]

        # Calculate if requested by user toggle
        if getattr(request, "include_uranian", False):
            import swisseph as swe_calc
            for u_id, u_name in URANIAN_BODIES:
                res, _ = swe_calc.calc_ut(tjd_ut, u_id, swe_calc.FLG_SWIEPH | swe_calc.FLG_SPEED)
                u_lon = float(res[0])
                s, d, _ = deg_to_signpos(u_lon)
                planets[u_name] = {
                    "lon": u_lon,
                    "sign": s,
                    "deg": d,
                    "house": house_index_for_longitude(houses, u_lon),
                    "retro": bool(res[3] < 0)
                }
                
        # -------------------------------------------------------------
        # FIXED STARS & COSMIC POINTS
        # -------------------------------------------------------------
        fixed_star_conjunctions = []

        if star_scope != "NONE" and star_method != "NONE":
            # Catalog of J2000.0 tropical longitudes (epoch 2000-01-01 12:00 TT)
            # Precess eastward along the ecliptic at ~50.291 arcsec/year (0.0139697°/year)
            EXPANDED_STARS = [
                # 4 Royal Watchers (5.0° orb)
                ("Aldebaran", 69.7892, "Royal Star"),
                ("Regulus", 149.8331, "Royal Star"),
                ("Antares", 249.7644, "Royal Star"),
                ("Fomalhaut", 333.8694, "Royal Star"),

                # The 15 Medieval Behenian Stars (3.0° orb)
                ("Algol", 56.1703, "Behenian Star"),
                ("Alcyone (Pleiades)", 59.9989, "Behenian Star"),
                ("Capella", 81.8578, "Behenian Star"),
                ("Sirius", 104.0894, "Behenian Star"),
                ("Procyon", 115.8031, "Behenian Star"),
                ("Algorab", 193.4542, "Behenian Star"),
                ("Spica", 203.8436, "Behenian Star"),
                ("Arcturus", 204.2389, "Behenian Star"),
                ("Alphecca", 222.2858, "Behenian Star"),
                ("Vega", 285.3183, "Behenian Star"),
                ("Altair", 301.7828, "Behenian Star"),
                ("Deneb Algedi", 323.5517, "Behenian Star"),
                ("Alkaid (Benetnasch)", 177.0133, "Behenian Star"),

                # Major Astrological & Navigational Stars (1.5° orb)
                ("Sharatan", 33.9714, "Major Star"),
                ("Hamal", 37.6681, "Major Star"),
                ("Mira", 31.5283, "Major Star"),
                ("Menkar", 44.3211, "Major Star"),
                ("Rigel", 76.8328, "Major Star"),
                ("Bellatrix", 80.9547, "Major Star"),
                ("Elnath", 82.5806, "Major Star"),
                ("Alnilam (Orion Belt)", 83.4719, "Major Star"),
                ("Betelgeuse", 88.7561, "Major Star"),
                ("Menkalinan", 89.9167, "Major Star"),
                ("Sirrah (Alpheratz)", 14.3056, "Major Star"),
                ("Mirach", 30.4056, "Major Star"),
                ("Almach", 44.2306, "Major Star"),
                ("Canopus", 104.9708, "Major Star"),
                ("Castor", 110.2458, "Major Star"),
                ("Pollux", 113.2208, "Major Star"),
                ("Praesepe (Beehive M44)", 127.3417, "Major Star"),
                ("Asellus Borealis", 127.5500, "Major Star"),
                ("Asellus Australis", 128.7222, "Major Star"),
                ("Alphard (Hydra Heart)", 147.2889, "Major Star"),
                ("Denebola", 171.6250, "Major Star"),
                ("Zosma", 161.3250, "Major Star"),
                ("Copula", 175.1200, "Major Star"),
                ("Vindemiatrix", 189.9417, "Major Star"),
                ("Seginus", 197.6667, "Major Star"),
                ("Zuben Elgenubi", 225.0889, "Major Star"),
                ("Zuben Eschamali", 229.3694, "Major Star"),
                ("Unukalhai", 232.0722, "Major Star"),
                ("Toliman (Alpha Centauri)", 239.5250, "Major Star"),
                ("Agena (Hadar)", 233.8056, "Major Star"),
                ("Graffias (Acrab)", 243.1917, "Major Star"),
                ("Dschubba", 242.5667, "Major Star"),
                ("Sabik", 257.9722, "Major Star"),
                ("Ras Alhague", 262.4500, "Major Star"),
                ("Shaula", 264.5917, "Major Star"),
                ("Nunki (Pelagus)", 282.3861, "Major Star"),
                ("Terebellum", 295.8333, "Major Star"),
                ("Tarazed", 300.9333, "Major Star"),
                ("Dabih", 304.0500, "Major Star"),
                ("Sadalsuud", 323.4000, "Major Star"),
                ("Sadalmelik", 323.7667, "Major Star"),
                ("Deneb (Cygnus)", 335.3331, "Major Star"),
                ("Skat", 338.8750, "Major Star"),
                ("Achernar", 345.3167, "Major Star"),
                ("Markab", 353.4869, "Major Star"),
                ("Scheat", 359.3639, "Major Star"),
                ("Polaris (North Star)", 28.5667, "Major Star"),
            ]

            years_from_j2000 = (dt_utc.year - 2000) + (dt_utc.timetuple().tm_yday - 1) / 365.25

            stars_to_scan = []
            for item in EXPANDED_STARS:
                cat = item[2]
                if star_scope == "ROYAL_BEHENIAN" and cat not in ["Royal Star", "Behenian Star"]:
                    continue
                stars_to_scan.append(item)

            target_bodies = {p_name: p_data["lon"] for p_name, p_data in planets.items()}
            target_bodies["ASC"] = asc
            target_bodies["MC"] = mc

            if "TrueNode" in planets:
                target_bodies["SouthNode"] = (planets["TrueNode"]["lon"] + 180) % 360
            elif "NorthNode" in planets:
                target_bodies["SouthNode"] = (planets["NorthNode"]["lon"] + 180) % 360

            if "PartOfFortune" in planets:
                target_bodies["PartOfFortune"] = planets["PartOfFortune"]["lon"]

            ASTEROID_NAMES = {
                1: "Ceres", 2: "Pallas", 3: "Juno", 4: "Vesta",
                5: "Astraea", 6: "Hebe", 7: "Iris", 8: "Flora",
                9: "Metis", 10: "Hygiea", 16: "Psyche", 18: "Melpomene",
                19: "Fortuna", 26: "Proserpina", 34: "Circe", 39: "Laetitia",
                40: "Harmonia", 42: "Isis", 43: "Ariadne", 55: "Pandora",
                60: "Echo", 76: "Freia", 80: "Sappho", 93: "Minerva",
                94: "Aurora", 100: "Hekate", 103: "Hera", 105: "Artemis",
                114: "Kassandra", 128: "Nemesis", 149: "Medusa", 157: "Dejanira",
                212: "Medea", 258: "Tyche", 399: "Persephone", 433: "Eros",
                1009: "Sirene", 1036: "Ganymed", 1181: "Lilith", 1221: "Amor",
                1388: "Aphrodite", 1474: "Beira", 1912: "Anubis", 1923: "Osiris",
                1924: "Horus", 1930: "Lucifer", 1981: "Midas", 2060: "Chiron",
                2063: "Bacchus", 2101: "Adonis", 2102: "Tantalus", 3811: "Karma",
                4227: "Kaali", 4386: "Lust", 4450: "Pan", 5145: "Pholus",
                7066: "Nessus", 8405: "Asbolus", 10199: "Chariklo", 20000: "Varuna",
                28978: "Ixion", 33154: "Talent", 50000: "Quaoar", 90377: "Sedna",
                90482: "Orcus", 99942: "Apophis", 136108: "Haumea", 136199: "Eris",
                136472: "Makemake"
            }

            for a_id, a_data in calculated_asteroids.items():
                int_id = int(a_id)
                ast_display = ASTEROID_NAMES.get(int_id, f"Asteroid {int_id}")
                target_bodies[ast_display] = a_data["lon"]

            is_cosmic = "COSMIC" in str(star_method).upper()

            for display_name, j2000_lon, category in stars_to_scan:
                s_lon = (j2000_lon + (years_from_j2000 * 0.0139697)) % 360

                if is_cosmic:
                    if category == "Royal Star":
                        max_orb = 5.0
                    elif category == "Behenian Star":
                        max_orb = 3.0
                    else:
                        max_orb = 1.5
                else:
                    max_orb = 1.25

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

            # Sagittarius A* (Galactic Center)
            if star_scope in ["MAJOR_GC", "ALL", "MAJOR"]:
                gc_lon = (266.9533 + (years_from_j2000 * 0.0139697)) % 360
                gc_orb = 3.0 if is_cosmic else 1.25

                for body_name, b_lon in target_bodies.items():
                    diff = abs(gc_lon - b_lon)
                    if diff > 180:
                        diff = 360 - diff

                    if diff <= gc_orb:
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
            "aspects": formatted_aspects,
            "moon_phase": {"name": phase_name, "angle": phase_angle},
            "sect": "DAY" if day_chart else "NIGHT",
            "house_signs": house_splits,
            "cusp_signs": cusp_sign_list,
            "intercepted_signs": intercepts,
        }
