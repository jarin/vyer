# Transit Delay Visualizer 🚆

A humorous and informative visualization of Norwegian transit delays using D3.js and TypeScript.

## Features

### 🏁 Race Track Mode
- **Visual race track** where transit lines compete as runners
- **Ghost runners** show ideal on-time positions
- **Actual runners** (with emojis!) show current positions based on delay
- Color-coded delays from green (early) to red (very late)
- Humorous labels like "Time Traveler!", "Taking the scenic route", "Is it even moving?"

### 🤓 Geek Mode (Scientific View)
Professional statistical visualizations including:
- **Histogram**: Frequency distribution of delays
- **Box Plot**: Delay statistics by transit line (quartiles, outliers)
- **Timeline**: Scheduled vs actual arrival times
- **Scatter Plot**: Delay patterns over time
- **Cumulative Distribution**: Percentile analysis (P50, P90, P95)

### 📊 Statistics Dashboard
- Total active journeys
- Average delay
- Worst delay
- Chaos score (measures unpredictability)

### 🔄 Additional Features
- **Stop picker**: View delays at any Norwegian transit stop
- **Auto-refresh**: Updates every 60 seconds with countdown
- **Manual refresh**: Button to reload data immediately
- **CORS proxy**: Node.js backend to bypass API restrictions

## Installation

```bash
npm install
```

## Running the App

```bash
npm run dev
```

This starts:
- Backend proxy server on http://localhost:3001
- Frontend on http://localhost:5173 (or similar)

Open the frontend URL in your browser!

## Running Components Separately

```bash
# Backend only
npm run server

# Frontend only
npm run frontend
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## How It Works

1. **Frontend** (TypeScript + D3.js) makes requests to the local proxy
2. **Backend** (Express) fetches data from `api.kaveland.no` and forwards it
3. **Data** is visualized in two modes: fun race track or scientific charts

## Data Source

Transit delay data from: https://api.kaveland.no/forsinka/stop/[STOP_NAME]

## Technologies

- **TypeScript** - Type-safe code
- **D3.js v7** - Data visualization
- **Express** - Backend proxy server
- **Vite** - Fast build tool
- **CORS** - Enable cross-origin requests

## Try Different Stops

Some Norwegian transit stops to try:
- Lysaker stasjon
- Oslo S
- Nationaltheatret stasjon
- Skøyen stasjon
- Majorstuen

## License

MIT
