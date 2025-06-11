import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarDayViewComponent } from './components/calendar-day-view/calendar-day-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CalendarDayViewComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Calendar Day View';
}
