from fastapi.staticfiles import StaticFiles
from pathlib import Path

static_path = Path(__file__).resolve().parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
