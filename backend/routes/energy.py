from fastapi import APIRouter, Query, Request

router = APIRouter()


@router.get("/energy")
def get_energy(request: Request, days: int = Query(30, ge=1, le=90)):
    # Always fetch latest data (important when using real smart plug)
    df = request.app.state.get_data()
    rows = df.tail(days * 24)
    return rows[["timestamp", "consumption_kwh", "temperature_c", "is_peak_hour", "is_weekend"]].to_dict(orient="records")


@router.get("/energy/live")
def get_live(request: Request):
    """Latest single reading — used by the Bill Clock for real-time updates."""
    df = request.app.state.get_data()
    if df.empty:
        return {"consumption_kwh": 0, "timestamp": None}
    latest = df.iloc[-1]
    return {
        "timestamp":       latest["timestamp"],
        "consumption_kwh": latest["consumption_kwh"],
        "is_peak_hour":    bool(latest["is_peak_hour"]),
        "watts_now":       float(latest.get("watts_now", latest["consumption_kwh"] * 1000)),
    }
