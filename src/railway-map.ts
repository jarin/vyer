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

    // Draw railway lines with orthogonal routing
    railwayData.lines.forEach((line) => {
      const lineColor = `#${line.color.toString(16).padStart(6, '0')}`;

      // Create path data using orthogonal routing for subway-style appearance
      const pathData = this.createOrthogonalPath(line.stations, subwayLayout);

      if (!pathData) return;

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
   * Uses even spacing and ignores geography for better readability
   */
  private createSubwayLayout(
    width: number,
    height: number,
    _majorStations: Set<string>
  ): Map<string, { x: number; y: number }> {
    const layout = new Map<string, { x: number; y: number }>();
    // Shift center right by 27.5% and down by one station spacing
    const centerX = width / 2 + width * 0.275;
    const centerY = height / 2 + 40;
    const stationSpacing = 40; // Pixels between stations

    // Helper to position stations along a line with even spacing
    const layoutLine = (
      stations: string[],
      startX: number,
      startY: number,
      direction: { x: number; y: number }
    ) => {
      stations.forEach((station, index) => {
        layout.set(station, {
          x: startX + direction.x * index * stationSpacing,
          y: startY + direction.y * index * stationSpacing,
        });
      });
    };

    // Oslo S as the central hub
    layout.set('Oslo S', { x: centerX, y: centerY });

    // Bergensbanen - goes west (left) from Oslo
    const bergenStations = [
      'Nationaltheatret',
      'Skøyen',
      'Lysaker',
      'Sandvika',
      'Asker',
      'Drammen',
      'Mjøndalen',
      'Hokksund',
      'Vikersund',
      'Hønefoss',
      'Nesbyen',
      'Gol',
      'Ål',
      'Geilo',
      'Ustaoset',
      'Haugastøl',
      'Finse',
      'Hallingskeid',
      'Myrdal',
      'Voss',
      'Dale',
      'Arna',
      'Bergen',
    ];
    layoutLine(bergenStations, centerX - stationSpacing, centerY, { x: -1, y: 0 });

    // Vestfoldbanen - goes south-west from Drammen (already positioned)
    const vestfoldStations = [
      'Sande',
      'Holmestrand',
      'Tønsberg',
      'Sandefjord',
      'Larvik',
      'Porsgrunn',
      'Skien',
    ];
    const drammenPos = layout.get('Drammen')!;
    layoutLine(vestfoldStations, drammenPos.x, drammenPos.y + stationSpacing, { x: 0, y: 1 });

    // Bratsbergbanen - from Porsgrunn
    const porsgrunnPos = layout.get('Porsgrunn')!;
    layout.set('Notodden', {
      x: porsgrunnPos.x + stationSpacing,
      y: porsgrunnPos.y,
    });

    // Flåmsbana - branch from Myrdal going down
    const myrdalPos = layout.get('Myrdal')!;
    const flaamStations = ['Vatnahalsen', 'Kjosfossen', 'Berekvam', 'Flåm'];
    layoutLine(flaamStations, myrdalPos.x, myrdalPos.y + stationSpacing, { x: 0, y: 1 });

    // Dovrebanen - goes north from Oslo, then curves west to Trondheim
    // First segment: Oslo to Moelv (straight north)
    const dovreStationsFirst = [
      'Lillestrøm',
      'Dal',
      'Eidsvoll',
      'Minnesund',
      'Tangen',
      'Hamar',
      'Brumunddal',
      'Moelv',
    ];
    layoutLine(dovreStationsFirst, centerX, centerY - stationSpacing, { x: 0, y: -1 });

    // Second segment: From Moelv, go west/northwest to Trondheim
    const moelvPos = layout.get('Moelv')!;
    const dovreStationsSecond = [
      'Lillehammer',
      'Vinstra',
      'Otta',
      'Dombås',
      'Lesja',
      'Oppdal',
      'Støren',
      'Trondheim S',
    ];
    layoutLine(dovreStationsSecond, moelvPos.x - stationSpacing * 0.7, moelvPos.y - stationSpacing * 0.7, {
      x: -0.7,
      y: -0.7
    });

    // Raumabanen - branch from Dombås going west
    const dombaasPos = layout.get('Dombås')!;
    const raumaStations = ['Bjorli', 'Åndalsnes'];
    layoutLine(raumaStations, dombaasPos.x - stationSpacing, dombaasPos.y, { x: -1, y: 0 });

    // Gjøvikbanen - northwest from Oslo
    const gjovikStations = ['Nydalen', 'Grefsen', 'Roa', 'Lunner', 'Gjøvik'];
    layoutLine(gjovikStations, centerX - stationSpacing * 0.7, centerY - stationSpacing * 0.7, {
      x: -0.7,
      y: -0.7,
    });

    // Østfoldbanen (Vestre) - southeast from Oslo
    const ostfoldVestreStations = [
      'Loenga',
      'Ski',
      'Ås',
      'Vestby',
      'Moss',
      'Rygge',
      'Fredrikstad',
      'Sarpsborg',
      'Halden',
      'Kornsjø',
    ];
    layoutLine(ostfoldVestreStations, centerX + stationSpacing * 0.5, centerY + stationSpacing * 0.5, {
      x: 0.5,
      y: 0.5,
    });

    // Østfoldbanen (Østre) - east from Ski
    const skiPos = layout.get('Ski')!;
    const ostfoldOstreStations = ['Spydeberg', 'Askim', 'Mysen', 'Rakkestad'];
    layoutLine(ostfoldOstreStations, skiPos.x + stationSpacing, skiPos.y, { x: 1, y: 0 });

    // Rørosbanen - from Hamar going east to Os, then up/west to Trondheim
    const hamarPos = layout.get('Hamar')!;
    const rorosStations = ['Elverum', 'Koppang', 'Tynset', 'Røros', 'Os'];
    layoutLine(rorosStations, hamarPos.x + stationSpacing, hamarPos.y, { x: 1, y: 0 });

    // Note: The Rørosbanen continues from Os to Trondheim S
    // This connection will be handled by the orthogonal path routing
    // Get Trondheim position for connecting lines
    const trondheimPos = layout.get('Trondheim S')!;

    // Nordlandsbanen - north from Trondheim
    const nordlandStations = [
      'Steinkjer',
      'Grong',
      'Mosjøen',
      'Mo i Rana',
      'Rognan',
      'Fauske',
      'Bodø',
    ];
    layoutLine(nordlandStations, trondheimPos.x, trondheimPos.y - stationSpacing, {
      x: 0,
      y: -1,
    });

    // Sørlandsbanen - southwest from Oslo through Drammen/Kongsberg
    layout.set('Kongsberg', {
      x: drammenPos.x - stationSpacing * 0.7,
      y: drammenPos.y + stationSpacing * 0.7,
    });
    const kongsbergPos = layout.get('Kongsberg')!;
    const sorlandStations = [
      'Nordagutu',
      'Bø',
      'Lunde',
      'Kristiansand',
      'Vennesla',
      'Marnardal',
      'Egersund',
      'Sandnes',
      'Stavanger',
    ];
    layoutLine(sorlandStations, kongsbergPos.x - stationSpacing * 0.7, kongsbergPos.y + stationSpacing * 0.7, {
      x: -0.7,
      y: 0.7,
    });

    // Meråkerbanen - from Trondheim going east
    layout.set('Hell', { x: trondheimPos.x + stationSpacing, y: trondheimPos.y });
    const hellPos = layout.get('Hell')!;
    const merakerStations = ['Hegra', 'Meråker', 'Storlien'];
    layoutLine(merakerStations, hellPos.x + stationSpacing, hellPos.y, { x: 1, y: 0 });

    return layout;
  }

  /**
   * Create orthogonal path routing for subway-style lines
   * Routes lines with 90-degree angles between stations
   */
  private createOrthogonalPath(stations: string[], layout: Map<string, { x: number; y: number }>): string {
    if (stations.length === 0) return '';

    const pathSegments: string[] = [];
    let prevPos = layout.get(stations[0]);
    if (!prevPos) return '';

    pathSegments.push(`M ${prevPos.x} ${prevPos.y}`);

    for (let i = 1; i < stations.length; i++) {
      const currPos = layout.get(stations[i]);
      if (!currPos) continue;

      const dx = currPos.x - prevPos.x;
      const dy = currPos.y - prevPos.y;

      // If the movement is purely horizontal or vertical, draw straight line
      if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
        pathSegments.push(`L ${currPos.x} ${currPos.y}`);
      } else {
        // Use orthogonal routing - go horizontal first, then vertical
        // Or vertical first if that's the dominant direction
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal dominant
          const midX = prevPos.x + dx;
          pathSegments.push(`L ${midX} ${prevPos.y}`);
          pathSegments.push(`L ${currPos.x} ${currPos.y}`);
        } else {
          // Vertical dominant
          const midY = prevPos.y + dy;
          pathSegments.push(`L ${prevPos.x} ${midY}`);
          pathSegments.push(`L ${currPos.x} ${currPos.y}`);
        }
      }

      prevPos = currPos;
    }

    return pathSegments.join(' ');
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
