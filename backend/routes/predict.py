from fastapi import APIRouter, Query, Request
from models.predictor import forecast

router = APIRouter()


@router.get("/predict")
def get_forecast(request: Request, horizon: str = Query("day", pattern="^(day|week)$")):
    df = request.app.state.get_data()
    return forecast(df, horizon)
