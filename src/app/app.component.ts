import { Component } from '@angular/core';
import { TradutorComponent } from './components/tradutor/tradutor.component';

@Component({
    selector: 'app-root',
    imports: [TradutorComponent],
    template: '<app-tradutor></app-tradutor>'
})
export class AppComponent {
}
