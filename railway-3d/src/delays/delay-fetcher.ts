/**
 * Fetches and processes transit delay data from Kaveland API
 */

import type { TransitJourney, StationDelayInfo } from './delay-types';
import { getDelayCategory } from './delay-types';
import { railwayData } from '../data/railway-data';

const API_BASE_URL = 'http://localhost:3001/api/stop/';
const FETCH_INTERVAL_MS = 30000; // 30 seconds

/**
 * Normalize station names for matching between API and 3D map
 * API often includes "stasjon" suffix, we need to handle variations
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
 * Fetches delay data for multiple major stations
 */
export async function fetchDelayData(): Promise<Map<string, StationDelayInfo>> {
  // Major stations to query
  const majorStations = [
    'Oslo S',
    'Nationaltheatret',
    'Lysaker',
    'Sandvika',
    'Asker',
    'Drammen',
    'Lillestrøm',
    'Bergen',
    'Trondheim S',
  ];

  const allJourneys: TransitJourney[] = [];

  // Fetch data for each station
  const fetchPromises = majorStations.map(async (station) => {
    try {
      const encodedStation = encodeURIComponent(station);
      const response = await fetch(`${API_BASE_URL}${encodedStation}`);

      if (!response.ok) {
        console.warn(`Failed to fetch data for ${station}: ${response.statusText}`);
        return [];
      }

      const data: TransitJourney[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${station}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  results.forEach((journeys) => allJourneys.push(...journeys));

  if (allJourneys.length === 0) {
    console.warn('No delay data available');
    return new Map();
  }

  console.log(`Fetched ${allJourneys.length} journeys for delay visualization`);
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
