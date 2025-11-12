/**
 * Railway Map Module
 * Integrates 3D and 2D visualizations of the Norwegian railway network
 */

import * as d3 from 'd3';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

    // Setup resize handler
    setupResizeHandler(camera, renderer);

    // Start animation loop
    startAnimationLoop(renderer, scene, camera, controls);
  }

  /**
   * Initialize 2D visualization with subway-style layout
   */
  private async initialize2D(): Promise<void> {
    // Clear existing content
    this.container2d.innerHTML = '';

    // Dynamically import delay modules
    const { startDelayDataPolling } = await import('../railway-3d/src/delays/delay-fetcher');
    const { TooltipManager } = await import('../railway-3d/src/core/tooltip-manager');

    // Store current delay data
    let currentDelayData = new Map<string, any>();

    // Create SVG container
    const width = this.container2d.clientWidth;
    const height = this.container2d.clientHeight;
    const margin = { top: 60, right: 200, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(this.container2d)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#0a0e1a');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Define major stations
    const majorStations = new Set([
      'Drammen',
      'Lysaker',
      'Nationaltheatret',
      'Oslo S',
      'Gardermoen', // Note: not in current data
      'Trondheim S',
    ]);

    // Create subway-style schematic layout
    // This uses a grid-based approach with manual positioning for better readability
    const subwayLayout = this.createSubwayLayout(innerWidth, innerHeight, majorStations);

    // Draw railway lines with schematic routing
    railwayData.lines.forEach((line) => {
      const lineColor = `#${line.color.toString(16).padStart(6, '0')}`;

      // Create path data using subway layout
      const pathData = line.stations
        .map((stationName, index) => {
          const pos = subwayLayout.get(stationName);
          if (!pos) return null;

          return index === 0 ? `M ${pos.x} ${pos.y}` : `L ${pos.x} ${pos.y}`;
        })
        .filter((d) => d !== null)
        .join(' ');

      // Draw line
      g.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('opacity', 0.8)
        .on('mouseover', function (this: SVGPathElement) {
          d3.select(this).attr('stroke-width', 6).attr('opacity', 1);
        })
        .on('mouseout', function (this: SVGPathElement) {
          d3.select(this).attr('stroke-width', 4).attr('opacity', 0.8);
        });
    });

    // Initialize tooltip manager
    const tooltipManager = new TooltipManager();

    // Group for delay indicators (pulsating rings)
    const delayGroup = g.append('g').attr('class', 'delay-indicators');

    // Group for stations
    const stationGroup = g.append('g').attr('class', 'stations');

    // Function to update delay visualizations
    const updateDelayVisualizations = () => {
      // Remove old delay indicators
      delayGroup.selectAll('*').remove();

      // Add delay indicators for stations with delays
      currentDelayData.forEach((delayInfo, stationName) => {
        const pos = subwayLayout.get(stationName);
        if (!pos) return;

        const shouldShow =
          delayInfo.delayCategory === 'moderate' ||
          delayInfo.delayCategory === 'severe' ||
          delayInfo.delayCategory === 'chaos';

        if (shouldShow) {
          // Get color based on severity
          const colorMap = {
            moderate: '#ffa500',
            severe: '#ff4500',
            chaos: '#ff0000',
          };
          const color = colorMap[delayInfo.delayCategory as keyof typeof colorMap];

          // Add pulsating ring
          delayGroup
            .append('circle')
            .attr('cx', pos.x)
            .attr('cy', pos.y)
            .attr('r', majorStations.has(stationName) ? 16 : 12)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('opacity', 0.6)
            .attr('class', 'pulse-ring');

          // Add delay emoji as text
          const emojiMap = {
            moderate: '😬',
            severe: '🔥',
            chaos: '🚨',
          };
          delayGroup
            .append('text')
            .attr('x', pos.x)
            .attr('y', pos.y + (majorStations.has(stationName) ? 26 : 22))
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .style('pointer-events', 'none')
            .text(emojiMap[delayInfo.delayCategory as keyof typeof emojiMap]);
        }
      });
    };

    // Draw stations
    subwayLayout.forEach((pos, name) => {
      const isMajor = majorStations.has(name);
      const radius = isMajor ? 8 : 5;
      const delayInfo = currentDelayData.get(name);

      // Determine station color based on delay
      let fillColor = '#ffffff';
      let strokeColor = '#667eea';

      if (delayInfo) {
        const colorMap: Record<string, string> = {
          'on-time': '#00ff00',
          minor: '#ffff00',
          moderate: '#ffa500',
          severe: '#ff4500',
          chaos: '#ff0000',
        };
        strokeColor = colorMap[delayInfo.delayCategory] || strokeColor;
      }

      // Station marker
      const circle = stationGroup
        .append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', radius)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', isMajor ? 3 : 2)
        .style('cursor', 'pointer')
        .attr('data-station', name);

      // Station label (always visible for major stations)
      stationGroup
        .append('text')
        .attr('x', pos.x)
        .attr('y', pos.y - radius - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', isMajor ? '12px' : '10px')
        .attr('font-weight', isMajor ? 'bold' : 'normal')
        .attr('opacity', isMajor ? 1 : 0.7)
        .text(name)
        .style('pointer-events', 'none')
        .attr('data-station-label', name);

      // Hover effects with tooltip
      circle
        .on('mouseover', function (this: SVGCircleElement, event: MouseEvent) {
          const hoveredStation = d3.select(this).attr('data-station');
          d3.select(this).attr('r', isMajor ? 12 : 8).attr('fill', strokeColor);
          stationGroup
            .select(`[data-station-label="${hoveredStation}"]`)
            .attr('opacity', 1)
            .attr('font-size', isMajor ? '14px' : '12px');

          // Show tooltip
          const delayInfo = currentDelayData.get(name);
          tooltipManager.show(name, event.pageX, event.pageY, delayInfo);
        })
        .on('mousemove', function (this: SVGCircleElement, event: MouseEvent) {
          tooltipManager.update(event.pageX, event.pageY);
        })
        .on('mouseout', function (this: SVGCircleElement) {
          const hoveredStation = d3.select(this).attr('data-station');
          d3.select(this).attr('r', radius).attr('fill', fillColor);
          stationGroup
            .select(`[data-station-label="${hoveredStation}"]`)
            .attr('opacity', isMajor ? 1 : 0.7)
            .attr('font-size', isMajor ? '12px' : '10px');

          tooltipManager.hide();
        });
    });

    // Start polling for delay data
    startDelayDataPolling((delayData) => {
      currentDelayData = delayData;
      updateDelayVisualizations();

      // Update station colors based on delays
      subwayLayout.forEach((_pos, name) => {
        const delayInfo = delayData.get(name);
        const isMajor = majorStations.has(name);

        if (delayInfo) {
          const colorMap: Record<string, string> = {
            'on-time': '#00ff00',
            minor: '#ffff00',
            moderate: '#ffa500',
            severe: '#ff4500',
            chaos: '#ff0000',
          };
          const strokeColor = colorMap[delayInfo.delayCategory] || '#667eea';

          stationGroup
            .select(`circle[data-station="${name}"]`)
            .attr('stroke', strokeColor)
            .attr('stroke-width', isMajor ? 3 : 2);
        }
      });
    });

    // Animate pulsating rings
    const animatePulse = () => {
      delayGroup.selectAll('.pulse-ring').each(function () {
        const ring = d3.select(this as SVGCircleElement);
        const baseR = parseFloat(ring.attr('r'));

        ring
          .transition()
          .duration(1500)
          .attr('r', baseR * 1.3)
          .attr('opacity', 0.2)
          .transition()
          .duration(1500)
          .attr('r', baseR)
          .attr('opacity', 0.6)
          .on('end', function () {
            animatePulse();
          });
      });
    };

    // Start animation
    setTimeout(animatePulse, 100);

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('Norwegian Railway Network - Subway Map Style');

    // Add legend
    const legend = svg.append('g').attr('transform', `translate(${width - 180}, 60)`);

    legend
      .append('rect')
      .attr('width', 160)
      .attr('height', railwayData.lines.length * 25 + 20)
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .attr('rx', 8)
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1);

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
        .attr('stroke-width', 4);

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
   * Create subway-style schematic layout
   * Uses a grid-based system with strategic positioning for better readability
   */
  private createSubwayLayout(
    width: number,
    height: number,
    _majorStations: Set<string>
  ): Map<string, { x: number; y: number }> {
    const stations = railwayData.stations;
    const layout = new Map<string, { x: number; y: number }>();

    // Get bounds
    const stationNames = Object.keys(stations);
    const xValues = stationNames.map((name) => stations[name].x);
    const zValues = stationNames.map((name) => stations[name].z);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);

    // Create scales with extra spacing for crowded areas
    // The subway map style uses more horizontal space and compresses less important areas
    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
    const yScale = d3.scaleLinear().domain([zMin, zMax]).range([height, 0]);

    // Apply schematic positioning with adjustments for crowded areas
    stationNames.forEach((name) => {
      const station = stations[name];
      let x = xScale(station.x);
      let y = yScale(station.z);

      // Adjust crowded Oslo area (expand horizontally and vertically)
      if (station.x >= -5 && station.x <= 5 && station.z >= -5 && station.z <= 5) {
        const centerX = xScale(0);
        const centerY = yScale(0);
        x = centerX + (x - centerX) * 2; // Expand by 2x
        y = centerY + (y - centerY) * 2;
      }

      // Snap to grid for cleaner look (optional - comment out for smoother positioning)
      // x = Math.round(x / 20) * 20;
      // y = Math.round(y / 20) * 20;

      layout.set(name, { x, y });
    });

    return layout;
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
