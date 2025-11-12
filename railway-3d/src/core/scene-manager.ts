/**
 * Scene manager - handles Three.js scene, camera, renderer, controls, and lighting setup
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CAMERA_CONFIG,
  CONTROLS_CONFIG,
  SCENE_CONFIG,
  LIGHTING_CONFIG,
} from '../data/constants';

export interface SceneComponents {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

/**
 * Initialize the Three.js scene with all components
 */
export function initializeScene(container: HTMLElement): SceneComponents {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_CONFIG.BACKGROUND_COLOR);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_CONFIG.NEAR,
    CAMERA_CONFIG.FAR
  );
  camera.position.set(
    CAMERA_CONFIG.INITIAL_POSITION.x,
    CAMERA_CONFIG.INITIAL_POSITION.y,
    CAMERA_CONFIG.INITIAL_POSITION.z
  );
  camera.lookAt(CAMERA_CONFIG.LOOK_AT.x, CAMERA_CONFIG.LOOK_AT.y, CAMERA_CONFIG.LOOK_AT.z);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Controls setup
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CONTROLS_CONFIG.DAMPING_FACTOR;
  controls.minDistance = CONTROLS_CONFIG.MIN_DISTANCE;
  controls.maxDistance = CONTROLS_CONFIG.MAX_DISTANCE;

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(
    LIGHTING_CONFIG.AMBIENT.COLOR,
    LIGHTING_CONFIG.AMBIENT.INTENSITY
  );
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(
    LIGHTING_CONFIG.DIRECTIONAL_1.COLOR,
    LIGHTING_CONFIG.DIRECTIONAL_1.INTENSITY
  );
  directionalLight1.position.set(
    LIGHTING_CONFIG.DIRECTIONAL_1.POSITION.x,
    LIGHTING_CONFIG.DIRECTIONAL_1.POSITION.y,
    LIGHTING_CONFIG.DIRECTIONAL_1.POSITION.z
  );
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(
    LIGHTING_CONFIG.DIRECTIONAL_2.COLOR,
    LIGHTING_CONFIG.DIRECTIONAL_2.INTENSITY
  );
  directionalLight2.position.set(
    LIGHTING_CONFIG.DIRECTIONAL_2.POSITION.x,
    LIGHTING_CONFIG.DIRECTIONAL_2.POSITION.y,
    LIGHTING_CONFIG.DIRECTIONAL_2.POSITION.z
  );
  scene.add(directionalLight2);

  return { scene, camera, renderer, controls };
}

/**
 * Setup window resize handler
 */
export function setupResizeHandler(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/**
 * Start the animation loop
 */
export function startAnimationLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  updateCallback?: () => void
): void {
  function animate(): void {
    requestAnimationFrame(animate);
    controls.update();
    if (updateCallback) {
      updateCallback();
    }
    renderer.render(scene, camera);
  }

  animate();
}
