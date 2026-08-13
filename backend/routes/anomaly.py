from fastapi import APIRouter, Query, Request
from models.anomaly import detect

router = APIRouter()


@router.get("/anomalies")
def get_anomalies(request: Request, days: int = Query(30, ge=1, le=90)):
    df = request.app.state.get_data()
    anomalies = detect(df, days)
    high   = [a for a in anomalies if a["severity"] == "high"]
    medium = [a for a in anomalies if a["severity"] == "medium"]
    low    = [a for a in anomalies if a["severity"] == "low"]
    return {
        "anomalies": anomalies,
        "summary": {"total": len(anomalies), "high": len(high), "medium": len(medium), "low": len(low)},
    }
