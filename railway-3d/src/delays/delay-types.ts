/**
 * Type definitions for transit delay data from Kaveland API
 */

/**
 * Transit journey with delay information from the API
 */
export interface TransitJourney {
  vehicle_journey_id: string;
  line_ref: string;
  last_stop_name: string;
  aimed_last_stop_time: string;
  actual_last_stop_time: string;
  recorded_delay_seconds: number;
  next_stop_name: string;
  aimed_next_stop_time: string;
}

/**
 * Aggregated delay information for a station
 */
export interface StationDelayInfo {
  stationName: string;
  avgDelay: number;
  maxDelay: number;
  journeyCount: number;
  delayCategory: 'on-time' | 'minor' | 'moderate' | 'severe' | 'chaos';
}

/**
 * Delay severity categories with thresholds
 */
export const DELAY_THRESHOLDS = {
  ON_TIME: 60,      // < 1 minute
  MINOR: 300,       // < 5 minutes
  MODERATE: 600,    // < 10 minutes
  SEVERE: 1200,     // < 20 minutes
  // >= 20 minutes is CHAOS
} as const;

/**
 * Get delay category based on delay in seconds
 */
export function getDelayCategory(delaySeconds: number): StationDelayInfo['delayCategory'] {
  const absDelay = Math.abs(delaySeconds);
  if (absDelay < DELAY_THRESHOLDS.ON_TIME) return 'on-time';
  if (absDelay < DELAY_THRESHOLDS.MINOR) return 'minor';
  if (absDelay < DELAY_THRESHOLDS.MODERATE) return 'moderate';
  if (absDelay < DELAY_THRESHOLDS.SEVERE) return 'severe';
  return 'chaos';
}
