/**
 * Terrain generation for the Norwegian railway 3D visualization
 * Creates base terrain with fractal noise and water features
 */

import * as THREE from 'three';
import { fractalNoise } from './noise';
import { SCALE_CONFIG, TERRAIN_CONFIG } from '../data/constants';

/**
 * Sample terrain height at a specific position
 * Uses the same logic as terrain generation for consistency
 */
export function getTerrainHeight(x: number, z: number): number {
  // Base terrain height from fractal noise
  let height = fractalNoise(x, z, 4, 0.5) * 2;

  // Add mountain regions
  // Western mountains (Bergen line)
  const distWest = Math.sqrt(Math.pow(x + 45, 2) + Math.pow(z + 22, 2));
  if (distWest < 35) {
    height += (1 - distWest / 35) * 8 * fractalNoise(x * 0.5, z * 0.5, 3, 0.6);
  }

  // Central mountains (Dovre/Jotunheimen)
  const distCentral = Math.sqrt(Math.pow(x - 12, 2) + Math.pow(z + 60, 2));
  if (distCentral < 30) {
    height += (1 - distCentral / 30) * 7 * fractalNoise(x * 0.4, z * 0.4, 3, 0.6);
  }

  // Røros mountains
  const distRoros = Math.sqrt(Math.pow(x - 28, 2) + Math.pow(z + 42, 2));
  if (distRoros < 25) {
    height += (1 - distRoros / 25) * 5 * fractalNoise(x * 0.3, z * 0.3, 3, 0.5);
  }

  // Coastal lowlands (Oslo fjord area and south/southeast)
  if (x > -15 && x < 20 && z > -10 && z < 50) {
    height *= 0.25;
  }

  // Northern terrain - more modest
  if (z < -100) {
    height = Math.max(0, height * 0.5 + fractalNoise(x, z, 2, 0.4) * 2);
  }

  return Math.max(-0.5, height);
}

/**
 * Get color based on elevation
 * Returns RGB values for vertex coloring
 */
function getElevationColor(height: number): { r: number; g: number; b: number } {
  const normalizedHeight = Math.max(0, Math.min(height + 0.5, 15)) / 15;
  let r: number, g: number, b: number;

  if (normalizedHeight < 0.1) {
    // Water level / lowlands - greenish
    r = 0.4 + normalizedHeight * 2;
    g = 0.6 + normalizedHeight;
    b = 0.3;
  } else if (normalizedHeight < 0.3) {
    // Low hills - rich green
    const t = (normalizedHeight - 0.1) / 0.2;
    r = 0.3 + t * 0.2;
    g = 0.65 - t * 0.1;
    b = 0.25 - t * 0.1;
  } else if (normalizedHeight < 0.5) {
    // Mid elevation - darker green/brown
    const t = (normalizedHeight - 0.3) / 0.2;
    r = 0.5 + t * 0.15;
    g = 0.55 - t * 0.15;
    b = 0.15;
  } else if (normalizedHeight < 0.7) {
    // High elevation - brownish
    const t = (normalizedHeight - 0.5) / 0.2;
    r = 0.65 + t * 0.1;
    g = 0.4 - t * 0.15;
    b = 0.15 - t * 0.05;
  } else if (normalizedHeight < 0.85) {
    // Mountain - gray/brown
    const t = (normalizedHeight - 0.7) / 0.15;
    r = 0.75 - t * 0.15;
    g = 0.25 + t * 0.35;
    b = 0.1 + t * 0.4;
  } else {
    // Peaks - snowy white/gray
    const t = (normalizedHeight - 0.85) / 0.15;
    r = 0.6 + t * 0.35;
    g = 0.6 + t * 0.35;
    b = 0.5 + t * 0.45;
  }

  return { r, g, b };
}

/**
 * Create base terrain with height map and vertex colors
 */
export function createBaseTerrain(): THREE.Mesh {
  const width = TERRAIN_CONFIG.WIDTH_MULTIPLIER * SCALE_CONFIG.X_SCALE;
  const depth = TERRAIN_CONFIG.DEPTH_MULTIPLIER * SCALE_CONFIG.Z_SCALE;

  const geometry = new THREE.PlaneGeometry(
    width,
    depth,
    TERRAIN_CONFIG.WIDTH_SEGMENTS,
    TERRAIN_CONFIG.DEPTH_SEGMENTS
  );

  const vertices = geometry.attributes.position.array;
  const colors = new Float32Array(vertices.length);

  // Generate terrain heightmap and colors
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 1];

    const height = getTerrainHeight(x, z);
    vertices[i + 2] = height; // y coordinate

    const color = getElevationColor(height);
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: false,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = TERRAIN_CONFIG.BASE_Y_OFFSET;
  terrain.position.z = TERRAIN_CONFIG.Z_OFFSET_MULTIPLIER * SCALE_CONFIG.Z_SCALE;

  return terrain;
}

/**
 * Create water features (fjords and coastlines)
 */
