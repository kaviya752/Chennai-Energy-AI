import pandas as pd
from fastapi import APIRouter, Request
from models.anomaly import detect
from models.predictor import forecast

router = APIRouter()

_PEAK_HOURS = set(range(6, 10)) | set(range(18, 23))


@router.get("/recommendations")
def get_recommendations(request: Request):
    df = request.app.state.get_data()
    recs = []

    recent_anomalies = detect(df, days=7)
    high_count = sum(1 for a in recent_anomalies if a["severity"] == "high")
    if high_count >= 2:
        recs.append({
            "id": "rec-1", "priority": "high", "category": "Maintenance",
            "title": "Schedule Appliance Inspection",
            "description": f"{high_count} high-severity anomalies detected in the last 7 days. A faulty appliance or wiring issue may be the cause.",
            "estimated_saving": "10–20% reduction in unexpected spikes",
        })

    fcast = forecast(df, "day")
    total_tomorrow = fcast["summary"]["total_predicted_kwh"]
    avg_today = float(df.tail(24)["consumption_kwh"].sum())

    if total_tomorrow > avg_today * 1.15:
        recs.append({
            "id": "rec-2", "priority": "high", "category": "Load Shifting",
            "title": "Shift Heavy Loads to Off-Peak Hours",
            "description": "Tomorrow's usage is predicted 15%+ above today. Run washing machines, dishwashers, and water heaters between 11 PM and 5 AM to avoid TANGEDCO peak tariff charges.",
            "estimated_saving": "₹120–₹180 on monthly bill",
        })

    current_month = pd.Timestamp(df["timestamp"].iloc[-1]).month
    if current_month in {4, 5, 6}:
        recs.append({
            "id": "rec-3", "priority": "medium", "category": "Seasonal",
            "title": "Pre-Cool Before Evening Peak",
            "description": "Chennai summer AC usage peaks from 6–10 PM. Set AC to 24°C and pre-cool rooms before 5:30 PM to reduce compressor load during TANGEDCO peak tariff window.",
            "estimated_saving": "8–12% on cooling costs",
        })

    monthly_units = float(df.tail(30 * 24)["consumption_kwh"].sum())
    if monthly_units > 200:
        slab = "Slab 3 (201–500 units)" if monthly_units <= 500 else "Slab 4 (500+ units)"
        target_slab = "Slab 2 (101–200 units)" if monthly_units <= 300 else "Slab 3 (201–500 units)"
        recs.append({
            "id": "rec-4", "priority": "medium", "category": "Tariff Optimization",
            "title": "Reduce Consumption to Drop a TANGEDCO Tariff Slab",
            "description": f"Your 30-day usage is ~{monthly_units:.0f} kWh ({slab}). Reducing by 15% would move you to {target_slab} and lower your per-unit rate.",
            "estimated_saving": "₹200–₹400 per month",
        })

    recs.append({
        "id": "rec-5", "priority": "low", "category": "Habit",
        "title": "Avoid Using High-Wattage Appliances During 6–9 AM & 6–10 PM",
        "description": "TANGEDCO applies peak tariff during these hours. Defer ironing, EV charging, and water heater use to off-peak hours for maximum savings.",
        "estimated_saving": "5–10% on monthly bill",
    })

    return {"recommendations": recs, "generated_at": df["timestamp"].iloc[-1]}
