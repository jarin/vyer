import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;
const API_BASE_URL = 'https://api.kaveland.no/forsinka/stop/';

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for transit delay data
app.get('/api/stop/:stopName', async (req, res) => {
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
    console.error('Error fetching data:', error);
    res.status(500).json({
      error: 'Failed to fetch transit data',
      message: error.message
    });
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
