"""Chart calculation service with automated Swiss Ephemeris asteroid downloader."""

import os
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dateutil import tz

from app.models.schemas import NatalChartRequest, NatalChartResponse, GeoLocation
from app.services.astrology_core import (
    GeoLocation as CoreGeoLocation,
    HAVE_SWE, HAVE_SWE_FILES, SWISS_FLAGS, swe, house_sign_breakdown
)


def ensure_ephe_file(filename: str, ephe_dir: Path) -> bool:
    """Download an ephemeris file from Astrodienst if not already present."""
    target_path = ephe_dir / filename
    if target_path.exists():
        return True

    ephe_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if it's a general asteroid file or placed in a subfolder astN
    if filename.startswith("se") and filename.endswith(".se1") and filename != "seas_18.se1":
        # Extract asteroid number for folder structure (ast0, ast1, etc.)
        try:
            num = int(filename[2:7])
            subfolder = f"ast{num // 1000}"
            sub_dir = ephe_dir / subfolder
            sub_dir.mkdir(parents=True, exist_ok=True)
            target_path = sub_dir / filename
            if target_path.exists():
                return True
            url = f"https://www.astro.com/ftp/swisseph/ephe/{subfolder}/{filename}"
        except Exception:
            url = f"https://www.astro.com/ftp/swisseph/ephe/{filename}"
    else:
        url = f"https://www.astro.com/ftp/swisseph/ephe/{filename}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response, open(target_path, "wb") as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Notice: Could not download {filename}: {e}")
        return False


class ChartService:
    """Service for chart calculations."""

    def __init__(self, swe_path: str = None):
        """Initialize the chart service with Swiss Ephemeris path."""
        base_dir = Path(__file__).resolve().parent.parent
        self.ephe_dir = Path(swe_path) if swe_path else (base_dir / "ephe")
        self.ephe_dir.mkdir(parents=True, exist_ok=True)
        self.swe_path = str(self.ephe_dir)
        self._setup_swiss_ephemeris()

    def _setup_swiss_ephemeris(self):
        """Setup Swiss Ephemeris with local directory."""
        global HAVE_SWE_FILES, SWISS_FLAGS

        if HAVE_SWE:
            swe.set_ephe_path(self.swe_path)
            # Ensure the primary asteroid file (Ceres, Pallas, Juno, Vesta, Chiron, Pholus) exists
            ensure_ephe_file("seas_18.se1", self.ephe_dir)
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

        requested_asteroids = getattr(request, "asteroids", []) or []

        chart_data = self._compute_natal_chart(
            dt_local,
            request.location.lat,
            request.location.lon,
            request.timezone,
            house_system=request.house_system,
            asteroids=requested_asteroids,
            swe_path=self.swe_path
        )

        return NatalChartResponse(
            datetime_utc=chart_data["datetime_utc"],
            location={
                "lat": chart_data["location"]["lat"],
                "lon": chart_data["location"]["lon"],
                "tz": chart_data["location"]["tz"]
            },
            angles={
                "ASC": chart_data["angles"]["ASC"],
                "DS": chart_data["angles"]["DS"],
                "MC": chart_data["angles"]["MC"],
                "IC": chart_data["angles"]["IC"]
            },
            houses=chart_data["houses"],
            house_system=chart_data["house_system"],
            planets={
                name: {
                    "lon": planet["lon"],
                    "sign": planet["sign"],
                    "deg": planet["deg"],
                    "house": planet["house"],
                    "retro": planet["retro"]
                }
                for name, planet in chart_data["planets"].items()
            },
            asteroids=chart_data.get("asteroids", {}),
            aspects=chart_data["aspects"],
            moon_phase={
                "name": chart_data["moon_phase"]["name"],
                "angle": chart_data["moon_phase"]["angle"]
            },
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

        calculated_asteroids: Dict[str, Dict] = {}
        requested_asteroids = asteroids or []

        if HAVE_SWE and requested_asteroids:
            import swisseph as swe_calc
            SE_AST_OFFSET = 10000

            # Map common asteroids to built-in bodies in seas_18.se1
            NATIVE_AST_MAP = {
                1: getattr(swe_calc, "SE_CERES", 17),
                2: getattr(swe_calc, "SE_PALLAS", 18),
                3: getattr(swe_calc, "SE_JUNO", 19),
                4: getattr(swe_calc, "SE_VESTA", 20),
                2060: getattr(swe_calc, "SE_CHIRON", 15),
                5145: getattr(swe_calc, "SE_PHOLUS", 16),
            }

            hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
            tjd_ut = swe_calc.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour_decimal)

            for ast_id in requested_asteroids:
                ast_num = int(ast_id)
                lon = None
                retro = False

                if ast_num in NATIVE_AST_MAP:
                    body_target = NATIVE_AST_MAP[ast_num]
                else:
                    body_target = SE_AST_OFFSET + ast_num
                    # Try to ensure individual asteroid file is present
                    filename = f"se{ast_num:05d}.se1"
                    ensure_ephe_file(filename, self.ephe_dir)

                try:
                    res, _ = swe_calc.calc_ut(tjd_ut, body_target, swe_calc.FLG_SWIEPH | swe_calc.FLG_SPEED)
                    lon = float(res[0])
                    retro = bool(res[3] < 0)
                except Exception as e:
                    print(f"Asteroid {ast_num} calculation failed: {e}")

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

        return {
            "datetime_utc": dt_utc.isoformat(),
            "location": {"lat": lat, "lon": lon_east, "tz": tz_name},
            "angles": {"ASC": asc, "DS": norm360(asc + 180), "MC": mc, "IC": norm360(mc + 180)},
            "houses": houses,
            "house_system": hs,
            "planets": planets,
            "asteroids": calculated_asteroids,
            "aspects": aspects,
            "moon_phase": {"name": phase_name, "angle": phase_angle},
            "sect": "DAY" if day_chart else "NIGHT",
            "house_signs": house_splits,
            "cusp_signs": cusp_sign_list,
            "intercepted_signs": intercepts,
        }
