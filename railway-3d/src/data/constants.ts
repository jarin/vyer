/**
 * Configuration constants for the 3D railway visualization
 * Coordinates adjusted for compact rectangular display - position/topology matters, not exact distances
 */

import type { ScaleConfig } from '../types';

/**
 * Aspect ratio scaling for compact rectangular display
 */
export const SCALE_CONFIG: ScaleConfig = {
  X_SCALE: 1.0,  // East-West scale
  Z_SCALE: 0.4,  // North-South compression for better fit
};

/**
 * Railway line elevation above terrain
 */
export const LINE_ELEVATION = 4.0;

/**
 * Camera configuration
 */
export const CAMERA_CONFIG = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  INITIAL_POSITION: { x: 0, y: 50, z: 10 },
  LOOK_AT: { x: 0, y: 0, z: -20 },
} as const;

/**
 * Controls configuration
 */
export const CONTROLS_CONFIG = {
  DAMPING_FACTOR: 0.05,
  MIN_DISTANCE: 15,
  MAX_DISTANCE: 120,
} as const;

/**
 * Scene configuration
 */
export const SCENE_CONFIG = {
  BACKGROUND_COLOR: 0x87ceeb, // Sky blue
} as const;

/**
 * Lighting configuration
 */
export const LIGHTING_CONFIG = {
  AMBIENT: {
    COLOR: 0xffffff,
    INTENSITY: 0.6,
  },
  DIRECTIONAL_1: {
    COLOR: 0xffffff,
    INTENSITY: 0.8,
    POSITION: { x: 50, y: 100, z: 50 },
  },
  DIRECTIONAL_2: {
    COLOR: 0x4488ff,
    INTENSITY: 0.4,
    POSITION: { x: -50, y: 50, z: -100 },
  },
} as const;

/**
 * Terrain generation configuration
 */
export const TERRAIN_CONFIG = {
  WIDTH_MULTIPLIER: 180,
  DEPTH_MULTIPLIER: 400,
  WIDTH_SEGMENTS: 90,
  DEPTH_SEGMENTS: 200,
  BASE_Y_OFFSET: -0.5,
  Z_OFFSET_MULTIPLIER: -50,
} as const;

/**
 * Station rendering configuration
 */
export const STATION_CONFIG = {
  SPHERE_RADIUS: 0.5,
  SPHERE_SEGMENTS: 16,
  COLOR: 0xffff00,
  EMISSIVE_COLOR: 0xffaa00,
  EMISSIVE_INTENSITY: 0.6,
  LABEL_OFFSET_Y: 1.2,
  PILLAR_RADIUS: 0.08,
  PILLAR_SEGMENTS: 8,
  PILLAR_COLOR: 0x888888,
  PILLAR_OPACITY: 0.4,
  MIN_PILLAR_HEIGHT: 0.5,
} as const;

/**
 * Railway line rendering configuration
 */
export const LINE_CONFIG = {
  TUBE_RADIUS: 0.35,
  TUBE_SEGMENTS: 100,
  TUBE_RADIAL_SEGMENTS: 8,
  EMISSIVE_INTENSITY: 0.5,
  HIGHLIGHTED_INTENSITY: 1.0,
  DIMMED_INTENSITY: 0.2,
  DIMMED_OPACITY: 0.3,
} as const;

/**
 * Train animation configuration
 */
export const TRAIN_CONFIG = {
  DEFAULT_RADIUS: 0.8,
  DEFAULT_SEGMENTS: 16,
  DEFAULT_COLOR: 0xffff00,
  DEFAULT_EMISSIVE_INTENSITY: 0.8,
  DEFAULT_DURATION: 10000,
  TRACK_OFFSET_Y: 0.5,
} as const;

/**
 * Station bell audio configuration
 */
export const AUDIO_CONFIG = {
  BELL_FREQUENCY: 1318.51, // E6 frequency
  BELL_VOLUME: 0.3,
  BELL_DURATION: 0.5,
  OSCILLATOR_TYPE: 'sine' as OscillatorType,
} as const;
