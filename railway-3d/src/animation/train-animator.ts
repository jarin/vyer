/**
 * Train animation system
 */

import * as THREE from 'three';
import { lineCurves } from '../railway/railway-renderer';
import { TRAIN_CONFIG } from '../data/constants';
import type { TrainMesh } from '../types';

// Train storage
export const trains = new Map<string, TrainMesh>();
let trainIdCounter = 0;

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
