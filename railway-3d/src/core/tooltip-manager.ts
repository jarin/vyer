/**
 * Simple tooltip manager for showing station names on hover
 */

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
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.fontFamily = 'Arial, sans-serif';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.whiteSpace = 'nowrap';
    return tooltip;
  }

  show(text: string, x: number, y: number): void {
    this.tooltipElement.textContent = text;
    this.tooltipElement.style.display = 'block';
    this.tooltipElement.style.left = `${x + 10}px`;
    this.tooltipElement.style.top = `${y + 10}px`;
  }

  hide(): void {
    this.tooltipElement.style.display = 'none';
  }

  update(x: number, y: number): void {
    this.tooltipElement.style.left = `${x + 10}px`;
    this.tooltipElement.style.top = `${y + 10}px`;
  }
}
