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
    // TODO: Re-enable 3D mode when needed
    // For now, always initialize in 2D mode for editing
    // if (this.currentMode === '3d') {
    //   await this.initialize3D();
    // } else {
      this.initialize2D();
    // }
  }

  /**
   * Switch between 2D and 3D views
   */
  switchMode(mode: MapViewMode): void {
    if (mode === this.currentMode) return;

    this.currentMode = mode;

    if (mode === '3d') {
      // TODO: Re-enable 3D map functionality
      // Temporarily disabled to focus on editable 2D map
      console.warn('3D mode temporarily disabled');
      // this.container2d.style.display = 'none';
      // this.container3d.style.display = 'block';
      // this.initialize3D();
    } else {
      this.container3d.style.display = 'none';
      this.container2d.style.display = 'block';
      this.initialize2D();
    }
  }

  /**
   * Initialize 3D visualization
   * TODO: Re-enable this when 3D mode is needed again
   */
  // @ts-ignore - Temporarily unused
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

    // Enable scrolling on container and ensure it has proper dimensions
    this.container2d.style.overflow = 'auto';
    this.container2d.style.position = 'relative';
    this.container2d.style.width = '100%';
    this.container2d.style.height = '100%';

    console.log('Initializing 2D map:', {
      containerWidth: this.container2d.clientWidth,
      containerHeight: this.container2d.clientHeight,
    });

    // Dynamically import delay modules
    const { startDelayDataPolling } = await import('../railway-3d/src/delays/delay-fetcher');
    const { TooltipManager } = await import('../railway-3d/src/core/tooltip-manager');

    // Store current delay data
    let currentDelayData = new Map<string, any>();

    // Create larger SVG canvas for better spacing
    const width = 4000;
    const height = 3000;
    const margin = { top: 20, right: 200, bottom: 40, left: 40 };
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
    // Load from localStorage if available, otherwise use default layout
    let subwayLayout = this.loadLayoutFromStorage();

    // Validate loaded layout - check if positions are reasonable
    if (subwayLayout && subwayLayout.size > 0) {
      let isValid = true;
      subwayLayout.forEach((pos) => {
        // Check if positions are within reasonable bounds
        if (pos.x < 0 || pos.x > innerWidth || pos.y < 0 || pos.y > innerHeight) {
          isValid = false;
        }
      });

      if (!isValid) {
        console.log('Invalid layout detected in localStorage, resetting to default');
        localStorage.removeItem('railway-map-layout');
        subwayLayout = null;
      }
    }

    if (!subwayLayout || subwayLayout.size === 0) {
      subwayLayout = this.createSubwayLayout(innerWidth, innerHeight, majorStations);
      this.saveLayoutToStorage(subwayLayout);
    }

    // Debug: Log first few stations
    console.log('Layout created/loaded:', {
      totalStations: subwayLayout.size,
      'Oslo S': subwayLayout.get('Oslo S'),
      'Bergen': subwayLayout.get('Bergen'),
      'Trondheim S': subwayLayout.get('Trondheim S'),
    });

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

    // Redraw all lines (called after drag)
    const redrawLines = () => {
      g.selectAll('path').remove();
      railwayData.lines.forEach((line) => {
        const lineColor = `#${line.color.toString(16).padStart(6, '0')}`;
        const pathData = this.createOrthogonalPath(line.stations, subwayLayout);
        if (!pathData) return;

        g.insert('path', ':first-child')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', lineColor)
          .attr('stroke-width', 4)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('opacity', 0.8);
      });
    };

    // Capture class instance for drag handler
    const saveLayout = (layout: Map<string, { x: number; y: number }>) => {
      this.saveLayoutToStorage(layout);
    };

    // Setup drag behavior
    const drag = d3.drag<SVGCircleElement, unknown>()
      .on('start', function(this: SVGCircleElement) {
        d3.select(this).raise().attr('stroke-width', 4);
      })
      .on('drag', function(this: SVGCircleElement, event) {
        const stationName = d3.select(this).attr('data-station');
        const pos = subwayLayout.get(stationName);
        if (pos) {
          pos.x = event.x;
          pos.y = event.y;

          // Update circle position
          d3.select(this).attr('cx', pos.x).attr('cy', pos.y);

          // Update label position
          stationGroup
            .select(`[data-station-label="${stationName}"]`)
            .attr('x', pos.x)
            .attr('y', pos.y - (majorStations.has(stationName) ? 12 : 9));

          // Redraw lines
          redrawLines();
        }
      })
      .on('end', function(this: SVGCircleElement) {
        const isMajor = majorStations.has(d3.select(this).attr('data-station'));
        d3.select(this).attr('stroke-width', isMajor ? 3 : 2);

        // Save to localStorage
        saveLayout(subwayLayout);
      });

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

      // Station marker (draggable)
      const circle = stationGroup
        .append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', radius)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', isMajor ? 3 : 2)
        .style('cursor', 'move')
        .attr('data-station', name)
        .call(drag);

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

    // Add control buttons
    const controls = svg.append('g').attr('transform', 'translate(20, 20)');

    // Export button
    const exportBtn = controls.append('g').style('cursor', 'pointer');
    exportBtn
      .append('rect')
      .attr('width', 140)
      .attr('height', 35)
      .attr('fill', 'rgba(102, 126, 234, 0.9)')
      .attr('rx', 5);
    exportBtn
      .append('text')
      .attr('x', 70)
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Export Layout');
    exportBtn.on('click', () => this.exportLayout(subwayLayout));

    // Reset button
    const resetBtn = controls.append('g').attr('transform', 'translate(0, 45)').style('cursor', 'pointer');
    resetBtn
      .append('rect')
      .attr('width', 140)
      .attr('height', 35)
      .attr('fill', 'rgba(234, 102, 102, 0.9)')
      .attr('rx', 5);
    resetBtn
      .append('text')
      .attr('x', 70)
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Reset Layout');
    resetBtn.on('click', () => {
      if (confirm('Reset to default layout? This will clear your custom positioning.')) {
        localStorage.removeItem('railway-map-layout');
        // Reinitialize without full page reload to stay on 2D map
        this.initialize2D();
      }
    });

    // Add legend
    const legend = svg.append('g').attr('transform', `translate(${width - 180}, 20)`);

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
    // Center the map in the canvas with room for all directions
    const centerX = width * 0.55; // Slightly right of center for westbound lines
    const centerY = height * 0.5;
    const stationSpacing = 50; // Increased spacing for better visibility

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

    // Second segment: From Moelv, go west/northwest to Trondheim at shallow angle (15 degrees)
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
    // Use 15-degree angle: cos(15°) ≈ 0.966, sin(15°) ≈ 0.259
    layoutLine(dovreStationsSecond, moelvPos.x - stationSpacing * 0.966, moelvPos.y - stationSpacing * 0.259, {
      x: -0.966,
      y: -0.259
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
   * Create path routing with smooth diagonal lines
   * Routes lines with straight diagonal connections between stations
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

      // Draw straight line to next station (diagonal if needed)
      pathSegments.push(`L ${currPos.x} ${currPos.y}`);

      prevPos = currPos;
    }

    return pathSegments.join(' ');
  }

  /**
   * Save layout to localStorage
   */
  private saveLayoutToStorage(layout: Map<string, { x: number; y: number }>): void {
    const layoutObj: Record<string, { x: number; y: number }> = {};
    layout.forEach((pos, name) => {
      layoutObj[name] = pos;
    });
    localStorage.setItem('railway-map-layout', JSON.stringify(layoutObj));
  }

  /**
   * Load layout from localStorage
   */
  private loadLayoutFromStorage(): Map<string, { x: number; y: number }> | null {
    const stored = localStorage.getItem('railway-map-layout');
    if (!stored) return null;

    try {
      const layoutObj = JSON.parse(stored);
      const layout = new Map<string, { x: number; y: number }>();
      Object.keys(layoutObj).forEach((name) => {
        layout.set(name, layoutObj[name]);
      });
      return layout;
    } catch (e) {
      console.error('Failed to load layout from localStorage:', e);
      return null;
    }
  }

  /**
   * Export layout as JSON (copies to clipboard and downloads)
   */
  private exportLayout(layout: Map<string, { x: number; y: number }>): void {
    const layoutObj: Record<string, { x: number; y: number }> = {};
    layout.forEach((pos, name) => {
      layoutObj[name] = pos;
    });

    const json = JSON.stringify(layoutObj, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
      alert('Layout copied to clipboard!\n\nYou can paste this into your code.');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'railway-map-layout.json';
      a.click();
      URL.revokeObjectURL(url);
      alert('Layout downloaded as railway-map-layout.json');
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
