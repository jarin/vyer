/**
 * Enhanced tooltip manager for showing station information with delay data
 */

import type { StationDelayInfo } from '../delays/delay-types';

export class TooltipManager {
  private tooltipElement: HTMLDivElement;

  constructor() {
    this.tooltipElement = this.createTooltipElement();
    document.body.appendChild(this.tooltipElement);
  }

  private createTooltipElement(): HTMLDivElement {
    const tooltip = document.createElement('div');
    tooltip.id = 'station-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '12px 16px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '13px';
    tooltip.style.fontFamily = 'Arial, sans-serif';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = '300px';
    tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    tooltip.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    return tooltip;
  }

  private formatTime(seconds: number): string {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const sign = seconds < 0 ? '-' : '+';

    if (minutes === 0) {
      return `${sign}${secs}s`;
    }
    return `${sign}${minutes}m ${secs}s`;
  }

  private getDelayColor(category: StationDelayInfo['delayCategory']): string {
    const colors = {
      'on-time': '#00ff00',
      'minor': '#ffff00',
      'moderate': '#ffa500',
      'severe': '#ff4500',
      'chaos': '#ff0000',
    };
    return colors[category];
  }

  private getDelayEmoji(category: StationDelayInfo['delayCategory']): string {
    const emojis = {
      'on-time': '✅',
      'minor': '⏱️',
      'moderate': '😬',
      'severe': '🔥',
      'chaos': '🚨',
    };
    return emojis[category];
  }

  private createDelayBar(avgDelay: number, maxDelay: number): string {
    const maxValue = Math.max(Math.abs(avgDelay), Math.abs(maxDelay), 60); // At least 1 minute scale
    const avgPercent = (Math.abs(avgDelay) / maxValue) * 100;
    const maxPercent = (Math.abs(maxDelay) / maxValue) * 100;

    return `
      <div style="margin-top: 8px;">
        <div style="font-size: 11px; color: #aaa; margin-bottom: 4px;">Delay Distribution</div>
        <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 3px;">
          <div style="background: #ffa500; height: 100%; width: ${avgPercent}%; border-radius: 4px;"></div>
        </div>
        <div style="font-size: 10px; color: #aaa;">Avg: ${this.formatTime(avgDelay)}</div>
        <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 3px;">
          <div style="background: #ff4500; height: 100%; width: ${maxPercent}%; border-radius: 4px;"></div>
        </div>
        <div style="font-size: 10px; color: #aaa;">Max: ${this.formatTime(maxDelay)}</div>
      </div>
    `;
  }

  show(stationName: string, x: number, y: number, delayInfo?: StationDelayInfo): void {
    let content = `<div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${stationName}</div>`;

    if (delayInfo) {
      const emoji = this.getDelayEmoji(delayInfo.delayCategory);
      const color = this.getDelayColor(delayInfo.delayCategory);
      const categoryLabel = delayInfo.delayCategory.charAt(0).toUpperCase() + delayInfo.delayCategory.slice(1);

      content += `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 18px;">${emoji}</span>
            <span style="color: ${color}; font-weight: bold;">${categoryLabel}</span>
          </div>
          <div style="font-size: 12px; color: #ddd; line-height: 1.6;">
            <div><strong>Avg Delay:</strong> ${this.formatTime(delayInfo.avgDelay)}</div>
            <div><strong>Max Delay:</strong> ${this.formatTime(delayInfo.maxDelay)}</div>
            <div><strong>Journeys:</strong> ${delayInfo.journeyCount}</div>
          </div>
          ${this.createDelayBar(delayInfo.avgDelay, delayInfo.maxDelay)}
        </div>
      `;
    } else {
      content += `<div style="font-size: 11px; color: #aaa; margin-top: 4px;">No delay data available</div>`;
    }

    this.tooltipElement.innerHTML = content;
    this.tooltipElement.style.display = 'block';

    // Position tooltip, adjusting if it would go off screen
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    let left = x + 15;
    let top = y + 15;

    if (left + tooltipRect.width > window.innerWidth) {
      left = x - tooltipRect.width - 15;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = y - tooltipRect.height - 15;
    }

    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.top = `${top}px`;
  }

  hide(): void {
    this.tooltipElement.style.display = 'none';
  }

  update(x: number, y: number): void {
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    let left = x + 15;
    let top = y + 15;

    if (left + tooltipRect.width > window.innerWidth) {
      left = x - tooltipRect.width - 15;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = y - tooltipRect.height - 15;
    }

    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.top = `${top}px`;
  }
}
