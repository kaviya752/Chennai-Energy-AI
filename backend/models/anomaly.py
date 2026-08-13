import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Optional

_PEAK_HOURS = set(range(6, 10)) | set(range(18, 23))
_SUMMER_MONTHS = {4, 5, 6}
_FESTIVAL_WINDOWS = {(1, 14), (1, 15), (4, 14), (10, 20), (10, 21)}


def _explain(row: pd.Series, z: float, atype: Optional[str]) -> tuple:
    hour = int(row["hour"])
    month = int(row["month"])
    ts = pd.Timestamp(row["timestamp"])
    festival = (ts.month, ts.day) in _FESTIVAL_WINDOWS

    if atype == "dip" or z < -2.5:
        return "low", "Unexpected low consumption — possible power outage or meter issue"

    if festival:
        return "medium", "Festival/event-related surge in Chennai city grid"

    if z > 3.0:
        if month in _SUMMER_MONTHS and 10 <= hour <= 16:
            return "high", "Possible AC overload or equipment fault — peak summer midday surge"
        return "high", "Critical consumption spike — check high-wattage appliances immediately"

    if z > 2.5:
        if hour in range(22, 24) or hour in range(0, 5):
            return "medium", "Unusual nighttime usage — check high-wattage appliances left on"
        if hour in _PEAK_HOURS:
            return "medium", "Surge during TANGEDCO peak tariff hours — high billing risk"
        return "medium", "Abnormal consumption detected — review recent appliance usage"

    return "low", "Mild deviation from expected usage pattern"


def detect(df: pd.DataFrame, days: int = 30) -> list[dict]:
    window = df.tail(days * 24).copy().reset_index(drop=True)

    # Rolling Z-score on 24h window
    roll = window["consumption_kwh"].rolling(24, min_periods=6)
    window["rolling_mean"] = roll.mean()
    window["rolling_std"] = roll.std().fillna(1.0)
    window["z_score"] = (window["consumption_kwh"] - window["rolling_mean"]) / window["rolling_std"]

    # Isolation Forest on feature matrix
    features = window[["hour", "consumption_kwh", "rolling_mean", "rolling_std"]].fillna(0)
    iso = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
    window["iso_label"] = iso.fit_predict(features)  # -1 = anomaly

    # Union of both methods
    flagged = window[(window["z_score"].abs() > 2.5) | (window["iso_label"] == -1)].copy()

    results = []
    for _, row in flagged.iterrows():
        z = float(row["z_score"])
        # Determine dip vs spike
        atype = "dip" if z < -2.5 else ("spike" if z > 2.5 else "iso")
        severity, explanation = _explain(row, z, atype)
        rm = row["rolling_mean"]
        results.append({
            "timestamp": row["timestamp"],
            "consumption_kwh": round(float(row["consumption_kwh"]), 3),
            "expected_kwh": round(float(rm), 3) if rm == rm else None,
            "z_score": round(z, 2) if z == z else None,
            "severity": severity,
            "anomaly_type": atype,
            "explanation": explanation,
            "is_peak_hour": bool(row["is_peak_hour"]),
        })

    # Drop rows where z_score is NaN (insufficient rolling window data)
    results = [r for r in results if r["z_score"] == r["z_score"]]
    results.sort(key=lambda x: x["timestamp"])
    return results
