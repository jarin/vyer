import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.kaveland.no/forsinka/stop/';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3001'];
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure CORS with restricted origins
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Input validation middleware
const validateStopName = (req, res, next) => {
  const stopName = decodeURIComponent(req.params.stopName);

  // Validate stop name: max 100 chars, letters, spaces, hyphens, Norwegian chars
  if (!stopName || stopName.length > 100 || !/^[a-zA-ZæøåÆØÅ\s\-0-9]+$/.test(stopName)) {
    return res.status(400).json({
      error: 'Invalid stop name. Use letters, numbers, spaces, and hyphens only.'
    });
  }

  next();
};

// Proxy endpoint for transit delay data
app.get('/api/stop/:stopName', validateStopName, async (req, res) => {
  try {
    const stopName = decodeURIComponent(req.params.stopName);
    const apiUrl = `${API_BASE_URL}${encodeURIComponent(stopName)}`;

    console.log(`Fetching data for stop: ${stopName}`);
    console.log(`API URL: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`Successfully fetched ${data.length} journeys`);
    res.json(data);
  } catch (error) {
    // Log full error details server-side
    console.error('Error fetching data:', error);

    // Don't expose internal error details in production
    const errorResponse = NODE_ENV === 'production'
      ? { error: 'Failed to fetch transit data' }
      : { error: 'Failed to fetch transit data', message: error.message };

    res.status(500).json(errorResponse);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Transit Delay Proxy Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Transit Delay Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to ${API_BASE_URL}`);
  console.log(`✅ CORS enabled for frontend requests`);
});
