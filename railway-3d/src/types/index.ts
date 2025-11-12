/**
 * Type definitions for the 3D Norwegian Railway Network visualization
 */

import type * as THREE from 'three';

/**
 * Position in 3D space with elevation data
 */
export interface StationPosition {
  x: number;
  y: number;
  z: number;
  elevation: number;
}

/**
 * Dictionary of all railway stations
 */
export interface StationDictionary {
  [stationName: string]: StationPosition;
}

/**
 * Railway line definition with stations and visual properties
 */
export interface RailwayLine {
  name: string;
  color: number;
  stations: string[];
}

/**
 * Complete railway network data structure
 */
export interface RailwayData {
  stations: StationDictionary;
  lines: RailwayLine[];
}

/**
 * Configuration for aspect ratio scaling
 */
export interface ScaleConfig {
  X_SCALE: number;
  Z_SCALE: number;
}

/**
 * Train animation state
 */
export interface TrainAnimationData {
  animating: boolean;
  lineName?: string;
  duration?: number;
  startTime?: number;
  loop?: boolean;
  lastStationIndex?: number;
  stations?: string[];
  stationCount?: number;
}

/**
 * Public API for controlling the railway visualization
 */
export interface RailwayAPI {
  /** Highlight a specific line (dim others) */
  highlightLine: (lineName: string) => void;

  /** Reset all lines to normal state */
  resetHighlight: () => void;

  /** Change the color of a specific line */
  setLineColor: (lineName: string, color: number) => void;

  /** Reset line to original color */
  resetLineColor: (lineName: string) => void;

  /** Reset all lines to original colors */
  resetAllColors: () => void;

  /** Get list of all line names */
  getLines: () => string[];

  /** Create a new train */
  createTrain: (color?: number) => string;

  /** Start train animation on a line */
  startTrain: (trainId: string, lineName: string, duration?: number, loop?: boolean) => void;

  /** Stop train animation */
  stopTrain: (trainId: string) => void;

  /** Remove train from scene */
  removeTrain: (trainId: string) => void;

  /** Hide all trains */
  hideTrains: () => void;

  /** Show all trains */
  showTrains: () => void;
}

/**
 * Extended mesh with custom user data
 */
export interface RailwayMesh extends THREE.Mesh {
  userData: {
    lineName: string;
    originalColor: number;
  };
}

/**
 * Extended mesh for train with animation data
 */
export interface TrainMesh extends THREE.Mesh {
  userData: TrainAnimationData;
}

/**
 * Noise generation parameters
 */
export interface NoiseConfig {
  octaves: number;
  persistence: number;
}

/**
 * Terrain generation parameters
 */
export interface TerrainConfig {
  width: number;
  depth: number;
  widthSegments: number;
  depthSegments: number;
}
