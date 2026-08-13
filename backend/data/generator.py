import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

# Chennai climate: peak summer Apr-Jun (38-42°C), monsoon Oct-Dec, mild Jan-Mar
_MONTH_TEMP = {1:27, 2:29, 3:32, 4:36, 5:39, 6:38, 7:35, 8:34, 9:33, 10:30, 11:28, 12:27}
_MONTH_BASE_FACTOR = {1:1.0, 2:1.05, 3:1.2, 4:1.5, 5:1.65, 6:1.6, 7:1.4, 8:1.35, 9:1.3, 10:1.1, 11:1.0, 12:0.95}

# TANGEDCO peak hours: 6-9 AM and 18-22 (6-10 PM)
_PEAK_HOURS = set(range(6, 10)) | set(range(18, 23))

# Festival dates (month, day) → multiplier
_FESTIVALS = {
    (1, 14): 1.8, (1, 15): 1.8,   # Pongal
    (1, 26): 1.3,                   # Republic Day
    (4, 14): 1.85, (4, 15): 1.75,  # Tamil New Year
    (10, 20): 1.7, (10, 21): 1.8,  # Diwali (approx)
    (11, 1): 1.3,                   # Deepavali aftermath
}

# Injected anomaly windows: (offset_days_from_start, duration_hours, type)
_ANOMALY_SEEDS = [
    (8,  3,  "spike"),       # equipment fault
    (17, 6,  "sustained"),   # forgotten AC
    (25, 1,  "dip"),         # tripped breaker
    (33, 2,  "spike"),
    (45, 8,  "sustained"),
    (58, 1,  "dip"),
    (72, 3,  "spike"),
]


def _hourly_base(hour: int, month: int, is_weekend: bool) -> float:
    """Deterministic base load before noise."""
    base = 3.5  # kWh baseline residential

    # Diurnal pattern
    if 0 <= hour < 5:
        diurnal = 0.5
    elif 5 <= hour < 8:
        diurnal = 1.1
    elif 8 <= hour < 12:
        diurnal = 1.3
    elif 12 <= hour < 15:
        diurnal = 1.5  # noon AC peak
    elif 15 <= hour < 18:
        diurnal = 1.2
    elif 18 <= hour < 22:
        diurnal = 1.45  # evening peak
    else:
        diurnal = 0.8

    seasonal = _MONTH_BASE_FACTOR[month]
    weekend_adj = 1.1 if is_weekend else 1.0
    peak_adj = 1.35 if hour in _PEAK_HOURS else 1.0

    return base * diurnal * seasonal * weekend_adj * peak_adj


def generate_data(days: int = 90, end_date: Optional[datetime] = None) -> pd.DataFrame:
    """Generate Chennai residential energy consumption data."""
    if end_date is None:
        end_date = datetime(2026, 4, 20, 23, 0, 0)
    start_date = end_date - timedelta(days=days - 1)

    rng = np.random.default_rng(42)
    records = []

    # Build anomaly index: set of (day_offset, hour) → (type, multiplier)
    anomaly_map: dict[tuple[int, int], tuple[str, float]] = {}
    for day_off, dur, atype in _ANOMALY_SEEDS:
        start_hour = rng.integers(2, 20)
        mult = (3.2 if atype == "spike" else (2.0 if atype == "sustained" else 0.15))
        for h in range(dur):
            anomaly_map[(day_off, (start_hour + h) % 24)] = (atype, mult)

    for day_idx in range(days * 24):
        d = day_idx // 24
        h = day_idx % 24
        ts = start_date + timedelta(hours=day_idx)
        month = ts.month
        is_weekend = ts.weekday() >= 5

        base = _hourly_base(h, month, is_weekend)
        noise = rng.normal(0, base * 0.07)
        consumption = max(0.1, base + noise)

        is_anomaly = False
        anomaly_type = None
        if (d, h) in anomaly_map:
            atype, mult = anomaly_map[(d, h)]
            consumption = consumption * mult if atype != "dip" else consumption * mult
            is_anomaly = True
            anomaly_type = atype

        festival_key = (month, ts.day)
        if festival_key in _FESTIVALS:
            consumption *= _FESTIVALS[festival_key]

        temp = _MONTH_TEMP[month] + rng.normal(0, 1.5)

        records.append({
            "timestamp": ts.isoformat(),
            "consumption_kwh": round(float(consumption), 3),
            "temperature_c": round(float(temp), 1),
            "is_peak_hour": h in _PEAK_HOURS,
            "is_weekend": is_weekend,
            "is_anomaly": is_anomaly,
            "anomaly_type": anomaly_type,
            "month": month,
            "hour": h,
        })

    return pd.DataFrame(records)


_cached_df: Optional[pd.DataFrame] = None


def get_data() -> pd.DataFrame:
    global _cached_df
    if _cached_df is None:
        _cached_df = generate_data()
    return _cached_df
