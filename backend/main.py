import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Toggle: set USE_SMART_PLUG=true to use real Tapo P115 data ───────────────
USE_SMART_PLUG = os.environ.get("USE_SMART_PLUG", "false").lower() == "true"

if USE_SMART_PLUG:
    from data.smart_plug import get_data, start_polling
else:
    from data.generator import get_data

from routes.energy import router as energy_router
from routes.predict import router as predict_router
from routes.anomaly import router as anomaly_router
from routes.recommendations import router as rec_router
from routes.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if USE_SMART_PLUG:
        # Start background thread that polls plugs every 60 seconds
        start_polling()
        print("[main] Smart plug polling started")
        # Give first poll a moment to complete before serving requests
        import asyncio
        await asyncio.sleep(3)

    app.state.df       = get_data()
    app.state.get_data = get_data   # store reference so routes can refresh

    yield


app = FastAPI(title="Chennai Energy AI", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(energy_router,  prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(anomaly_router, prefix="/api")
app.include_router(rec_router,     prefix="/api")
app.include_router(chat_router,    prefix="/api")


@app.get("/api/health")
def health():
    mode = "smart_plug" if USE_SMART_PLUG else "synthetic"
    return {"status": "ok", "data_source": mode}
