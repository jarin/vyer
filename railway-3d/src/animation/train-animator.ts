/**
 * Train animation system with station arrival sounds
 */

import * as THREE from 'three';
import { railwayData } from '../data/railway-data';
import { lineCurves } from '../railway/railway-renderer';
import { TRAIN_CONFIG, AUDIO_CONFIG } from '../data/constants';
import type { TrainMesh } from '../types';

// Audio context for station bell sounds
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

// Train storage
export const trains = new Map<string, TrainMesh>();
let trainIdCounter = 0;

/**
 * Play station arrival bell sound
 */
export function playStationBell(): void {
  const now = audioContext.currentTime;

  // Create oscillator for the bell sound
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Bell-like frequency (E6)
  oscillator.frequency.setValueAtTime(AUDIO_CONFIG.BELL_FREQUENCY, now);
  oscillator.type = AUDIO_CONFIG.OSCILLATOR_TYPE;

  // Envelope for natural bell decay
  gainNode.gain.setValueAtTime(AUDIO_CONFIG.BELL_VOLUME, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + AUDIO_CONFIG.BELL_DURATION);

  // Connect and play
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + AUDIO_CONFIG.BELL_DURATION);
}

/**
 * Create a new train mesh
 */
export function createTrain(scene: THREE.Scene, color?: number): string {
  const geometry = new THREE.SphereGeometry(
    TRAIN_CONFIG.DEFAULT_RADIUS,
    TRAIN_CONFIG.DEFAULT_SEGMENTS,
    TRAIN_CONFIG.DEFAULT_SEGMENTS
  );
  const trainColor = color ?? TRAIN_CONFIG.DEFAULT_COLOR;
  const material = new THREE.MeshLambertMaterial({
    color: trainColor,
    emissive: trainColor,
    emissiveIntensity: TRAIN_CONFIG.DEFAULT_EMISSIVE_INTENSITY,
  });

  const train = new THREE.Mesh(geometry, material);
  train.renderOrder = 3;
  train.visible = false; // Hide until animated
  train.userData = {
    animating: false,
  } as TrainMesh['userData'];

  scene.add(train);

  const trainId = `train_${trainIdCounter++}`;
  trains.set(trainId, train as unknown as TrainMesh);

  return trainId;
}

/**
 * Start train animation on a specific line
 */
export function animateTrain(
  trainId: string,
  lineName: string,
  duration?: number,
  loop?: boolean
): void {
  const curve = lineCurves.get(lineName);
  if (!curve) {
    console.error(`Line ${lineName} not found`);
    return;
  }

  const train = trains.get(trainId);
  if (!train) {
    console.error(`Train ${trainId} not found`);
    return;
  }

  train.visible = true;
  train.userData.animating = true;
  train.userData.lineName = lineName;
  train.userData.duration = duration ?? TRAIN_CONFIG.DEFAULT_DURATION;
  train.userData.startTime = Date.now();
  train.userData.loop = loop ?? false;
  train.userData.lastStationIndex = -1; // Track last visited station

  // Get station list for this line
  const lineData = railwayData.lines.find((line) => line.name === lineName);
  if (lineData) {
    train.userData.stations = lineData.stations;
    train.userData.stationCount = lineData.stations.length;
  }
}

/**
 * Update all active train animations
 * Should be called in the animation loop
 */
export function updateTrains(): void {
  const now = Date.now();

  trains.forEach((train) => {
    if (!train.userData.animating) return;

    const elapsed = now - (train.userData.startTime || 0);
    const duration = train.userData.duration || TRAIN_CONFIG.DEFAULT_DURATION;
    let t = Math.min(elapsed / duration, 1);

    if (t >= 1) {
      if (train.userData.loop) {
        train.userData.startTime = now;
        train.userData.lastStationIndex = -1; // Reset for next loop
        t = 0;
      } else {
        train.userData.animating = false;
        return;
      }
    }

    const curve = lineCurves.get(train.userData.lineName || '');
    if (curve) {
      const point = curve.getPoint(t);
      train.position.copy(point);
      train.position.y += TRAIN_CONFIG.TRACK_OFFSET_Y; // Slightly above the track

      // Check if train has reached a station
      if (train.userData.stationCount) {
        const stationIndex = Math.floor(t * train.userData.stationCount);

        // Play bell when reaching a new station
        if (
          stationIndex !== train.userData.lastStationIndex &&
          stationIndex < train.userData.stationCount
        ) {
          playStationBell();
          train.userData.lastStationIndex = stationIndex;
        }
      }
    }
  });
}

/**
 * Stop train animation
 */
export function stopTrain(trainId: string): void {
  const train = trains.get(trainId);
  if (train) {
    train.userData.animating = false;
  }
}

/**
 * Remove train from scene
 */
export function removeTrain(scene: THREE.Scene, trainId: string): void {
  const train = trains.get(trainId);
  if (train) {
    scene.remove(train);
    trains.delete(trainId);
  }
}

/**
 * Hide all trains
 */
export function hideTrains(): void {
  trains.forEach((train) => {
    train.visible = false;
  });
}

/**
 * Show all trains
 */
export function showTrains(): void {
  trains.forEach((train) => {
    train.visible = true;
  });
}
