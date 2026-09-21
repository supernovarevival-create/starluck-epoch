"""Pydantic models for request and response schemas."""

from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, validator


class GeoLocation(BaseModel):
    lat: float
    lon: float
    elevation_m: Optional[float] = 0.0


class NatalChartRequest(BaseModel):
    """Request model for natal chart calculation."""
    datetime_local: str
    timezone: str
    location: GeoLocation
    house_system: str = Field(
        "PLACIDUS", 
        pattern="^(PLACIDUS|WHOLE|EQUAL|KOCH|REGIOMONTANUS|CAMPANUS|PORPHYRY|ALCABITIUS|TOPOCENTRIC|MORINUS|VEHLOW)$", 
        description="House system"
    )
    asteroids: Optional[List[int]] = []
    star_scope: Optional[str] = "MAJOR_GC"
    star_method: Optional[str] = "COSMIC_ASCENDANCE"

    @validator("datetime_local")
    def validate_datetime(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("Invalid datetime format. Use YYYY-MM-DD HH:MM")


class PlanetPosition(BaseModel):
    """Planet position in the chart."""
    lon: float = Field(..., description="Longitude in degrees")
    sign: str = Field(..., description="Zodiac sign")
    deg: float = Field(..., description="Degrees within the sign")
    house: int = Field(..., ge=1, le=12, description="House number")
    retro: bool = Field(False, description="Is retrograde")


class Angle(BaseModel):
    """Cardinal angle (ASC, MC, etc.)."""
    ASC: float = Field(..., description="Ascendant longitude")
    DS: float = Field(..., description="Descendant longitude")
    MC: float = Field(..., description="Midheaven longitude")
    IC: float = Field(..., description="Imum Coeli longitude")


class Aspect(BaseModel):
    """Aspect between two planets."""
    p1: str = Field(..., description="First planet")
    p2: str = Field(..., description="Second planet")
    aspect: str = Field(..., description="Aspect type")
    glyph: str = Field(..., description="Aspect symbol")
    orb: float = Field(..., description="Orb in degrees")
    off: float = Field(..., description="Orb deviation")


class MoonPhase(BaseModel):
    """Moon phase information."""
    name: str = Field(..., description="Phase name")
    angle: float = Field(..., description="Phase angle in degrees")


class ChartLocation(BaseModel):
    """Chart location information."""
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")
    tz: str = Field(..., description="Timezone")


class FixedStarConjunction(BaseModel):
    star: str
    category: str
    star_lon: float
    star_sign: str
    star_deg: str
    body: str
    body_lon: float
    orb: float
    orb_formatted: str
    star_method: Optional[str] = "COSMIC_ASCENDANCE"
    star_filter: Optional[str] = "ALL"


class NatalChartResponse(BaseModel):
    """Response model for natal chart calculation."""
    datetime_utc: str
    location: Dict[str, Any]
    angles: Dict[str, float]
    houses: List[float]
    house_system: str
    planets: Dict[str, Any]
    asteroids: Optional[Dict[str, Any]] = {}
    fixed_stars: Optional[List[Dict[str, Any]]] = []
    aspects: Optional[List[Union[Aspect, Dict[str, Any], str]]] = []
    moon_phase: Optional[Dict[str, Any]] = {}
    sect: Optional[str] = "DAY"


class SVGRequest(BaseModel):
    """Request model for SVG generation."""
    chart_data: Dict[str, Any] = Field(..., description="Chart data")
    size: int = Field(900, ge=300, le=2000, description="Chart size in pixels")
    show_aspects: bool = Field(True, description="Show aspect lines")


class SVGResponse(BaseModel):
    """Response model for SVG generation."""
    svg_content: str = Field(..., description="SVG content")
    size: int = Field(..., description="Chart size")


class BiwheelRequest(BaseModel):
    """Request model for biwheel generation."""
    inner_chart: Dict[str, Any] = Field(..., description="Inner chart data")
    outer_chart: Dict[str, Any] = Field(..., description="Outer chart data")
    size: int = Field(920, ge=300, le=2000, description="Chart size in pixels")
    label_inner: str = Field("Inner", description="Inner chart label")
    label_outer: str = Field("Outer", description="Outer chart label")
    show_aspects: bool = Field(True, description="Show aspect lines")


class SynastryRequest(BaseModel):
    """Request model for synastry calculation."""
    chart_a: Dict[str, Any] = Field(..., description="First chart data")
    chart_b: Dict[str, Any] = Field(..., description="Second chart data")


class SynastryResponse(BaseModel):
    """Response model for synastry calculation."""
    interaspects: List[Aspect] = Field(..., description="Inter-chart aspects")


class CompositeRequest(BaseModel):
    """Request model for composite calculation."""
    chart_a: Dict[str, Any] = Field(..., description="First chart data")
    chart_b: Dict[str, Any] = Field(..., description="Second chart data")


class CompositeResponse(BaseModel):
    """Response model for composite calculation."""
    midpoints: Dict[str, float] = Field(..., description="Composite midpoints")


class ReportRequest(BaseModel):
    """Request model for report generation."""
    chart_data: Dict[str, Any] = Field(..., description="Chart data")
    title: str = Field("Birth Chart Analysis", description="Report title")


class ReportResponse(BaseModel):
    """Response model for report generation."""
    report_content: str = Field(..., description="Markdown report content")


class ForecastRequest(BaseModel):
    """Request model for transit forecast."""
    natal_chart: Dict[str, Any] = Field(..., description="Natal chart data")
    start_date: str = Field(..., description="Start date in ISO format")
    timezone: str = Field(..., description="Timezone")
    days: int = Field(14, ge=1, le=365, description="Number of days to forecast")
    step_hours: int = Field(24, ge=1, le=168, description="Hours between calculations")


class TransitHit(BaseModel):
    """Transit hit information."""
    when_utc: str = Field(..., description="UTC datetime of transit")
    transit: str = Field(..., description="Transiting planet")
    natal: str = Field(..., description="Natal planet")
    aspect: str = Field(..., description="Aspect type")
    orb_diff: float = Field(..., description="Orb difference")
    is_retrograde: bool = Field(..., description="Is retrograde")
    is_combust: bool = Field(..., description="Is combust")
    natal_house: int = Field(..., description="Natal house")


class ForecastResponse(BaseModel):
    """Response model for transit forecast."""
    transits: List[TransitHit] = Field(..., description="Transit hits")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    swiss_ephemeris: bool = Field(..., description="Swiss Ephemeris availability")
