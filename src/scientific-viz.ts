import * as d3 from 'd3';

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

export class ScientificVisualizations {

  renderAll(data: TransitJourney[]): void {
    this.renderHistogram(data);
    this.renderBoxPlot(data);
    this.renderTimeline(data);
    this.renderScatterPlot(data);
    this.renderCumulativeDistribution(data);
  }

  private renderHistogram(data: TransitJourney[]): void {
    const container = document.getElementById('histogram-chart')!;
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create bins for delays (in minutes)
    const delays = data.map(d => d.recorded_delay_seconds / 60);
    const bins = d3.bin()
      .domain([Math.min(-5, d3.min(delays)!), Math.max(20, d3.max(delays)!)])
      .thresholds(20)(delays);

    const xScale = d3.scaleLinear()
      .domain([bins[0].x0!, bins[bins.length - 1].x1!])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)!])
      .range([height, 0]);

    // Draw bars
    svg.selectAll('rect')
      .data(bins)
      .join('rect')
      .attr('x', d => xScale(d.x0!))
      .attr('y', d => yScale(d.length))
      .attr('width', d => Math.max(0, xScale(d.x1!) - xScale(d.x0!) - 1))
      .attr('height', d => height - yScale(d.length))
      .attr('fill', d => {
        const midpoint = (d.x0! + d.x1!) / 2;
        if (midpoint < -1) return '#4caf50';
        if (midpoint < 1) return '#2196f3';
        if (midpoint < 5) return '#ff9800';
        return '#f44336';
      })
      .attr('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
      });

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}m`))
      .attr('class', 'axis');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Delay (minutes)');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale))
      .attr('class', 'axis');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Frequency');

    // Add mean line
    const mean = d3.mean(delays)!;
    svg.append('line')
      .attr('x1', xScale(mean))
      .attr('x2', xScale(mean))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#667eea')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    svg.append('text')
      .attr('x', xScale(mean))
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#667eea')
      .text(`μ = ${mean.toFixed(1)}m`);
  }

  private renderBoxPlot(data: TransitJourney[]): void {
    const container = document.getElementById('boxplot-chart')!;
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group data by line
    const lineGroups = d3.group(data, d => d.line_ref.split(':').pop() || d.line_ref);
    const lineData = Array.from(lineGroups, ([line, journeys]) => ({
      line,
      delays: journeys.map(j => j.recorded_delay_seconds / 60).sort(d3.ascending)
    }));

    // Calculate box plot statistics
    const boxData = lineData.map(d => {
      const q1 = d3.quantile(d.delays, 0.25)!;
      const median = d3.quantile(d.delays, 0.5)!;
      const q3 = d3.quantile(d.delays, 0.75)!;
      const iqr = q3 - q1;
      const min = Math.max(d3.min(d.delays)!, q1 - 1.5 * iqr);
      const max = Math.min(d3.max(d.delays)!, q3 + 1.5 * iqr);
      return { line: d.line, min, q1, median, q3, max };
    });

    const xScale = d3.scaleBand()
      .domain(boxData.map(d => d.line))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([
        Math.min(-5, d3.min(boxData, d => d.min)!),
        Math.max(15, d3.max(boxData, d => d.max)!)
      ])
      .range([height, 0]);

    // Draw box plots
    boxData.forEach(d => {
      const x = xScale(d.line)!;
      const boxWidth = xScale.bandwidth();

      // Vertical line (min to max)
      svg.append('line')
        .attr('x1', x + boxWidth / 2)
        .attr('x2', x + boxWidth / 2)
        .attr('y1', yScale(d.min))
        .attr('y2', yScale(d.max))
        .attr('stroke', '#999')
        .attr('stroke-width', 1);

      // Box (Q1 to Q3)
      svg.append('rect')
        .attr('x', x)
        .attr('y', yScale(d.q3))
        .attr('width', boxWidth)
        .attr('height', yScale(d.q1) - yScale(d.q3))
        .attr('fill', d.median > 2 ? '#ff9800' : '#2196f3')
        .attr('opacity', 0.7)
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

      // Median line
      svg.append('line')
        .attr('x1', x)
        .attr('x2', x + boxWidth)
        .attr('y1', yScale(d.median))
        .attr('y2', yScale(d.median))
        .attr('stroke', '#333')
        .attr('stroke-width', 2);

      // Min and max caps
      [d.min, d.max].forEach(val => {
        svg.append('line')
          .attr('x1', x + boxWidth * 0.25)
          .attr('x2', x + boxWidth * 0.75)
          .attr('y1', yScale(val))
          .attr('y2', yScale(val))
          .attr('stroke', '#999')
          .attr('stroke-width', 1);
      });
    });

    // Zero line
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('class', 'axis');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 70)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Transit Line');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}m`))
      .attr('class', 'axis');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Delay (minutes)');
  }

  private renderTimeline(data: TransitJourney[]): void {
    const container = document.getElementById('timeline-chart')!;
    container.innerHTML = '';

    const margin = { top: 20, right: 80, bottom: 50, left: 150 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sort by aimed time
    const sortedData = [...data].sort((a, b) =>
      new Date(a.aimed_last_stop_time).getTime() - new Date(b.aimed_last_stop_time).getTime()
    ).slice(0, 10); // Show only first 10 for clarity

    const yScale = d3.scaleBand()
      .domain(sortedData.map((d, i) => `${d.line_ref.split(':').pop()} #${i + 1}`))
      .range([0, height])
      .padding(0.3);

    const times = [
      ...sortedData.map(d => new Date(d.aimed_last_stop_time)),
      ...sortedData.map(d => new Date(d.actual_last_stop_time))
    ];

    const xScale = d3.scaleTime()
      .domain([d3.min(times)!, d3.max(times)!])
      .range([0, width]);

    // Draw connecting lines
    sortedData.forEach((d, i) => {
      const y = yScale(`${d.line_ref.split(':').pop()} #${i + 1}`)! + yScale.bandwidth() / 2;
      const aimedX = xScale(new Date(d.aimed_last_stop_time));
      const actualX = xScale(new Date(d.actual_last_stop_time));

      svg.append('line')
        .attr('x1', aimedX)
        .attr('x2', actualX)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', d.recorded_delay_seconds > 60 ? '#ff9800' : '#2196f3')
        .attr('stroke-width', 2)
        .attr('opacity', 0.5);

      // Aimed time marker
      svg.append('circle')
        .attr('cx', aimedX)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#4caf50')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Actual time marker
      svg.append('circle')
        .attr('cx', actualX)
        .attr('cy', y)
        .attr('r', 5)
        .attr('fill', d.recorded_delay_seconds > 60 ? '#ff9800' : '#2196f3')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    });

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => d3.timeFormat('%H:%M')(d as Date)))
      .attr('class', 'axis');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Time of Day');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale))
      .attr('class', 'axis');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 10}, 0)`);

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', '#4caf50');
    legend.append('text')
      .attr('x', 10)
      .attr('y', 4)
      .attr('font-size', '11px')
      .text('Scheduled');

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .attr('fill', '#2196f3');
    legend.append('text')
      .attr('x', 10)
      .attr('y', 24)
      .attr('font-size', '11px')
      .text('Actual');
  }

  private renderScatterPlot(data: TransitJourney[]): void {
    const container = document.getElementById('scatter-chart')!;
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const times = data.map(d => new Date(d.aimed_last_stop_time).getTime());
    const xScale = d3.scaleTime()
      .domain([new Date(d3.min(times)!), new Date(d3.max(times)!)])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([
        Math.min(-5, d3.min(data, d => d.recorded_delay_seconds / 60)!),
        Math.max(15, d3.max(data, d => d.recorded_delay_seconds / 60)!)
      ])
      .range([height, 0]);

    // Draw points
    svg.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => xScale(new Date(d.aimed_last_stop_time)))
      .attr('cy', d => yScale(d.recorded_delay_seconds / 60))
      .attr('r', 5)
      .attr('fill', d => {
        if (d.recorded_delay_seconds < -60) return '#4caf50';
        if (d.recorded_delay_seconds < 60) return '#2196f3';
        if (d.recorded_delay_seconds < 300) return '#ff9800';
        return '#f44336';
      })
      .attr('opacity', 0.6)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .on('mouseover', function() {
        d3.select(this).attr('r', 8).attr('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 5).attr('opacity', 0.6);
      });

    // Zero line
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => d3.timeFormat('%H:%M')(d as Date)))
      .attr('class', 'axis');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Scheduled Time');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}m`))
      .attr('class', 'axis');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Delay (minutes)');
  }

  private renderCumulativeDistribution(data: TransitJourney[]): void {
    const container = document.getElementById('cumulative-chart')!;
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sort delays and calculate cumulative percentage
    const sortedDelays = data.map(d => d.recorded_delay_seconds / 60).sort(d3.ascending);
    const cumulativeData = sortedDelays.map((delay, i) => ({
      delay,
      percentage: ((i + 1) / sortedDelays.length) * 100
    }));

    const xScale = d3.scaleLinear()
      .domain([
        Math.min(-5, d3.min(sortedDelays)!),
        Math.max(20, d3.max(sortedDelays)!)
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Draw line
    const line = d3.line<{ delay: number; percentage: number }>()
      .x(d => xScale(d.delay))
      .y(d => yScale(d.percentage))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(cumulativeData)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add reference lines for key percentiles
    const percentiles = [50, 90, 95];
    percentiles.forEach(p => {
      const delay = d3.quantile(sortedDelays, p / 100)!;

      // Horizontal line
      svg.append('line')
        .attr('x1', 0)
        .attr('x2', xScale(delay))
        .attr('y1', yScale(p))
        .attr('y2', yScale(p))
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);

      // Vertical line
      svg.append('line')
        .attr('x1', xScale(delay))
        .attr('x2', xScale(delay))
        .attr('y1', yScale(p))
        .attr('y2', height)
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);

      // Label
      svg.append('text')
        .attr('x', xScale(delay) + 5)
        .attr('y', yScale(p) - 5)
        .attr('font-size', '10px')
        .attr('fill', '#667eea')
        .text(`P${p}: ${delay.toFixed(1)}m`);
    });

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}m`))
      .attr('class', 'axis');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Delay (minutes)');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .attr('class', 'axis');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Cumulative Percentage');
  }
}
