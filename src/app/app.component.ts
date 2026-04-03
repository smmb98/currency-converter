import { Component } from '@angular/core';
import { ConverterComponent } from './features/converter/converter.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ConverterComponent],
  template: '<app-converter></app-converter>',
})
export class AppComponent {}
