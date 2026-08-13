# Chennai Energy AI

An intelligent residential energy monitoring, forecasting, anomaly detection, and tariff optimization platform tailored for Chennai power consumers under the TANGEDCO (Tamil Nadu Generation and Distribution Corporation) billing system.

---

## Overview

Chennai Energy AI provides real-time visibility into domestic electricity consumption, estimates live energy expenditure based on TANGEDCO tariff slabs, predicts future loads using time-series forecasting, and identifies anomalous power usage through statistical and machine learning models.

GitHub Repository: https://github.com/kaviya752/Chennai-Energy-AI.git  
Author: [kaviya752](https://github.com/kaviya752)

---

## Key Features

- **Live TANGEDCO Bill Clock**: Calculates real-time estimated energy expenditure, current per-unit rates, per-second costs, and active tariff slabs.
- **Time-Series Energy Forecasting**: Uses Holt-Winters Exponential Smoothing models with 24-hour seasonality and confidence intervals to predict 24-hour and 7-day future load patterns.
- **Hybrid Anomaly Detection**: Combines rolling 24-hour Z-Score analysis with Isolation Forest machine learning to detect unusual spikes, dips, nighttime leaks, and summer air-conditioning overloads.
- **Tariff & Cost Optimization Tips**: Generates proactive recommendations for load shifting to off-peak hours (11 PM - 5 AM), avoiding peak tariff penalties, and dropping down TANGEDCO consumption slabs.
- **Bilingual Interface**: Supports seamless English and Tamil language switching.
- **Interactive Visualizations**: High-performance responsive charts powered by Recharts, showing historical consumption, confidence intervals, and anomaly timelines.
- **Hardware Integration Option**: Can consume synthetic data or connect directly to real Tapo P115 smart plugs via background polling.

---

## Screenshots

### 1. Overview Dashboard and Live Bill Clock
Real-time tracking of current daily usage, active tariff rates, estimated spending, and consumption history.

![Overview Dashboard](screenshots/overview.png)

### 2. Time-Series Predictions & Load Forecasting
24-hour and 7-day predictive models with confidence bands, peak hour identification, and optimal energy-saving windows.

![Energy Forecast](screenshots/predictions.png)

### 3. Anomaly Detection & Severity Timeline
Interactive 30-day timeline showing detected consumption anomalies mapped against normal consumption baselines.

![Anomaly Timeline](screenshots/anomalies.png)

### 4. Anomaly Breakdown & Logs
Detailed anomaly event logs categorizing spikes, dips, peak-hour deviations, and potential hardware faults.

![Anomaly Details](screenshots/anomaly_details.png)

### 5. AI Recommendations & Tariff Insights
Rule-driven and ML-informed insights tailored to Chennai weather patterns and TANGEDCO tariff brackets.

![AI Recommendations](screenshots/recommendations.png)

---

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Server**: Uvicorn
- **Machine Learning & Time Series**: scikit-learn (Isolation Forest), statsmodels (Holt-Winters Exponential Smoothing), SciPy, NumPy, Pandas
- **Communication**: REST APIs with CORS Middleware

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS, PostCSS
- **Data Visualization**: Recharts
- **HTTP Client**: Axios

---

## Project Structure

```text
Chennai-Energy-AI/
├── backend/
│   ├── data/
│   │   ├── generator.py         # Synthetic smart meter dataset generator
│   │   └── smart_plug.py        # Tapo P115 smart plug hardware integration
│   ├── models/
│   │   ├── anomaly.py           # Isolation Forest + Rolling Z-Score anomaly engine
│   │   └── predictor.py         # Holt-Winters Exponential Smoothing forecaster
│   ├── routes/
│   │   ├── anomaly.py           # Anomaly detection endpoints
│   │   ├── chat.py              # Energy AI assistant chat endpoint
│   │   ├── energy.py            # Historical consumption endpoint
│   │   ├── predict.py           # Future consumption forecast endpoint
│   │   └── recommendations.py   # Tariff optimization recommendations endpoint
│   ├── main.py                  # FastAPI application entry point
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API service client
│   │   ├── components/          # Modular UI components
│   │   ├── App.jsx              # Main React container
│   │   ├── i18n.js              # English / Tamil localization dictionary
│   │   ├── index.css            # Custom CSS & design system tokens
│   │   └── main.jsx             # React entry point
│   ├── index.html               # Web application index
│   ├── package.json             # Node dependencies and scripts
│   ├── tailwind.config.js       # Tailwind CSS theme configuration
│   └── vite.config.js           # Vite dev server and proxy configuration
├── screenshots/                 # Application screenshots
└── README.md                    # Project documentation
```

---

## Getting Started

### Prerequisites
- Python 3.9 or higher
- Node.js 18.x or higher and npm
- Git

---

### Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The backend will be available at:
   - API Root: `http://localhost:8000`
   - Interactive Swagger API Docs: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/api/health`

---

### Frontend Setup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System status and active data source mode |
| `GET` | `/api/energy?days={n}` | Historical hourly energy readings for last N days |
| `GET` | `/api/predict?horizon={day\|week}` | Forecasted consumption values with confidence intervals |
| `GET` | `/api/anomalies?days={n}` | Detected anomaly points and associated severity levels |
| `GET` | `/api/recommendations` | Tariff optimization and load-shifting suggestions |
| `POST` | `/api/chat` | AI energy assistant chatbot queries |

---

## Configuration

To switch between synthetic data generation and live TP-Link Tapo smart plug telemetry:

- **Default (Synthetic Data)**:
  ```powershell
  $env:USE_SMART_PLUG="false"
  uvicorn main:app --reload --port 8000
  ```

- **Smart Plug Mode**:
  ```powershell
  $env:USE_SMART_PLUG="true"
  uvicorn main:app --reload --port 8000
  ```

---

## License

This project is licensed under the MIT License.
