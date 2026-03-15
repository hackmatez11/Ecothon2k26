# Sentinel-5P AQI Forecast API

FastAPI backend that serves real 14-day AQI forecasts using the trained Sentinel-5P models.

## How it works

```
Open-Meteo Air Quality API (free, no key)
        ↓  CO concentration + European AQI (last ~20 days)
Dense AQI Model  (ecothon_aqi_model.h5)
        ↓  predicted AQI time series
LSTM Forecast    (ecothon_aqi_forecast_model.h5)
        ↓  14-day AQI forecast
JSON response    → citizen frontend
```

## Setup

```bash
cd api
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## Run

From the **repo root**:

```bash
uvicorn api.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/predict?lat=28.6&lng=77.2` | 14-day AQI forecast |

### Example response

```json
{
  "lat": 28.6139,
  "lng": 77.209,
  "current_aqi": 142.3,
  "forecast": [
    { "day": "Today",    "date": "2026-03-14", "aqi": 138.5, "category": "Unhealthy for Sensitive Groups", "color": "#ff7e00" },
    { "day": "Tomorrow", "date": "2026-03-15", "aqi": 145.1, "category": "Unhealthy for Sensitive Groups", "color": "#ff7e00" },
    ...
  ],
  "source": "Sentinel-5P pipeline + Open-Meteo",
  "generated_at": "2026-03-14T10:00:00Z"
}
```

## Notes

- No API keys required — [Open-Meteo](https://open-meteo.com/) is completely free
- Models are loaded from `../sentinel-5p/` relative to this folder
- The frontend falls back to a deterministic estimate if this server is not running
