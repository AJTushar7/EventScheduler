import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CalendarEvent, TimeSlot, EventPosition, OverlapInfo } from '../../models/event.model';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-calendar-day-view',
  templateUrl: './calendar-day-view.component.html',
  styleUrls: ['./calendar-day-view.component.css']
})
export class CalendarDayViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  events: CalendarEvent[] = [];
  timeSlots: TimeSlot[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  
  // New event scheduling
  isScheduling = false;
  newEvent: Partial<CalendarEvent> = {};
  schedulingStartTime: string = '';
  schedulingEndTime: string = '';
  currentOverlap: OverlapInfo = { hasOverlap: false, overlappingEvents: [] };
  
  // Time grid configuration
  readonly HOUR_HEIGHT = 60; // pixels per hour
  readonly START_HOUR = 9;   // 9 AM
  readonly END_HOUR = 18;    // 6 PM
  readonly PIXEL_PER_MINUTE = this.HOUR_HEIGHT / 60;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.generateTimeSlots();
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = this.START_HOUR; hour <= this.END_HOUR; hour++) {
      this.timeSlots.push({
        hour,
        label: this.formatHour(hour)
      });
    }
  }

  private formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  private loadEvents(): void {
    this.eventService.getEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.events = events.filter(event => event.date === this.selectedDate);
      });
  }

  getExistingEvents(): CalendarEvent[] {
    return this.events.filter(event => event.type === 'existing');
  }

  getNewEvents(): CalendarEvent[] {
    return this.events.filter(event => event.type === 'new');
  }

  calculateEventPosition(event: CalendarEvent): EventPosition {
    const startMinutes = this.timeToMinutes(event.startTime);
    const endMinutes = this.timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

    // Calculate position relative to start hour
    const startOffset = startMinutes - (this.START_HOUR * 60);
    
    return {
      left: 0,
      width: 100, // Full width of the column
      top: startOffset * this.PIXEL_PER_MINUTE,
      height: duration * this.PIXEL_PER_MINUTE
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  onTimeSlotClick(event: MouseEvent, hour: number): void {
    if (!this.isScheduling) {
      this.startScheduling(event, hour);
    }
  }

  private startScheduling(event: MouseEvent, hour: number): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const minutes = Math.round(clickY / this.PIXEL_PER_MINUTE);
    const totalMinutes = (hour * 60) + minutes;
    
    this.schedulingStartTime = this.minutesToTime(totalMinutes);
    this.schedulingEndTime = this.minutesToTime(totalMinutes + 60); // Default 1 hour duration
    
    this.isScheduling = true;
    this.checkCurrentOverlap();
  }

  onSchedulingMouseMove(event: MouseEvent, hour: number): void {
    if (!this.isScheduling) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const minutes = Math.round(clickY / this.PIXEL_PER_MINUTE);
    const totalMinutes = (hour * 60) + minutes;
    const endTime = this.minutesToTime(totalMinutes);

    // Only update if it's after start time
    if (totalMinutes > this.timeToMinutes(this.schedulingStartTime)) {
      this.schedulingEndTime = endTime;
      this.checkCurrentOverlap();
    }
  }

  private checkCurrentOverlap(): void {
    if (this.schedulingStartTime && this.schedulingEndTime) {
      this.currentOverlap = this.eventService.checkOverlap({
        startTime: this.schedulingStartTime,
        endTime: this.schedulingEndTime,
        date: this.selectedDate
      });
    }
  }

  confirmScheduling(): void {
    if (this.schedulingStartTime && this.schedulingEndTime) {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: 'New Event',
        startTime: this.schedulingStartTime,
        endTime: this.schedulingEndTime,
        date: this.selectedDate,
        type: 'new',
        color: this.currentOverlap.hasOverlap ? '#f44336' : '#4CAF50'
      };

      this.eventService.addEvent(newEvent);
      this.cancelScheduling();
    }
  }

  cancelScheduling(): void {
    this.isScheduling = false;
    this.schedulingStartTime = '';
    this.schedulingEndTime = '';
    this.currentOverlap = { hasOverlap: false, overlappingEvents: [] };
  }

  getSchedulingEventPosition(): EventPosition | null {
    if (!this.isScheduling || !this.schedulingStartTime || !this.schedulingEndTime) {
      return null;
    }

    const startMinutes = this.timeToMinutes(this.schedulingStartTime);
    const endMinutes = this.timeToMinutes(this.schedulingEndTime);
    const duration = endMinutes - startMinutes;
    const startOffset = startMinutes - (this.START_HOUR * 60);

    return {
      left: 0,
      width: 100,
      top: startOffset * this.PIXEL_PER_MINUTE,
      height: duration * this.PIXEL_PER_MINUTE
    };
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  getEventStyle(event: CalendarEvent): any {
    const position = this.calculateEventPosition(event);
    return {
      'top.px': position.top,
      'height.px': position.height,
      'background-color': event.color,
      'border-left': event.type === 'new' && this.currentOverlap.hasOverlap ? '3px solid #f44336' : 'none'
    };
  }

  getSchedulingStyle(): any {
    const position = this.getSchedulingEventPosition();
    if (!position) return {};

    return {
      'top.px': position.top,
      'height.px': position.height,
      'background-color': this.currentOverlap.hasOverlap ? 'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)',
      'border': this.currentOverlap.hasOverlap ? '2px solid #f44336' : '2px solid #4CAF50'
    };
  }
}
