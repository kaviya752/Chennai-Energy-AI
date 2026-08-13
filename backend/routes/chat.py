import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_SYSTEM_PROMPT = """You are an AI energy advisor for Chennai, Tamil Nadu, India.
You help residents understand their electricity bills, reduce consumption, and navigate TANGEDCO tariffs.
You know about: seasonal patterns (summer AC usage, monsoon), TANGEDCO tariff slabs, peak hours (6-9 AM, 6-10 PM), energy-saving tips for Chennai homes.
Keep answers concise (3-5 sentences). Be specific to Chennai/Tamil Nadu context.
If the user writes in Tamil, respond in Tamil. If in English, respond in English.
Do not make up data — if you don't know, say so."""

OLLAMA_URL   = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL   = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

# ── Keyword-based smart fallback ──────────────────────────────────────────────
_KB_EN = [
    # (keywords, answer)
    (["hello", "hi", "hey", "start", "help"],
     "Hello! 👋 I'm your Chennai Energy AI assistant. Ask me anything — your electricity bill, how to save energy, what causes spikes, or how TANGEDCO tariffs work. I'm here to help!"),
    (["ac", "air condition", "cooling", "temperature", "summer", "heat"],
     "During Chennai summers (Apr–Jun), AC can account for 60% of your bill. Set it to 24°C, clean the filter monthly, and use ceiling fans to feel cooler at a higher AC temperature. Pre-cool your room before 6 PM to avoid peak-tariff hours."),
    (["bill", "slab", "tariff", "unit", "rate", "charge", "tangedco", "cost", "expensive"],
     "TANGEDCO charges ₹0 for 0–100 units (Slab 1), ₹1.50/unit for 101–200 (Slab 2), ₹3/unit for 201–500 (Slab 3), and ₹5/unit beyond 500. Keeping usage under 200 units/month gives you the best rate. Your meter reading resets every month."),
    (["peak", "hour", "time", "when", "morning", "evening", "night", "off-peak"],
     "TANGEDCO peak tariff hours are 6–9 AM and 6–10 PM daily. Avoid running washing machines, water heaters, irons, or EV chargers during these times. The best time to run heavy appliances is 11 PM–5 AM when the grid is cheapest."),
    (["spike", "anomaly", "unusual", "sudden", "fault", "high usage", "jump"],
     "Sudden spikes usually mean: (1) a faulty appliance like an old fridge or water heater with a broken thermostat, (2) someone left a high-wattage device on, or (3) a meter issue. Check your fridge, geyser, and iron first — they are the most common culprits in Chennai homes."),
    (["led", "bulb", "light", "lamp", "tube"],
     "Replacing all bulbs with LED in a typical 2BHK Chennai home saves 40–60 kWh per month — roughly ₹120–₹180 off your bill. LEDs also last 10x longer. Look for BEE 5-star rated LEDs (Philips, Havells, Wipro) at any electrical shop."),
    (["fridge", "refrigerator", "freeze"],
     "Refrigerators run 24/7 and consume 60–120 kWh/month. Keep it at 3–5°C (not colder), don't put hot food directly inside, and clean the coils every 6 months. An old fridge (10+ years) can use 3× more power than a new BEE 5-star model."),
    (["solar", "panel", "rooftop"],
     "Chennai gets excellent solar irradiance (5–6 kWh/m²/day). A 3kW rooftop system costs ₹1.5–2L and can offset 300–360 kWh/month. TANGEDCO's net metering policy lets you sell excess power back. Payback period is typically 4–5 years."),
    (["save", "saving", "reduce", "cut", "lower", "tip", "advice", "how"],
     "Top 5 energy-saving tips for Chennai:\n1. Set AC to 24°C + use fans\n2. Run heavy loads after 10 PM\n3. Replace old bulbs with LED\n4. Fix dripping taps (water heater runs more)\n5. Unplug chargers and TVs on standby — they drain power silently."),
    (["monsoon", "rain", "rainy", "october", "november", "december"],
     "During Chennai's monsoon (Oct–Dec), temperatures drop and AC usage falls. This is the best time to audit your appliances, clean AC filters, and check for water-damaged wiring which can cause energy waste and safety hazards."),
    (["pongal", "diwali", "festival", "holiday", "deepavali"],
     "Festival seasons like Pongal and Diwali see 40–80% higher consumption due to lighting, cooking, and gatherings. Plan ahead: switch to LED string lights (10× more efficient than incandescent), and cook in bulk to reduce oven/stove cycles."),
]

