import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarSchedulerComponent } from './components/calendar-scheduler/calendar-scheduler.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CalendarSchedulerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Calendar Event Scheduler';
}
