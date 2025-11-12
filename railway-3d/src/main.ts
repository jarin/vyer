/**
 * Main entry point for the 3D Norwegian Railway Network visualization
 *
 * This application creates an interactive 3D visualization of the Norwegian railway network
 * with terrain, stations, railway lines, and animated trains.
 */

import { initializeScene, setupResizeHandler, startAnimationLoop } from './core/scene-manager';
import { createTerrain } from './terrain/terrain-generator';
import { createRailwayLines, createStations } from './railway/railway-renderer';
import { updateTrains } from './animation/train-animator';
import { createRailwayAPI } from './api/railway-api';

/**
 * Initialize and start the 3D railway visualization
 */
function main(): void {
  // Get the canvas container
  const container = document.getElementById('canvas-container');
  if (!container) {
    throw new Error('Canvas container not found');
  }

  // Initialize the scene with camera, renderer, and controls
  const { scene, camera, renderer, controls } = initializeScene(container);

  // Add terrain (base terrain + water features)
  scene.add(createTerrain());

  // Add railway lines
  scene.add(createRailwayLines());

  // Add station markers and labels
  scene.add(createStations());

  // Setup window resize handler
  setupResizeHandler(camera, renderer);

  // Create and expose public API
  const railwayAPI = createRailwayAPI(scene);
  (window as any).railwayAPI = railwayAPI;

  // Start the animation loop with train updates
  startAnimationLoop(renderer, scene, camera, controls, updateTrains);

  console.log('3D Norwegian Railway Network visualization initialized');
  console.log('Available API: window.railwayAPI');
  console.log('Available lines:', railwayAPI.getLines());
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
