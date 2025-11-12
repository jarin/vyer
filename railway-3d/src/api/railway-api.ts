/**
 * Public API for controlling the railway visualization
 * Exposes methods for highlighting lines, controlling trains, etc.
 */

import * as THREE from 'three';
import { lineMeshes } from '../railway/railway-renderer';
import {
  createTrain,
  animateTrain,
  stopTrain,
  removeTrain,
  hideTrains,
  showTrains,
} from '../animation/train-animator';
import { LINE_CONFIG } from '../data/constants';
import type { RailwayAPI } from '../types';

/**
 * Create and expose the public Railway API
 */
export function createRailwayAPI(scene: THREE.Scene): RailwayAPI {
  return {
    /**
     * Highlight a specific line (dim others)
     */
    highlightLine: (lineName: string): void => {
      lineMeshes.forEach((mesh, name) => {
        const material = mesh.material as THREE.MeshLambertMaterial;
        if (name === lineName) {
          material.emissiveIntensity = LINE_CONFIG.HIGHLIGHTED_INTENSITY;
          material.opacity = 1.0;
        } else {
          material.emissiveIntensity = LINE_CONFIG.DIMMED_INTENSITY;
          material.transparent = true;
          material.opacity = LINE_CONFIG.DIMMED_OPACITY;
        }
      });
    },

    /**
     * Reset all lines to normal state
     */
    resetHighlight: (): void => {
      lineMeshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshLambertMaterial;
        material.emissiveIntensity = LINE_CONFIG.EMISSIVE_INTENSITY;
        material.transparent = false;
        material.opacity = 1.0;
      });
    },

    /**
     * Change the color of a specific line
     */
    setLineColor: (lineName: string, color: number): void => {
      const mesh = lineMeshes.get(lineName);
      if (mesh) {
        const material = mesh.material as THREE.MeshLambertMaterial;
        const newColor = new THREE.Color(color);
        material.color.set(newColor);
        material.emissive.set(newColor);
      }
    },

    /**
     * Reset line to original color
     */
    resetLineColor: (lineName: string): void => {
      const mesh = lineMeshes.get(lineName);
      if (mesh) {
        const material = mesh.material as THREE.MeshLambertMaterial;
        const originalColor = mesh.userData.originalColor;
        material.color.set(originalColor);
        material.emissive.set(originalColor);
      }
    },

    /**
     * Reset all lines to original colors
     */
    resetAllColors: (): void => {
      lineMeshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshLambertMaterial;
        const originalColor = mesh.userData.originalColor;
        material.color.set(originalColor);
        material.emissive.set(originalColor);
      });
    },

    /**
     * Get list of all line names
     */
    getLines: (): string[] => {
      return Array.from(lineMeshes.keys());
    },

    /**
     * Create a new train
     */
    createTrain: (color?: number): string => {
      return createTrain(scene, color);
    },

    /**
     * Start train animation on a line
     */
    startTrain: (trainId: string, lineName: string, duration?: number, loop?: boolean): void => {
      animateTrain(trainId, lineName, duration, loop);
    },

    /**
     * Stop train animation
     */
    stopTrain: (trainId: string): void => {
      stopTrain(trainId);
    },

    /**
     * Remove train from scene
     */
    removeTrain: (trainId: string): void => {
      removeTrain(scene, trainId);
    },

    /**
     * Hide all trains
     */
    hideTrains: (): void => {
      hideTrains();
    },

    /**
     * Show all trains
     */
    showTrains: (): void => {
      showTrains();
    },
  };
}
