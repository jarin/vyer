import * as d3 from 'd3';
import { ScientificVisualizations } from './scientific-viz';

interface TransitJourney {
  vehicle_journey_id: string;
  line_ref: string;
  last_stop_name: string;
  aimed_last_stop_time: string;
  actual_last_stop_time: string;
  recorded_delay_seconds: number;
  next_stop_name: string;
  aimed_next_stop_time: string;
}

interface Statistics {
  totalJourneys: number;
  avgDelay: number;
  worstDelay: number;
  chaosScore: number;
  worstLine: string;
}

class TransitRaceTrack {
  private apiBaseUrl = 'http://localhost:3001/api/stop/';
  private currentStop = 'Lysaker stasjon';
  private secondsUntilRefresh = 60;
  private scientificViz: ScientificVisualizations;
  private currentData: TransitJourney[] = [];

  constructor() {
    this.scientificViz = new ScientificVisualizations();
    this.setupEventListeners();
    this.setupTabSwitching();
    this.fetchAndRender();
    this.startAutoRefresh();
  }

  private setupEventListeners(): void {
    const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
    const stopNameInput = document.getElementById('stop-name') as HTMLInputElement;

    refreshBtn.addEventListener('click', () => {
      this.currentStop = stopNameInput.value.trim();
      this.fetchAndRender();
      this.resetCountdown();
    });

    stopNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.currentStop = stopNameInput.value.trim();
        this.fetchAndRender();
        this.resetCountdown();
      }
    });
  }

  private setupTabSwitching(): void {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab;

        // Update active states
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        tabContents.forEach(content => {
          content.classList.remove('active');
        });

        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
          activeContent.classList.add('active');

          // If switching to scientific tab and we have data, render visualizations
          if (tabName === 'scientific' && this.currentData.length > 0) {
            this.scientificViz.renderAll(this.currentData);
          }
        }
      });
    });
  }

  private startAutoRefresh(): void {
    // Refresh every 60 seconds
    window.setInterval(() => {
      this.fetchAndRender();
      this.resetCountdown();
    }, 60000);

    // Update countdown every second
    window.setInterval(() => {
      this.secondsUntilRefresh--;
      if (this.secondsUntilRefresh < 0) {
        this.secondsUntilRefresh = 60;
      }
      const countdownEl = document.getElementById('countdown');
      if (countdownEl) {
        countdownEl.textContent = `${this.secondsUntilRefresh}s`;
      }
    }, 1000);
  }

  private resetCountdown(): void {
    this.secondsUntilRefresh = 60;
  }

  private async fetchAndRender(): Promise<void> {
    try {
      this.showLoading();
      this.clearError();

      const encodedStop = encodeURIComponent(this.currentStop);
      const response = await fetch(`${this.apiBaseUrl}${encodedStop}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data: TransitJourney[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No journey data available for this stop');
      }

      // Store current data
      this.currentData = data;

      this.updateStatistics(data);
      this.renderRaceTrack(data);

      // If scientific tab is active, render those visualizations too
      const scientificTab = document.getElementById('scientific-tab');
      if (scientificTab && scientificTab.classList.contains('active')) {
        this.scientificViz.renderAll(data);
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private showLoading(): void {
    const raceTrack = document.getElementById('race-track');
    if (raceTrack) {
      raceTrack.innerHTML = '<div class="loading">Loading race track...</div>';
    }
  }

  private showError(message: string): void {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `<div class="error">⚠️ ${message}</div>`;
    }
  }

  private clearError(): void {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = '';
    }
  }

  private updateStatistics(data: TransitJourney[]): void {
    const stats = this.calculateStatistics(data);

    document.getElementById('total-journeys')!.textContent = stats.totalJourneys.toString();

    const avgDelayEl = document.getElementById('avg-delay')!;
    avgDelayEl.textContent = this.formatDelay(stats.avgDelay);
    avgDelayEl.style.color = this.getDelayColor(stats.avgDelay);

    const worstDelayEl = document.getElementById('worst-delay')!;
    worstDelayEl.textContent = this.formatDelay(stats.worstDelay);
    worstDelayEl.style.color = this.getDelayColor(stats.worstDelay);

    const chaosScoreEl = document.getElementById('chaos-score')!;
    chaosScoreEl.textContent = `${stats.chaosScore}/100`;
    chaosScoreEl.style.color = this.getDelayColor(stats.chaosScore * 10);
  }

  private calculateStatistics(data: TransitJourney[]): Statistics {
    const totalJourneys = data.length;
    const totalDelay = data.reduce((sum, j) => sum + j.recorded_delay_seconds, 0);
    const avgDelay = totalDelay / totalJourneys;
    const worstDelay = Math.max(...data.map(j => j.recorded_delay_seconds));

    // Chaos score: combination of average delay and variance
    const variance = data.reduce((sum, j) =>
      sum + Math.pow(j.recorded_delay_seconds - avgDelay, 2), 0) / totalJourneys;
    const chaosScore = Math.min(100, Math.round((Math.abs(avgDelay) / 60) + (Math.sqrt(variance) / 100)));

    const worstJourney = data.find(j => j.recorded_delay_seconds === worstDelay);
    const worstLine = worstJourney?.line_ref || 'N/A';

    return { totalJourneys, avgDelay, worstDelay, chaosScore, worstLine };
  }

  private formatDelay(seconds: number): string {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.round(absSeconds % 60);

    if (seconds < -30) {
      return `⚡ -${minutes}m ${secs}s`;
    } else if (seconds > 30) {
      return `🐌 +${minutes}m ${secs}s`;
    } else {
      return `✓ ${minutes}m ${secs}s`;
    }
  }

  private getDelayColor(seconds: number): string {
    if (seconds < -60) return '#4caf50'; // Early - green
    if (seconds < 60) return '#2196f3'; // On time - blue
    if (seconds < 300) return '#ff9800'; // Slightly delayed - orange
    if (seconds < 600) return '#ff5722'; // Delayed - deep orange
    return '#f44336'; // Very delayed - red
  }

  private getRunnerEmoji(delay: number): string {
    if (delay < -60) return '🏃‍♂️💨'; // Running fast (early)
    if (delay < 60) return '🚶‍♂️'; // Walking (on time)
    if (delay < 300) return '🚶‍♂️💤'; // Walking slowly
    if (delay < 600) return '🐌'; // Snail pace
    return '🦥'; // Sloth (very delayed)
  }

  private getMotivationalMessage(delay: number): string {
    if (delay < -60) return 'Time Traveler!';
    if (delay < 30) return 'Perfect timing!';
    if (delay < 120) return 'Fashionably late';
    if (delay < 300) return 'Having a coffee break?';
    if (delay < 600) return 'Taking the scenic route';
    return 'Is it even moving?';
  }

  private renderRaceTrack(data: TransitJourney[]): void {
    const container = document.getElementById('race-track')!;
    container.innerHTML = '';

    // Sort by delay (worst first for dramatic effect)
    const sortedData = [...data].sort((a, b) => b.recorded_delay_seconds - a.recorded_delay_seconds);

    const margin = { top: 40, right: 150, bottom: 40, left: 200 };
    const width = Math.max(1200, container.clientWidth) - margin.left - margin.right;
    const height = Math.max(500, sortedData.length * 60) - margin.top - margin.bottom;
    const trackHeight = 40;
    const trackSpacing = 60;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate time range for x-axis
    const maxDelay = Math.max(...sortedData.map(j => Math.abs(j.recorded_delay_seconds)));
    const timeRange = Math.max(600, maxDelay + 60); // At least 10 minutes range

    const xScale = d3.scaleLinear()
      .domain([-timeRange, timeRange])
      .range([0, width]);

    // Draw finish line (on-time position)
    const finishLineX = xScale(0);
    svg.append('line')
      .attr('x1', finishLineX)
      .attr('x2', finishLineX)
      .attr('y1', -10)
      .attr('y2', height + 10)
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    svg.append('text')
      .attr('x', finishLineX)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4caf50')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text('🏁 FINISH LINE (On Time)');

    // Draw each journey as a race track lane
    sortedData.forEach((journey, index) => {
      const yPosition = index * trackSpacing;
      const delay = journey.recorded_delay_seconds;
      const lineShortName = journey.line_ref.split(':').pop() || journey.line_ref;

      // Track background
      svg.append('rect')
        .attr('x', 0)
        .attr('y', yPosition)
        .attr('width', width)
        .attr('height', trackHeight)
        .attr('fill', index % 2 === 0 ? '#f5f5f5' : '#fafafa')
        .attr('stroke', '#ddd')
        .attr('rx', 5);

      // Lane label (line name)
      svg.append('text')
        .attr('x', -10)
        .attr('y', yPosition + trackHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('class', 'runner-label')
        .attr('font-size', '14px')
        .text(`${lineShortName}`);

      // Next stop label
      svg.append('text')
        .attr('x', -10)
        .attr('y', yPosition + trackHeight / 2 + 15)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#999')
        .text(`→ ${journey.next_stop_name}`);

      // Ideal position (ghost runner)
      const idealX = finishLineX;
      svg.append('text')
        .attr('x', idealX)
        .attr('y', yPosition + trackHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '24px')
        .attr('opacity', 0.3)
        .text('👻');

      // Actual position (runner)
      const actualX = xScale(delay);
      const runner = svg.append('g')
        .attr('transform', `translate(${actualX},${yPosition + trackHeight / 2})`);

      runner.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '28px')
        .text(this.getRunnerEmoji(delay))
        .transition()
        .duration(1000)
        .attr('transform', 'scale(1.2)')
        .transition()
        .duration(1000)
        .attr('transform', 'scale(1)');

      // Connection line between ideal and actual
      if (Math.abs(delay) > 10) {
        svg.append('line')
          .attr('x1', idealX)
          .attr('x2', actualX)
          .attr('y1', yPosition + trackHeight / 2)
          .attr('y2', yPosition + trackHeight / 2)
          .attr('stroke', this.getDelayColor(delay))
          .attr('stroke-width', 2)
          .attr('opacity', 0.5)
          .attr('stroke-dasharray', '3,3');
      }

      // Delay label
      svg.append('text')
        .attr('x', width + 10)
        .attr('y', yPosition + trackHeight / 2 - 5)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', this.getDelayColor(delay))
        .text(this.formatDelay(delay));

      // Motivational message
      svg.append('text')
        .attr('x', width + 10)
        .attr('y', yPosition + trackHeight / 2 + 10)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('font-style', 'italic')
        .text(this.getMotivationalMessage(delay));
    });

    // X-axis (time scale)
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d) => {
        const numValue = Number(d);
        const minutes = Math.abs(numValue) / 60;
        return numValue < 0 ? `-${minutes.toFixed(0)}m` : `+${minutes.toFixed(0)}m`;
      })
      .ticks(10);

    svg.append('g')
      .attr('transform', `translate(0,${height + 20})`)
      .call(xAxis)
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('← Early | Delay →');
  }
}

// Initialize the app
new TransitRaceTrack();
