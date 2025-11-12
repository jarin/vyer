/**
 * Main entry point for the 3D Norwegian Railway Network visualization
 *
 * This application creates an interactive 3D visualization of the Norwegian railway network
 * with terrain, stations, railway lines, and animated trains.
 */

import * as THREE from 'three';
import { initializeScene, setupResizeHandler, startAnimationLoop } from './core/scene-manager';
import { createTerrain } from './terrain/terrain-generator';
import {
  createRailwayLines,
  createStations,
  toggleStationLabels,
  getStationLabelsVisible,
  stationSpheres,
} from './railway/railway-renderer';
import { updateTrains } from './animation/train-animator';
import { createRailwayAPI } from './api/railway-api';
import { DelayVisualizer } from './delays/delay-visualizer';
import { startDelayDataPolling } from './delays/delay-fetcher';
import { TooltipManager } from './core/tooltip-manager';

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

  // Initialize delay visualizer
  const delayVisualizer = new DelayVisualizer(scene);

  // Store current delay data for tooltips
  let currentDelayData = new Map<string, import('./delays/delay-types').StationDelayInfo>();

  // Start polling for delay data
  const stopPolling = startDelayDataPolling((delayData) => {
    delayVisualizer.updateDelays(delayData);
    currentDelayData = delayData; // Store for tooltip access
    console.log(`Updated delay visualization for ${delayData.size} stations`);
  });

  // Initialize tooltip manager
  const tooltipManager = new TooltipManager();

  // Setup raycasting for station hover detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  container.addEventListener('mousemove', (event) => {
    // Only show enhanced tooltips when labels are hidden
    const labelsVisible = getStationLabelsVisible();
    if (labelsVisible) {
      tooltipManager.hide();
      return;
    }

    // Calculate mouse position in normalized device coordinates
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with station spheres
    const intersects = raycaster.intersectObjects(stationSpheres);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      if (intersected.userData.isStation && intersected.userData.stationName) {
        const stationName = intersected.userData.stationName;
        const delayInfo = currentDelayData.get(stationName);
        tooltipManager.show(stationName, event.clientX, event.clientY, delayInfo);
      }
    } else {
      tooltipManager.hide();
    }
  });

  container.addEventListener('mouseleave', () => {
    tooltipManager.hide();
  });

  // Setup toggle button for station labels
  const toggleButton = document.getElementById('toggle-labels-btn') as HTMLButtonElement;
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const currentlyVisible = getStationLabelsVisible();
      toggleStationLabels(!currentlyVisible);
      toggleButton.textContent = currentlyVisible ? 'Show Labels' : 'Hide Labels';
    });
  }

  // Setup window resize handler
  setupResizeHandler(camera, renderer);

  // Create and expose public API
  const railwayAPI = createRailwayAPI(scene);
  (window as any).railwayAPI = railwayAPI;

  // Start the animation loop with train updates and delay animations
  startAnimationLoop(renderer, scene, camera, controls, () => {
    updateTrains();
    delayVisualizer.animate();
  });

  console.log('3D Norwegian Railway Network visualization initialized');
  console.log('Available API: window.railwayAPI');
  console.log('Available lines:', railwayAPI.getLines());
  console.log('Delay visualization: Active (polling every 30s)');

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopPolling();
  });
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
