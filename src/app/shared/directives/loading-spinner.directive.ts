import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
} from '@angular/core';

@Directive({ selector: '[appLoadingSpinner]', standalone: true })
export class LoadingSpinnerDirective implements OnChanges {
  @Input() appLoadingSpinner = false;

  private overlay: HTMLElement | null = null;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnChanges(): void {
    if (this.appLoadingSpinner) {
      this.showOverlay();
    } else {
      this.removeOverlay();
    }
  }

  private showOverlay(): void {
    if (this.overlay) return;

    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');

    this.overlay = this.renderer.createElement('div');
    this.renderer.addClass(this.overlay, 'loading-overlay');

    const spinner = this.renderer.createElement('div');
    this.renderer.addClass(spinner, 'loading-spinner');

    this.renderer.appendChild(this.overlay, spinner);
    this.renderer.appendChild(this.el.nativeElement, this.overlay);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.renderer.removeChild(this.el.nativeElement, this.overlay);
      this.overlay = null;
    }
  }
}
