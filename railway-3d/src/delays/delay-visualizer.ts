/**
 * Visualizes transit delays with amusing icons and animations
 */

import * as THREE from 'three';
import type { StationDelayInfo } from './delay-types';
import { railwayData } from '../data/railway-data';
import { SCALE_CONFIG, LINE_ELEVATION } from '../data/constants';
import { getTerrainHeight } from '../terrain/terrain-generator';

/**
 * Emoji icons for different delay severities
 */
const DELAY_EMOJIS = {
  'on-time': '✅',
  'minor': '⏱️',
  'moderate': '😬',
  'severe': '🔥',
  'chaos': '🚨',
} as const;

/**
 * Colors for different delay severities
 */
const DELAY_COLORS = {
  'on-time': 0x00ff00,
  'minor': 0xffff00,
  'moderate': 0xffa500,
  'severe': 0xff4500,
  'chaos': 0xff0000,
} as const;

/**
 * Create a text sprite for emoji display
 */
function createEmojiSprite(emoji: string, size = 2): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get 2D context for canvas');
  }

  canvas.width = 256;
  canvas.height = 256;

  // Draw emoji
  context.font = 'Bold 200px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(emoji, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(size, size, 1);

  return sprite;
}

/**
 * Create a pulsing ring effect around a station
 */
function createPulseRing(color: number, radius = 1): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius * 0.8, radius, 32);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

/**
 * Manages delay visualizations for all stations
 */
export class DelayVisualizer {
  private scene: THREE.Scene;
  private delaySprites = new Map<string, THREE.Group>();
  private animationData = new Map<string, { startTime: number; initialY: number }>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Update delay visualizations for all stations
   */
  updateDelays(delayData: Map<string, StationDelayInfo>): void {
    // Remove old visualizations that are no longer relevant
    this.delaySprites.forEach((group, stationName) => {
      if (!delayData.has(stationName)) {
        this.scene.remove(group);
        this.delaySprites.delete(stationName);
        this.animationData.delete(stationName);
      }
    });

    // Add or update visualizations for current delays
    delayData.forEach((delayInfo, stationName) => {
      const station = railwayData.stations[stationName];
      if (!station) return;

      // Get position
      const x = station.x * SCALE_CONFIG.X_SCALE;
      const z = station.z * SCALE_CONFIG.Z_SCALE;
      const terrainHeight = getTerrainHeight(x, z);
      const stationHeight = Math.max(terrainHeight + LINE_ELEVATION, station.elevation + LINE_ELEVATION);

      // Create or update visualization
      if (this.delaySprites.has(stationName)) {
        // Update existing
        this.updateDelayVisualization(stationName, delayInfo, stationHeight);
      } else {
        // Create new
        this.createDelayVisualization(stationName, delayInfo, x, z, stationHeight);
      }
    });
  }

  /**
   * Create a new delay visualization for a station
   */
  private createDelayVisualization(
    stationName: string,
    delayInfo: StationDelayInfo,
    x: number,
    z: number,
    stationHeight: number
  ): void {
    const group = new THREE.Group();

    // Create emoji sprite
    const emoji = DELAY_EMOJIS[delayInfo.delayCategory];
    const sprite = createEmojiSprite(emoji, 1.5);
    sprite.position.y = stationHeight + 3;
    group.add(sprite);

    // Create pulse ring for severe/chaos delays
    if (delayInfo.delayCategory === 'severe' || delayInfo.delayCategory === 'chaos') {
      const ring = createPulseRing(DELAY_COLORS[delayInfo.delayCategory], 2);
      ring.position.y = stationHeight + 0.1;
      group.add(ring);
    }

    // Position group
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.delaySprites.set(stationName, group);
    this.animationData.set(stationName, { startTime: Date.now(), initialY: stationHeight });
  }

  /**
   * Update an existing delay visualization
   */
  private updateDelayVisualization(
    stationName: string,
    delayInfo: StationDelayInfo,
    stationHeight: number
  ): void {
    const group = this.delaySprites.get(stationName);
    if (!group) return;

    // Update emoji if category changed
    const existingSprite = group.children[0] as THREE.Sprite;
    const newEmoji = DELAY_EMOJIS[delayInfo.delayCategory];

    // Recreate sprite if emoji changed
    const canvas = (existingSprite.material.map as THREE.CanvasTexture)?.image as HTMLCanvasElement;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = 'Bold 200px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(newEmoji, canvas.width / 2, canvas.height / 2);
        existingSprite.material.map!.needsUpdate = true;
      }
    }

    // Update ring if severity changed
    const hasRing = group.children.length > 1;
    const needsRing = delayInfo.delayCategory === 'severe' || delayInfo.delayCategory === 'chaos';

    if (needsRing && !hasRing) {
      const ring = createPulseRing(DELAY_COLORS[delayInfo.delayCategory], 2);
      ring.position.y = stationHeight + 0.1;
      group.add(ring);
    } else if (!needsRing && hasRing) {
      group.remove(group.children[1]);
    } else if (needsRing && hasRing) {
      const ring = group.children[1] as THREE.Mesh;
      (ring.material as THREE.MeshBasicMaterial).color.setHex(DELAY_COLORS[delayInfo.delayCategory]);
    }
  }

  /**
   * Animate delay visualizations (call in render loop)
   */
  animate(): void {
    const now = Date.now();

    this.delaySprites.forEach((group, stationName) => {
      const animData = this.animationData.get(stationName);
      if (!animData) return;

      const elapsed = (now - animData.startTime) / 1000; // Convert to seconds

      // Floating animation for emoji
      const sprite = group.children[0];
      if (sprite) {
        const floatOffset = Math.sin(elapsed * 2) * 0.3; // Slow sine wave
        sprite.position.y = animData.initialY + 3 + floatOffset;
      }

      // Pulsing animation for ring
      if (group.children.length > 1) {
        const ring = group.children[1] as THREE.Mesh;
        const material = ring.material as THREE.MeshBasicMaterial;
        const pulse = (Math.sin(elapsed * 3) + 1) / 2; // 0 to 1
        material.opacity = 0.3 + pulse * 0.4; // 0.3 to 0.7
        ring.scale.setScalar(1 + pulse * 0.2); // Scale pulse
      }
    });
  }

  /**
   * Clear all delay visualizations
   */
  clear(): void {
    this.delaySprites.forEach((group) => {
      this.scene.remove(group);
    });
    this.delaySprites.clear();
    this.animationData.clear();
  }
}
