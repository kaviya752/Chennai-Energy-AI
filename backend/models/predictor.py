import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def _train_model(series: pd.Series) -> ExponentialSmoothing:
    model = ExponentialSmoothing(
        series,
        trend="add",
        seasonal="add",
        seasonal_periods=24,  # hourly data → daily seasonality
        damped_trend=True,
    )
    return model.fit(optimized=True, use_brute=False)


def forecast(df: pd.DataFrame, horizon: str = "day") -> dict:
    """
    Predict next 24h (day) or next 7 days (week) using Holt-Winters.
    Returns forecast list + summary stats.
    """
    hours = 24 if horizon == "day" else 168

    series = df["consumption_kwh"].tail(60 * 24).reset_index(drop=True)
    fit = _train_model(series)

    pred = fit.forecast(hours)
    # Simple confidence interval: ±10% of prediction
    lower = pred * 0.90
    upper = pred * 1.10

    last_ts = pd.Timestamp(df["timestamp"].iloc[-1])
    future_ts = [last_ts + pd.Timedelta(hours=i + 1) for i in range(hours)]

    forecast_list = [
        {
            "timestamp": ts.isoformat(),
            "yhat": round(float(y), 3),
            "yhat_lower": round(float(lo), 3),
            "yhat_upper": round(float(hi), 3),
        }
        for ts, y, lo, hi in zip(future_ts, pred, lower, upper)
    ]

    total_kwh = round(float(pred.sum()), 2)
    peak_idx = int(np.argmax(pred))
    peak_hour = future_ts[peak_idx].hour
    best_saving_window = "11 PM – 5 AM" if peak_hour in range(6, 23) else "5 AM – 6 AM"

    return {
        "horizon": horizon,
        "forecast": forecast_list,
        "summary": {
            "total_predicted_kwh": total_kwh,
            "peak_hour": peak_hour,
            "best_saving_window": best_saving_window,
            "avg_predicted_kwh": round(total_kwh / hours, 3),
        },
    }
