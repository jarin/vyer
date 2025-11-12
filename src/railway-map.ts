/**
 * Railway Map Module
 * Integrates 3D and 2D visualizations of the Norwegian railway network
 */

import * as d3 from 'd3';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Import railway data from the railway-3d project
import { railwayData } from '../railway-3d/src/data/railway-data';

export type MapViewMode = '2d' | '3d';

export interface RailwayMapOptions {
  container3d: HTMLElement;
  container2d: HTMLElement;
  initialMode?: MapViewMode;
}

export class RailwayMap {
  private container3d: HTMLElement;
  private container2d: HTMLElement;
  private currentMode: MapViewMode;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private animationFrameId?: number;

  constructor(options: RailwayMapOptions) {
    this.container3d = options.container3d;
    this.container2d = options.container2d;
    this.currentMode = options.initialMode || '3d';
  }

  /**
   * Initialize the map visualization
   */
  async initialize(): Promise<void> {
    if (this.currentMode === '3d') {
      await this.initialize3D();
    } else {
      this.initialize2D();
    }
  }

  /**
   * Switch between 2D and 3D views
   */
  switchMode(mode: MapViewMode): void {
    if (mode === this.currentMode) return;

    this.currentMode = mode;

    if (mode === '3d') {
      this.container2d.style.display = 'none';
      this.container3d.style.display = 'block';
      this.initialize3D();
    } else {
      this.container3d.style.display = 'none';
      this.container2d.style.display = 'block';
      this.initialize2D();
    }
  }

  /**
   * Initialize 3D visualization
   */
  private async initialize3D(): Promise<void> {
    // Clean up existing 3D scene
    this.cleanup3D();

    // Dynamically import the 3D visualization modules
    const { initializeScene, setupResizeHandler, startAnimationLoop } = await import(
      '../railway-3d/src/core/scene-manager'
    );
    const { createTerrain } = await import('../railway-3d/src/terrain/terrain-generator');
    const { createRailwayLines, createStations, getStationLabelsVisible, stationSpheres } =
      await import('../railway-3d/src/railway/railway-renderer');
    const { DelayVisualizer } = await import('../railway-3d/src/delays/delay-visualizer');
    const { startDelayDataPolling } = await import('../railway-3d/src/delays/delay-fetcher');
    const { TooltipManager } = await import('../railway-3d/src/core/tooltip-manager');

    // Initialize scene
    const { scene, camera, renderer, controls } = initializeScene(this.container3d);
    this.renderer = renderer;
    this.controls = controls;

    // Add terrain
    scene.add(createTerrain());

    // Add railway lines
    scene.add(createRailwayLines());

    // Add stations
    scene.add(createStations());

    // Initialize delay visualizer
    const delayVisualizer = new DelayVisualizer(scene);

    // Store current delay data for tooltips
    let currentDelayData = new Map<string, any>();

    // Start polling for delay data
    startDelayDataPolling((delayData) => {
      delayVisualizer.updateDelays(delayData);
      currentDelayData = delayData;
    });

    // Initialize tooltip manager
    const tooltipManager = new TooltipManager();

    // Setup raycasting for station hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const labelsVisible = getStationLabelsVisible();
      if (labelsVisible) {
        tooltipManager.hide();
        return;
      }

      const rect = this.container3d.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
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
    };

    this.container3d.addEventListener('mousemove', handleMouseMove);
    this.container3d.addEventListener('mouseleave', () => tooltipManager.hide());

    // Setup resize handler with container reference
    setupResizeHandler(camera, renderer, this.container3d);

    // Start animation loop
    startAnimationLoop(renderer, scene, camera, controls);
  }

  /**
   * Initialize 2D visualization
   */
  private initialize2D(): void {
    // Clear existing content
    this.container2d.innerHTML = '';

    // Create SVG container
    const width = this.container2d.clientWidth;
    const height = this.container2d.clientHeight;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(this.container2d)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#0a0e1a');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate bounds for scaling
    const stations = railwayData.stations;
    const stationNames = Object.keys(stations);

    const xValues = stationNames.map((name) => stations[name].x);
    const zValues = stationNames.map((name) => stations[name].z);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);

    // Create scales (z becomes y in 2D view)
    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([zMin, zMax]).range([innerHeight, 0]); // Inverted for SVG

    // Draw railway lines
    railwayData.lines.forEach((line) => {
      const lineColor = `#${line.color.toString(16).padStart(6, '0')}`;

      // Create path data
      const pathData = line.stations
        .map((stationName, index) => {
          const station = stations[stationName];
          if (!station) return null;

          const x = xScale(station.x);
          const y = yScale(station.z);

          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .filter((d) => d !== null)
        .join(' ');

      // Draw line
      g.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('opacity', 0.7)
        .on('mouseover', function () {
          d3.select(this).attr('stroke-width', 5).attr('opacity', 1);
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke-width', 3).attr('opacity', 0.7);
        });
    });

    // Draw stations
    stationNames.forEach((name) => {
      const station = stations[name];
      const x = xScale(station.x);
      const y = yScale(station.z);

      // Station marker
      const circle = g
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#ffffff')
        .attr('stroke', '#667eea')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      // Station label
      const text = g
        .append('text')
        .attr('x', x)
        .attr('y', y - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0.8)
        .text(name)
        .style('pointer-events', 'none');

      // Hover effects
      circle
        .on('mouseover', function () {
          d3.select(this).attr('r', 7).attr('fill', '#667eea');
          text.attr('opacity', 1).attr('font-size', '12px');
        })
        .on('mouseout', function () {
          d3.select(this).attr('r', 4).attr('fill', '#ffffff');
          text.attr('opacity', 0.8).attr('font-size', '10px');
        });
    });

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text('Norwegian Railway Network - 2D View');

    // Add legend
    const legend = svg.append('g').attr('transform', `translate(${width - 180}, 50)`);

    legend
      .append('rect')
      .attr('width', 160)
      .attr('height', railwayData.lines.length * 25 + 20)
      .attr('fill', 'rgba(0, 0, 0, 0.7)')
      .attr('rx', 8);

    railwayData.lines.forEach((line, index) => {
      const lineColor = `#${line.color.toString(16).padStart(6, '0')}`;
      const y = 15 + index * 25;

      legend
        .append('line')
        .attr('x1', 10)
        .attr('x2', 30)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', lineColor)
        .attr('stroke-width', 3);

      legend
        .append('text')
        .attr('x', 35)
        .attr('y', y)
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '11px')
        .text(line.name);
    });
  }

  /**
   * Clean up 3D resources
   */
  private cleanup3D(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    this.container3d.innerHTML = '';
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.cleanup3D();
    this.container2d.innerHTML = '';
  }
}
