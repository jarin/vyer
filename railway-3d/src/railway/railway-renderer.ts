/**
 * Railway network rendering - lines and stations
 */

import * as THREE from 'three';
import { railwayData } from '../data/railway-data';
import { SCALE_CONFIG, LINE_ELEVATION, LINE_CONFIG, STATION_CONFIG } from '../data/constants';
import { getTerrainHeight } from '../terrain/terrain-generator';
import type { RailwayLineMetadata } from '../types';

// Storage for line meshes and curves (for API access and train animation)
export const lineMeshes = new Map<string, THREE.Mesh>();
export const lineCurves = new Map<string, THREE.CatmullRomCurve3>();

// Storage for station labels (for toggling visibility)
export const stationLabels: THREE.Sprite[] = [];
export const stationSpheres: THREE.Mesh[] = [];

/**
 * Create text sprite for station labels
 */
function createTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get 2D context for canvas');
  }

  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = 'Bold 48px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(4, 1, 1);

  return sprite;
}

/**
 * Create railway lines as 3D tubes following the network
 */
export function createRailwayLines(): THREE.Group {
  const linesGroup = new THREE.Group();

  railwayData.lines.forEach((line) => {
    const points: THREE.Vector3[] = [];

    line.stations.forEach((stationName) => {
      const station = railwayData.stations[stationName];
      if (!station) {
        console.warn(`Station ${stationName} not found in data`);
        return;
      }

      // Apply aspect ratio scaling for compact display
      const x = station.x * SCALE_CONFIG.X_SCALE;
      const z = station.z * SCALE_CONFIG.Z_SCALE;
      const terrainHeight = getTerrainHeight(x, z);
      const finalHeight = Math.max(terrainHeight + LINE_ELEVATION, station.elevation + LINE_ELEVATION);
      points.push(new THREE.Vector3(x, finalHeight, z));
    });

    // Create smooth curve through all stations
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      LINE_CONFIG.TUBE_SEGMENTS,
      LINE_CONFIG.TUBE_RADIUS,
      LINE_CONFIG.TUBE_RADIAL_SEGMENTS,
      false
    );

    const tubeMaterial = new THREE.MeshLambertMaterial({
      color: line.color,
      emissive: line.color,
      emissiveIntensity: LINE_CONFIG.EMISSIVE_INTENSITY,
      depthTest: true,
      depthWrite: true,
    });

    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.renderOrder = 1; // Render after terrain

    // Initialize userData with railway line metadata
    const metadata: RailwayLineMetadata = {
      lineName: line.name,
      originalColor: line.color,
    };
    tube.userData = metadata;

    linesGroup.add(tube);

    // Store references for API and train animation
    lineMeshes.set(line.name, tube);
    lineCurves.set(line.name, curve);
  });

  return linesGroup;
}

/**
 * Create station markers with labels and support pillars
 */
export function createStations(): THREE.Group {
  const stationsGroup = new THREE.Group();

  Object.entries(railwayData.stations).forEach(([name, data]) => {
    // Apply aspect ratio scaling for compact display
    const x = data.x * SCALE_CONFIG.X_SCALE;
    const z = data.z * SCALE_CONFIG.Z_SCALE;
    const terrainHeight = getTerrainHeight(x, z);
    const stationHeight = Math.max(terrainHeight + LINE_ELEVATION, data.elevation + LINE_ELEVATION);

    // Station sphere marker
    const geometry = new THREE.SphereGeometry(
      STATION_CONFIG.SPHERE_RADIUS,
      STATION_CONFIG.SPHERE_SEGMENTS,
      STATION_CONFIG.SPHERE_SEGMENTS
    );
    const material = new THREE.MeshLambertMaterial({
      color: STATION_CONFIG.COLOR,
      emissive: STATION_CONFIG.EMISSIVE_COLOR,
      emissiveIntensity: STATION_CONFIG.EMISSIVE_INTENSITY,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, stationHeight, z);
    sphere.renderOrder = 2; // Render on top of lines
    sphere.userData = { stationName: name, isStation: true };
    stationsGroup.add(sphere);
    stationSpheres.push(sphere);

    // Station pillar (connecting to terrain below)
    const pillarHeight = stationHeight - terrainHeight;
    if (pillarHeight > STATION_CONFIG.MIN_PILLAR_HEIGHT) {
      const pillarGeometry = new THREE.CylinderGeometry(
        STATION_CONFIG.PILLAR_RADIUS,
        STATION_CONFIG.PILLAR_RADIUS,
        pillarHeight,
        STATION_CONFIG.PILLAR_SEGMENTS
      );
      const pillarMaterial = new THREE.MeshLambertMaterial({
        color: STATION_CONFIG.PILLAR_COLOR,
        transparent: true,
        opacity: STATION_CONFIG.PILLAR_OPACITY,
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, terrainHeight + pillarHeight / 2, z);
      stationsGroup.add(pillar);
    }

    // Station label
    const label = createTextSprite(name);
    label.position.set(x, stationHeight + STATION_CONFIG.LABEL_OFFSET_Y, z);
    label.renderOrder = 3; // Always on top
    stationsGroup.add(label);
    stationLabels.push(label);
  });

  return stationsGroup;
}

/**
 * Toggle station labels visibility
 */
export function toggleStationLabels(visible: boolean): void {
  stationLabels.forEach((label) => {
    label.visible = visible;
  });
}

/**
 * Get current station labels visibility
 */
export function getStationLabelsVisible(): boolean {
  return stationLabels.length > 0 ? stationLabels[0].visible : true;
}
