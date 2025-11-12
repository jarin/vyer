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
}

/**
 * Railway line metadata
 */
export interface RailwayLineMetadata {
  lineName: string;
  originalColor: number;
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
 * Type guard to check if userData contains train animation data
 */
export function isTrainMesh(mesh: THREE.Mesh): mesh is THREE.Mesh & { userData: TrainAnimationData } {
  return (
    typeof mesh.userData === 'object' &&
    mesh.userData !== null &&
    'animating' in mesh.userData &&
    typeof mesh.userData.animating === 'boolean'
  );
}

/**
 * Type guard to check if userData contains railway line metadata
 */
export function isRailwayLineMesh(mesh: THREE.Mesh): mesh is THREE.Mesh & { userData: RailwayLineMetadata } {
  return (
    typeof mesh.userData === 'object' &&
    mesh.userData !== null &&
    'lineName' in mesh.userData &&
    'originalColor' in mesh.userData &&
    typeof mesh.userData.lineName === 'string' &&
    typeof mesh.userData.originalColor === 'number'
  );
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
