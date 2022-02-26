import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-my-fab-button',
  templateUrl: './my-fab-button.component.html',
  styleUrls: ['./my-fab-button.component.css']
})
export class MyFabButtonComponent {

  @Input() icon=""
  @Input() name=""

  constructor() { }
}
