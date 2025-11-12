/**
 * Fetches and processes transit delay data from Kaveland API
 */

import type { TransitJourney, StationDelayInfo } from './delay-types';
import { getDelayCategory } from './delay-types';
import { railwayData } from '../data/railway-data';

const API_BASE_URL = 'http://localhost:3001/api/stop/';
const FETCH_INTERVAL_MS = 30000; // 30 seconds

// Cache successful API name mappings to avoid repeated failed requests
const stationNameCache = new Map<string, string | null>();

/**
 * Generate possible API name variations for a station
 */
function generateStationNameVariations(stationName: string): string[] {
  const variations: string[] = [];

  // Original name
  variations.push(stationName);

  // Add "stasjon" suffix if not present
  if (!stationName.toLowerCase().includes('stasjon')) {
    variations.push(`${stationName} stasjon`);

    // For names ending in "S", try replacing with "stasjon"
    if (stationName.endsWith(' S')) {
      const baseName = stationName.slice(0, -2);
      variations.push(`${baseName} stasjon`);
      variations.push(baseName);
    }
  }

  // Remove "S" suffix and try variations
  if (stationName.endsWith(' S')) {
    const withoutS = stationName.slice(0, -2);
    variations.push(withoutS);
  }

  // Try lowercase version
  variations.push(stationName.toLowerCase());

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Try to fetch data from API with a specific station name
 * Returns the journeys if successful, null if no data
 */
async function tryFetchStation(stationName: string): Promise<TransitJourney[] | null> {
  try {
    const encodedStation = encodeURIComponent(stationName);
    const response = await fetch(`${API_BASE_URL}${encodedStation}`);

    if (!response.ok) {
      return null;
    }

    const data: TransitJourney[] = await response.json();

    // Check if we got valid data
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Find the correct API name for a station by trying variations
 * Caches successful mappings to avoid repeated requests
 */
async function findWorkingApiName(stationName: string): Promise<string | null> {
  // Check cache first
  if (stationNameCache.has(stationName)) {
    return stationNameCache.get(stationName)!;
  }

  const variations = generateStationNameVariations(stationName);

  // Try each variation until we find one that works
  for (const variation of variations) {
    const data = await tryFetchStation(variation);
    if (data !== null) {
      console.log(`✓ Found API name for "${stationName}": "${variation}"`);
      stationNameCache.set(stationName, variation);
      return variation;
    }
  }

  // No working name found
  console.log(`✗ No API data found for "${stationName}" (tried ${variations.length} variations)`);
  stationNameCache.set(stationName, null);
  return null;
}

/**
 * Normalize station names for matching
 */
function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+stasjon$/i, '')
    .replace(/\s+s$/i, '')
    .trim();
}

/**
 * Find matching 3D railway station name from API station name
 */
function find3DStationName(apiStationName: string): string | null {
  const normalized = normalizeStationName(apiStationName);

  // Find exact match first
  for (const stationName of Object.keys(railwayData.stations)) {
    if (normalizeStationName(stationName) === normalized) {
      return stationName;
    }
  }

  // Try partial match
  for (const stationName of Object.keys(railwayData.stations)) {
    if (normalizeStationName(stationName).includes(normalized) ||
        normalized.includes(normalizeStationName(stationName))) {
      return stationName;
    }
  }

  return null;
}

/**
 * Aggregate delay information by station
 */
function aggregateDelaysByStation(journeys: TransitJourney[]): Map<string, StationDelayInfo> {
  const stationMap = new Map<string, { delays: number[]; count: number }>();

  // Aggregate delays for each station
  journeys.forEach((journey) => {
    // Process last stop
    const lastStation = find3DStationName(journey.last_stop_name);
    if (lastStation) {
      if (!stationMap.has(lastStation)) {
        stationMap.set(lastStation, { delays: [], count: 0 });
      }
      const data = stationMap.get(lastStation)!;
      data.delays.push(journey.recorded_delay_seconds);
      data.count++;
    }

    // Process next stop
    const nextStation = find3DStationName(journey.next_stop_name);
    if (nextStation && nextStation !== lastStation) {
      if (!stationMap.has(nextStation)) {
        stationMap.set(nextStation, { delays: [], count: 0 });
      }
      const data = stationMap.get(nextStation)!;
      data.delays.push(journey.recorded_delay_seconds);
      data.count++;
    }
  });

  // Calculate statistics for each station
  const result = new Map<string, StationDelayInfo>();
  stationMap.forEach((data, stationName) => {
    const avgDelay = data.delays.reduce((sum, d) => sum + d, 0) / data.count;
    const maxDelay = Math.max(...data.delays);

    result.set(stationName, {
      stationName,
      avgDelay,
      maxDelay,
      journeyCount: data.count,
      delayCategory: getDelayCategory(avgDelay),
    });
  });

  return result;
}

/**
 * Fetches delay data for all stations in the railway network
 * Automatically discovers which stations have API data available
 */
export async function fetchDelayData(): Promise<Map<string, StationDelayInfo>> {
  // Get all unique station names from railway data
  const allStations = Object.keys(railwayData.stations);

  // Prioritize major stations for faster initial load
  const priorityStations = [
    'Oslo S',
    'Bergen',
    'Trondheim S',
    'Stavanger',
    'Kristiansand',
    'Drammen',
    'Sandvika',
    'Lillestrøm',
    'Nationaltheatret',
  ];

  // Separate into priority and other stations
  const orderedStations = [
    ...priorityStations.filter(s => allStations.includes(s)),
    ...allStations.filter(s => !priorityStations.includes(s))
  ];

  const allJourneys: TransitJourney[] = [];
  let successfulFetches = 0;

  // Fetch data for each station (try to find working API name)
  // Process in batches to avoid overwhelming the API
  const BATCH_SIZE = 5;
  for (let i = 0; i < orderedStations.length; i += BATCH_SIZE) {
    const batch = orderedStations.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (stationName) => {
      // Find working API name for this station
      const apiName = await findWorkingApiName(stationName);

      if (apiName === null) {
        return [];
      }

      // Fetch data using the working API name
      const data = await tryFetchStation(apiName);
      if (data !== null && data.length > 0) {
        successfulFetches++;
        return data;
      }

      return [];
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach((journeys) => allJourneys.push(...journeys));
  }

  if (allJourneys.length === 0) {
    console.warn('No delay data available from API');
    return new Map();
  }

  console.log(`✓ Fetched ${allJourneys.length} journeys from ${successfulFetches} stations`);
  return aggregateDelaysByStation(allJourneys);
}

/**
 * Start periodic delay data fetching
 */
export function startDelayDataPolling(
  callback: (delayData: Map<string, StationDelayInfo>) => void
): () => void {
  // Fetch immediately
  fetchDelayData().then(callback).catch(console.error);

  // Then fetch periodically
  const intervalId = window.setInterval(() => {
    fetchDelayData().then(callback).catch(console.error);
  }, FETCH_INTERVAL_MS);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}
