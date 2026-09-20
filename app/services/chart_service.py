"""Chart calculation service."""

from datetime import datetime
from typing import Dict
from dateutil import tz

from app.models.schemas import NatalChartRequest, NatalChartResponse, GeoLocation
from app.services.astrology_core import (
    GeoLocation as CoreGeoLocation,
    HAVE_SWE, HAVE_SWE_FILES, SWISS_FLAGS, swe, house_sign_breakdown
)


class ChartService:
    """Service for chart calculations."""
    
    def __init__(self, swe_path: str = None):
        """Initialize the chart service with optional Swiss Ephemeris path."""
        self.swe_path = swe_path
        self._setup_swiss_ephemeris()
    
    def _setup_swiss_ephemeris(self):
        """Setup Swiss Ephemeris with the provided path."""
        global HAVE_SWE_FILES, SWISS_FLAGS
        
        if HAVE_SWE and self.swe_path:
            try:
                swe.set_ephe_path(self.swe_path)
                # Test if Swiss files are available
                test_jd = swe.julday(2024, 1, 1, 12, swe.GREG_CAL)
                _ = swe.calc_ut(test_jd, swe.SUN, swe.FLG_SWIEPH | swe.FLG_SPEED)
                SWISS_FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED
                HAVE_SWE_FILES = True
            except Exception:
                SWISS_FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
                HAVE_SWE_FILES = False
        else:
            SWISS_FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
            HAVE_SWE_FILES = False
    
    def compute_natal_chart(self, request: NatalChartRequest) -> NatalChartResponse:
        """Compute a natal chart from the request."""
        # Parse datetime
        dt_local = datetime.fromisoformat(request.datetime_local)
        if dt_local.tzinfo is None:
            dt_local = dt_local.replace(tzinfo=tz.gettz(request.timezone))
        
        dt_utc = dt_local.astimezone(tz.UTC)
        
        # Convert location
        loc = CoreGeoLocation(
            lat=request.location.lat,
            lon=request.location.lon,
            elevation_m=request.location.elevation_m
        )
        
        # Compute chart
        chart_data = self._compute_natal_chart(
            dt_local, 
            request.location.lat, 
            request.location.lon, 
            request.timezone, 
            house_system=request.house_system,
            swe_path=self.swe_path
        )
        
        # Convert to response format
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
            aspects=chart_data["aspects"],
            moon_phase={
                "name": chart_data["moon_phase"]["name"],
                "angle": chart_data["moon_phase"]["angle"]
            },
            sect=chart_data["sect"]
        )

    def _compute_natal_chart(self, dt_local: datetime, lat: float, lon_east: float, tz_name: str, 
                           house_system: str = "WHOLE", swe_path: str = None) -> Dict:
        """Compute natal chart - extracted from CLI logic."""
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

        # Setup Swiss Ephemeris
        if HAVE_SWE and swe_path:
            swe.set_ephe_path(swe_path)
            try:
                _ = swe.calc_ut(swe.julday(dt_utc.year, dt_utc.month, dt_utc.day,
                                          dt_utc.hour + dt_utc.minute/60 + dt_utc.second/3600.0,
                                          swe.GREG_CAL), swe.SUN, swe.FLG_SWIEPH | swe.FLG_SPEED)
                global SWISS_FLAGS, HAVE_SWE_FILES
                SWISS_FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED
                HAVE_SWE_FILES = True
            except Exception:
                #JUST TO MAKE SURE EVERYTHING IS WORKING 
                SWISS_FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
                HAVE_SWE_FILES = False
        else:
            SWISS_FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
            HAVE_SWE_FILES = False

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
        order = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","TrueNode","Chiron"]
        for name in order:
            if name not in lons: continue
            lon = lons[name]
            sign, deg_in_sign, _ = deg_to_signpos(lon)
            house_i = house_index_for_longitude(houses, lon)
            retro = _retrograde_swiss(dt_utc, name) if HAVE_SWE else _retrograde_pyephem(dt_utc, name)
            planets[name] = {"lon": lon, "sign": sign, "deg": deg_in_sign, "house": house_i, "retro": retro}

        pof_lon = part_of_fortune(asc, planets["Sun"]["lon"], planets["Moon"]["lon"], day_chart)
        s, d, _ = deg_to_signpos(pof_lon)
        planets["PartOfFortune"] = {"lon": pof_lon, "sign": s, "deg": d,
                                    "house": house_index_for_longitude(houses, pof_lon), "retro": False}

        aspects = find_aspects({k: v["lon"] for k,v in planets.items() if k != "PartOfFortune"})

        phase_name, phase_angle = moon_phase_info_from_lons(lons["Sun"], lons["Moon"])
        
        # House ↔ sign analytics
        house_splits = house_sign_breakdown(houses)
        cusp_sign_list = cusp_signs(houses)
        intercepts = intercepted_signs(houses)

                              # -------------------------------------------------------------
        # ASTEROID CALCULATIONS
        # -------------------------------------------------------------
        calculated_asteroids: Dict[str, Dict] = {}
        requested_asteroids = getattr(request, "asteroids", []) or []

        if HAVE_SWE and requested_asteroids:
            import swisseph as swe
            SE_AST_OFFSET = 10000
            
            # Convert dt_utc to Julian Day for Swiss Ephemeris
            hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
            tjd_ut = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour_decimal)

            for ast_id in requested_asteroids:
                body_flag = SE_AST_OFFSET + int(ast_id)
                lon = None
                retro = False
                
                try:
                    # 1. High-precision Swiss Ephemeris file lookup
                    res, flag = swe.calc_ut(tjd_ut, body_flag, swe.FLG_SWIEPH | swe.FLG_SPEED)
                    lon = float(res[0])
                    retro = bool(res[3] < 0)
                except swe.Error:
                    try:
                        # 2. Moshier semi-analytical fallback
                        res, flag = swe.calc_ut(tjd_ut, body_flag, swe.FLG_MOSEPH | swe.FLG_SPEED)
                        lon = float(res[0])
                        retro = bool(res[3] < 0)
                    except swe.Error:
                        continue

                if lon is not None:
                    s, d, _ = deg_to_signpos(lon)
                    h_i = house_index_for_longitude(houses, lon)
                    calculated_asteroids[str(ast_id)] = {
                        "id": int(ast_id),
                        "lon": lon,
                        "sign": s,
                        "deg": d,
                        "house": h_i,
                        "retro": retro
                    }
        return {
            "datetime_utc": dt_utc.isoformat(),
            "location": {"lat": lat, "lon": lon_east, "tz": tz_name},
            "angles": {"ASC": asc, "DS": norm360(asc+180), "MC": mc, "IC": norm360(mc+180)},
            "houses": houses, "house_system": hs,
            "planets": planets,
            "asteroids": calculated_asteroids,
            "aspects": aspects,
            "moon_phase": {"name": phase_name, "angle": phase_angle},
            "sect": "DAY" if day_chart else "NIGHT",
            "house_signs": house_splits,            # list[house] -> list of {sign, deg, percent}
            "cusp_signs": cusp_sign_list,           # list of signs on each cusp
            "intercepted_signs": intercepts,        # signs with no cusps
        }