export function createWater(): THREE.Group {
  const waterGroup = new THREE.Group();
  const waterMaterial = new THREE.MeshLambertMaterial({
    color: 0x1a4d7a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  // Oslofjorden
  const fjordShape = new THREE.Shape();
  fjordShape.moveTo(0 * SCALE_CONFIG.X_SCALE, 0 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(-3 * SCALE_CONFIG.X_SCALE, 8 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(-5 * SCALE_CONFIG.X_SCALE, 12 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(-8 * SCALE_CONFIG.X_SCALE, 18 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(-10 * SCALE_CONFIG.X_SCALE, 22 * SCALE_CONFIG.Z_SCALE);
  fjordShape.quadraticCurveTo(
    -12 * SCALE_CONFIG.X_SCALE,
    26 * SCALE_CONFIG.Z_SCALE,
    -8 * SCALE_CONFIG.X_SCALE,
    30 * SCALE_CONFIG.Z_SCALE
  );
  fjordShape.lineTo(-5 * SCALE_CONFIG.X_SCALE, 32 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(0 * SCALE_CONFIG.X_SCALE, 35 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(5 * SCALE_CONFIG.X_SCALE, 32 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(8 * SCALE_CONFIG.X_SCALE, 28 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(10 * SCALE_CONFIG.X_SCALE, 24 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(8 * SCALE_CONFIG.X_SCALE, 18 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(5 * SCALE_CONFIG.X_SCALE, 12 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(3 * SCALE_CONFIG.X_SCALE, 6 * SCALE_CONFIG.Z_SCALE);
  fjordShape.lineTo(0 * SCALE_CONFIG.X_SCALE, 0 * SCALE_CONFIG.Z_SCALE);

  const fjord = new THREE.Mesh(new THREE.ShapeGeometry(fjordShape), waterMaterial);
  fjord.rotation.x = -Math.PI / 2;
  fjord.position.y = 0.05;
  waterGroup.add(fjord);

  // Western coastline water
  const westCoastShape = new THREE.Shape();
  westCoastShape.moveTo(-80 * SCALE_CONFIG.X_SCALE, -30 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-85 * SCALE_CONFIG.X_SCALE, -28 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-85 * SCALE_CONFIG.X_SCALE, 0 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-70 * SCALE_CONFIG.X_SCALE, 10 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-65 * SCALE_CONFIG.X_SCALE, 25 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-60 * SCALE_CONFIG.X_SCALE, 35 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-62 * SCALE_CONFIG.X_SCALE, 45 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-65 * SCALE_CONFIG.X_SCALE, 50 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-80 * SCALE_CONFIG.X_SCALE, 50 * SCALE_CONFIG.Z_SCALE);
  westCoastShape.lineTo(-80 * SCALE_CONFIG.X_SCALE, -30 * SCALE_CONFIG.Z_SCALE);

  const westCoast = new THREE.Mesh(new THREE.ShapeGeometry(westCoastShape), waterMaterial);
  westCoast.rotation.x = -Math.PI / 2;
  westCoast.position.y = 0.05;
  waterGroup.add(westCoast);

  // Northern coast water
  const northCoastShape = new THREE.Shape();
  northCoastShape.moveTo(10 * SCALE_CONFIG.X_SCALE, -90 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(0 * SCALE_CONFIG.X_SCALE, -100 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(5 * SCALE_CONFIG.X_SCALE, -140 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(10 * SCALE_CONFIG.X_SCALE, -180 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(15 * SCALE_CONFIG.X_SCALE, -190 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(30 * SCALE_CONFIG.X_SCALE, -195 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(30 * SCALE_CONFIG.X_SCALE, -90 * SCALE_CONFIG.Z_SCALE);
  northCoastShape.lineTo(10 * SCALE_CONFIG.X_SCALE, -90 * SCALE_CONFIG.Z_SCALE);

  const northCoast = new THREE.Mesh(new THREE.ShapeGeometry(northCoastShape), waterMaterial);
  northCoast.rotation.x = -Math.PI / 2;
  northCoast.position.y = 0.05;
  waterGroup.add(northCoast);

  // Southeastern coast (Østfold area)
  const eastCoastShape = new THREE.Shape();
  eastCoastShape.moveTo(8 * SCALE_CONFIG.X_SCALE, 28 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(15 * SCALE_CONFIG.X_SCALE, 30 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(18 * SCALE_CONFIG.X_SCALE, 40 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(16 * SCALE_CONFIG.X_SCALE, 50 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(10 * SCALE_CONFIG.X_SCALE, 52 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(8 * SCALE_CONFIG.X_SCALE, 45 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(10 * SCALE_CONFIG.X_SCALE, 35 * SCALE_CONFIG.Z_SCALE);
  eastCoastShape.lineTo(8 * SCALE_CONFIG.X_SCALE, 28 * SCALE_CONFIG.Z_SCALE);

  const eastCoast = new THREE.Mesh(new THREE.ShapeGeometry(eastCoastShape), waterMaterial);
  eastCoast.rotation.x = -Math.PI / 2;
  eastCoast.position.y = 0.05;
  waterGroup.add(eastCoast);

  return waterGroup;
}

/**
 * Create complete terrain group (base terrain + water)
 */
export function createTerrain(): THREE.Group {
  const terrainGroup = new THREE.Group();
  terrainGroup.add(createBaseTerrain());
  terrainGroup.add(createWater());
  return terrainGroup;
}
