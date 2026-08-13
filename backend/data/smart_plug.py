"""
Real-time energy data collection from TP-Link Tapo P115 smart plugs.

Each plug monitors one appliance. The collector polls every 60 seconds,
builds a rolling DataFrame in the same shape as the synthetic generator,
and exposes get_data() so the rest of the backend needs zero changes.
"""

import os
import asyncio
import threading
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
from tapo import ApiClient

# ── Config (set these as environment variables or edit here) ──────────────────
TAPO_EMAIL    = os.environ.get("TAPO_EMAIL", "your_tapo_email@gmail.com")
TAPO_PASSWORD = os.environ.get("TAPO_PASSWORD", "your_tapo_password")

# Add as many plugs as you have. Key = friendly name, value = local IP address.
PLUG_IPS = {
    "AC":             os.environ.get("PLUG_IP_AC",      "192.168.1.101"),
    "Fridge":         os.environ.get("PLUG_IP_FRIDGE",  "192.168.1.102"),
    "WashingMachine": os.environ.get("PLUG_IP_WASHING", "192.168.1.103"),
}

# How often to poll plugs (seconds)
POLL_INTERVAL = 60

# How many hours of history to keep in memory
HISTORY_HOURS = 24 * 90  # 90 days

# Peak hours defined by TANGEDCO
_PEAK_HOURS = set(range(6, 10)) | set(range(18, 23))

# ── In-memory store ───────────────────────────────────────────────────────────
_records: list[dict] = []
_lock = threading.Lock()


async def _read_single_plug(client: ApiClient, name: str, ip: str) -> Optional[dict]:
    """Poll one plug and return a single reading dict."""
    try:
        device = await client.p115(ip)

        current_power = await device.get_current_power()
        energy_usage  = await device.get_energy_usage()
        device_info   = await device.get_device_info()

        # current_power.current_power is in milliwatts → convert to watts
        watts = (current_power.current_power or 0) / 1000.0

        # kWh consumed in this 1-minute window = watts × (1/60 hour) / 1000
        kwh_this_minute = watts * (POLL_INTERVAL / 3600) / 1000.0

        now = datetime.now()
        return {
            "timestamp":       now.isoformat(),
            "appliance":       name,
            "ip":              ip,
            "watts_now":       round(watts, 1),
            "consumption_kwh": round(kwh_this_minute, 4),
            "today_kwh":       round((energy_usage.today_energy or 0) / 1000.0, 3),
            "month_kwh":       round((energy_usage.month_energy or 0) / 1000.0, 3),
            "is_on":           device_info.device_on,
            "temperature_c":   25.0,   # plug doesn't have a temp sensor; use a default
            "is_peak_hour":    now.hour in _PEAK_HOURS,
            "is_weekend":      now.weekday() >= 5,
            "is_anomaly":      False,
            "anomaly_type":    None,
            "month":           now.month,
            "hour":            now.hour,
        }
    except Exception as exc:
        print(f"[SmartPlug] Could not read {name} ({ip}): {exc}")
        return None


async def _poll_all_plugs():
    """Poll every configured plug once and append results to _records."""
    try:
        client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
        tasks  = [_read_single_plug(client, name, ip) for name, ip in PLUG_IPS.items()]
        results = await asyncio.gather(*tasks)

        now = datetime.now()
        total_kwh = sum(r["consumption_kwh"] for r in results if r)

        # Store one combined record per poll interval (sum of all plugs)
        combined = {
            "timestamp":       now.isoformat(),
            "consumption_kwh": round(total_kwh, 4),
            "temperature_c":   25.0,
            "is_peak_hour":    now.hour in _PEAK_HOURS,
            "is_weekend":      now.weekday() >= 5,
            "is_anomaly":      False,
            "anomaly_type":    None,
            "month":           now.month,
            "hour":            now.hour,
            # Per-appliance breakdown stored for debugging
            "appliances":      {r["appliance"]: r for r in results if r},
        }

        with _lock:
            _records.append(combined)
            # Keep only the last HISTORY_HOURS worth of per-minute records
            max_records = HISTORY_HOURS * (3600 // POLL_INTERVAL)
            if len(_records) > max_records:
                del _records[:-max_records]

        plugs_ok = sum(1 for r in results if r)
        print(f"[SmartPlug] Polled {plugs_ok}/{len(PLUG_IPS)} plugs → {total_kwh:.4f} kWh this minute")

    except Exception as exc:
        print(f"[SmartPlug] Poll failed: {exc}")


def _background_loop():
    """Run the asyncio polling loop in a background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def run():
        print(f"[SmartPlug] Starting — polling {len(PLUG_IPS)} plug(s) every {POLL_INTERVAL}s")
        # Do an immediate first poll so data is available on startup
        await _poll_all_plugs()
        while True:
            await asyncio.sleep(POLL_INTERVAL)
            await _poll_all_plugs()

    loop.run_until_complete(run())


def start_polling():
    """Call once at app startup to begin background plug polling."""
    thread = threading.Thread(target=_background_loop, daemon=True)
    thread.start()


def get_data() -> pd.DataFrame:
    """
    Return a DataFrame of all recorded readings.
    Shape matches the synthetic generator so the rest of the backend
    (anomaly detection, forecasting, recommendations) needs no changes.

    Falls back to synthetic data if fewer than 24 real readings exist
    (i.e., the plugs have been running for less than 24 minutes).
    """
    with _lock:
        records_copy = list(_records)

    if len(records_copy) < 24:
        print("[SmartPlug] Not enough real data yet — using synthetic fallback")
        from data.generator import generate_data
        return generate_data()

    df = pd.DataFrame(records_copy)

    # Drop per-appliance dict column before returning (not needed by models)
    if "appliances" in df.columns:
        df = df.drop(columns=["appliances"])

    return df.reset_index(drop=True)


def get_live_reading() -> Optional[dict]:
    """Return the most recent single reading, or None if no data yet."""
    with _lock:
        return _records[-1] if _records else None


def get_appliance_breakdown() -> dict:
    """Return the latest per-appliance readings for the dashboard."""
    with _lock:
        if not _records:
            return {}
        latest = _records[-1]
        return latest.get("appliances", {})