_KB_TA = [
    (["வணக்கம்", "hello", "hi", "hey", "உதவி"],
     "வணக்கம்! 👋 நான் உங்கள் சென்னை எனர்ஜி AI உதவியாளர். மின் பில், மின் சேமிப்பு, TANGEDCO கட்டணம் பற்றி கேளுங்கள் — உதவ தயாராக இருக்கிறேன்!"),
    (["ac", "குளிர்சாதன", "குளிர்", "வெப்பம்", "கோடை"],
     "சென்னை கோடையில் (ஏப்ரல்–ஜூன்) AC மின் நுகர்வில் 60% வரை எடுக்கும். 24°C வைக்கவும், மாதம் ஒருமுறை filter சுத்தம் செய்யவும். மாலை 6 மணிக்கு முன்பே அறையை குளிர்விக்கவும் — peak கட்டண நேரத்தை தவிர்க்கலாம்."),
    (["பில்", "கட்டணம்", "யூனிட்", "விலை", "tangedco", "செலவு"],
     "TANGEDCO கட்டண அடுக்கு: 0–100 யூனிட் = ₹0, 101–200 = ₹1.50/யூனிட், 201–500 = ₹3/யூனிட், 500+ = ₹5/யூனிட். மாதம் 200 யூனிட்டுக்கு கீழ் வைத்தால் மிகவும் சாதகம்."),
    (["peak", "நேரம்", "காலை", "மாலை", "எப்போது"],
     "TANGEDCO peak கட்டண நேரம்: காலை 6–9, மாலை 6–10 மணி. இந்த நேரத்தில் washing machine, water heater, iron பயன்படுத்தாதீர்கள். இரவு 11 மணிக்கு பிறகு இயக்குவது மிகவும் சாதகம்."),
    (["spike", "அதிர்வு", "திடீர்", "கோளாறு", "அசாதாரண"],
     "திடீர் மின் அதிர்வுகளுக்கு பொதுவான காரணங்கள்: (1) பழைய குளிர்சாதனம் அல்லது water heater, (2) யாரோ அதிக watt சாதனத்தை விட்டுவிட்டார்கள், (3) மீட்டர் பிரச்சனை. முதலில் fridge மற்றும் geyser சரிபார்க்கவும்."),
    (["சேமி", "குறைக்க", "எப்படி", "tips", "ஆலோசனை"],
     "சென்னை வீட்டிற்கு 5 எளிய மின் சேமிப்பு வழிகள்:\n1. AC-ஐ 24°C வைக்கவும் + மின்விசிறி பயன்படுத்தவும்\n2. இரவு 10 மணிக்கு பிறகு கனமான சாதனங்களை இயக்கவும்\n3. LED பல்புகளுக்கு மாறவும்\n4. தேவையற்ற charger, TV plug எடுக்கவும்\n5. மாதம் ஒருமுறை மீட்டர் reading எடுத்து track செய்யவும்."),
]


def _keyword_match(text: str, lang: str):
    text_lower = text.lower()
    kb = _KB_TA if lang == "ta" else _KB_EN
    for keywords, answer in kb:
        if any(kw in text_lower for kw in keywords):
            return answer
    return None


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    history: list[dict] = []


async def _call_ollama(messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]


async def _call_groq(messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={"model": GROQ_MODEL, "messages": messages, "max_tokens": 300, "temperature": 0.7},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


@router.post("/chat")
async def chat(req: ChatRequest):
    messages = (
        [{"role": "system", "content": _SYSTEM_PROMPT}]
        + req.history[-6:]
        + [{"role": "user", "content": req.message}]
    )

    # 1. Ollama (local open-source LLM)
    try:
        reply = await _call_ollama(messages)
        return {"reply": reply, "language": req.language, "model": f"ollama/{OLLAMA_MODEL}"}
    except Exception:
        pass

    # 2. Groq (free cloud, open-source models)
    if GROQ_API_KEY:
        try:
            reply = await _call_groq(messages)
            return {"reply": reply, "language": req.language, "model": f"groq/{GROQ_MODEL}"}
        except Exception:
            pass

    # 3. Keyword-based smart fallback
    reply = _keyword_match(req.message, req.language)
    if reply:
        return {"reply": reply, "language": req.language, "model": "fallback"}

    # 4. Generic fallback
    generic = {
        "en": "I can help with: electricity bills, TANGEDCO tariffs, peak hours, AC tips, anomaly explanations, and energy saving advice. Try asking something like 'How do I reduce my bill?' or 'What are peak hours?'",
        "ta": "நான் உதவக்கூடியவை: மின் பில், TANGEDCO கட்டணம், peak நேரம், AC tips, மின் சேமிப்பு. 'பில் எப்படி குறைக்கலாம்?' என கேளுங்கள்.",
    }
    return {"reply": generic.get(req.language, generic["en"]), "language": req.language, "model": "fallback"}
