import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { EventService } from '../../services/event.service';
import { CalendarEvent, TimeSlot, EventPosition, OverlapInfo } from '../../models/event.model';

@Component({
  selector: 'app-calendar-day-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-day-view.component.html',
  styleUrls: ['./calendar-day-view.component.css']
})
export class CalendarDayViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  events: CalendarEvent[] = [];
  timeSlots: TimeSlot[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedExecutionTime: string = '11:00';
  executionDuration: number = 60; // minutes

  // Scheduling state
  isScheduling = false;
  newEvent: Partial<CalendarEvent> = {};
  schedulingStartTime: string = '';
  schedulingEndTime: string = '';
  currentOverlap: OverlapInfo = { hasOverlap: false, overlappingEvents: [] };

  // Constants for positioning - matches vanilla JS exactly
  readonly START_HOUR = 9;   // 9 AM
  readonly END_HOUR = 20;    // 8 PM
  readonly TOTAL_SLOTS = 12; // 12 time slot columns

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.generateTimeSlots();
    this.loadEvents();
    this.updateExecutionTime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateTimeSlots(): void {
    this.timeSlots = [];
    // Generate 12 slots from 9:00 to 20:00
    for (let hour = this.START_HOUR; hour < this.START_HOUR + this.TOTAL_SLOTS; hour++) {
      this.timeSlots.push({
        hour: hour,
        label: this.formatHour(hour)
      });
    }
  }

  private formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  private loadEvents(): void {
    this.eventService.getEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.events = events;
      });
  }

  getExistingEvents(): CalendarEvent[] {
    return this.events.filter(event => 
      event.type === 'existing' && event.date === this.selectedDate
    );
  }

  getNewEvents(): CalendarEvent[] {
    return this.events.filter(event => 
      event.type === 'new' && event.date === this.selectedDate
    );
  }

  calculateEventPosition(event: CalendarEvent): EventPosition {
    const startMinutes = this.timeToMinutes(event.startTime);
    const endMinutes = this.timeToMinutes(event.endTime);
    
    const gridStartMinutes = this.START_HOUR * 60; // 9:00 AM (540 minutes)
    
    // Calculate which slot the start and end times fall into
    const relativeStartMinutes = startMinutes - gridStartMinutes;
    const relativeEndMinutes = endMinutes - gridStartMinutes;
    
    // Convert to slot positions (each slot = 60 minutes)
    const startSlotPosition = relativeStartMinutes / 60; // Position in hours from 9:00
    const endSlotPosition = relativeEndMinutes / 60; // Position in hours from 9:00
    
    // Calculate percentage positions
    const leftPercent = (startSlotPosition / this.TOTAL_SLOTS) * 100;
    const widthPercent = ((endSlotPosition - startSlotPosition) / this.TOTAL_SLOTS) * 100;
    
    // Ensure bounds are within the grid
    const finalLeft = Math.max(0, Math.min(leftPercent, 100));
    const finalWidth = Math.max(0, Math.min(widthPercent, 100 - finalLeft));
    
    console.log(`Positioning ${event.startTime}-${event.endTime}: left=${finalLeft.toFixed(2)}%, width=${finalWidth.toFixed(2)}%`);
    
    return {
      left: finalLeft,
      width: finalWidth,
      top: 0,
      height: 100
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
    this.isScheduling = true;
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    this.schedulingStartTime = startTime;
    this.schedulingEndTime = this.minutesToTime(this.timeToMinutes(startTime) + 60);
    this.checkCurrentOverlap();
  }

  onSchedulingMouseMove(event: MouseEvent, hour: number): void {
    if (!this.isScheduling) return;
    
    // Calculate mouse position relative to the row
    const rect = (event.target as HTMLElement).closest('.event-row')?.getBoundingClientRect();
    if (!rect) return;
    
    const relativeX = event.clientX - rect.left;
    const slotWidth = rect.width / this.TOTAL_SLOTS;
    const slotIndex = Math.floor(relativeX / slotWidth);
    const targetHour = this.START_HOUR + slotIndex;
    
    if (targetHour >= this.START_HOUR && targetHour < this.START_HOUR + this.TOTAL_SLOTS) {
      const endTime = `${targetHour.toString().padStart(2, '0')}:00`;
      if (this.timeToMinutes(endTime) > this.timeToMinutes(this.schedulingStartTime)) {
        this.schedulingEndTime = endTime;
        this.checkCurrentOverlap();
      }
    }
  }

  private checkCurrentOverlap(): void {
    if (!this.schedulingStartTime || !this.schedulingEndTime) {
      this.currentOverlap = { hasOverlap: false, overlappingEvents: [] };
      return;
    }

    console.log(`Checking conflict for: ${this.schedulingStartTime} to ${this.schedulingEndTime}`);
    
    const newStartMinutes = this.timeToMinutes(this.schedulingStartTime);
    const newEndMinutes = this.timeToMinutes(this.schedulingEndTime);
    
    const overlappingEvents: CalendarEvent[] = [];
    
    for (const event of this.getExistingEvents()) {
      console.log(`Existing event: ${event.startTime} to ${event.endTime}`);
      
      const existingStartMinutes = this.timeToMinutes(event.startTime);
      const existingEndMinutes = this.timeToMinutes(event.endTime);
      
      console.log(`New event minutes: ${newStartMinutes} to ${newEndMinutes}`);
      console.log(`Existing event minutes: ${existingStartMinutes} to ${existingEndMinutes}`);
      
      // Check for overlap: events overlap if new start < existing end AND new end > existing start
      const hasOverlap = newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes;
      console.log(`Overlap check: ${newStartMinutes} < ${existingEndMinutes} && ${newEndMinutes} > ${existingStartMinutes} = ${hasOverlap}`);
      
      if (hasOverlap) {
        console.log('Conflict detected with:', event);
        overlappingEvents.push(event);
      }
    }
    
    if (overlappingEvents.length === 0) {
      console.log('No conflicts detected');
    }
    
    this.currentOverlap = {
      hasOverlap: overlappingEvents.length > 0,
      overlappingEvents: overlappingEvents
    };
  }

  confirmScheduling(): void {
    if (!this.isScheduling || this.currentOverlap.hasOverlap) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: 'New Event',
      startTime: this.schedulingStartTime,
      endTime: this.schedulingEndTime,
      date: this.selectedDate,
      type: 'new',
      color: '#4CAF50'
    };

    this.eventService.addEvent(newEvent);
    this.cancelScheduling();
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

    return this.calculateEventPosition({
      id: 'temp',
      title: 'Scheduling',
      startTime: this.schedulingStartTime,
      endTime: this.schedulingEndTime,
      date: this.selectedDate,
      type: 'new'
    });
  }

  formatTime(time: string): string {
    return time;
  }

  updateExecutionTime(): void {
    // Calculate execution end time
    const startMinutes = this.timeToMinutes(this.selectedExecutionTime);
    const endMinutes = startMinutes + this.executionDuration;
    const endTime = this.minutesToTime(endMinutes);
    
    // Update scheduling times to match execution time
    this.schedulingStartTime = this.selectedExecutionTime;
    this.schedulingEndTime = endTime;
    this.checkCurrentOverlap();
  }

  onExecutionTimeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedExecutionTime = target.value;
    this.updateExecutionTime();
  }

  getConflictMessage(): string {
    if (!this.currentOverlap.hasOverlap || this.currentOverlap.overlappingEvents.length === 0) {
      return '';
    }
    
    const event = this.currentOverlap.overlappingEvents[0];
    return `This time conflicts with an existing event from ${event.startTime} to ${event.endTime}.`;
  }

  getEventStyle(event: CalendarEvent): any {
    const position = this.calculateEventPosition(event);
    return {
      left: position.left + '%',
      width: position.width + '%',
      backgroundColor: event.color || '#2196F3'
    };
  }

  getSchedulingStyle(): any {
    const position = this.getSchedulingEventPosition();
    if (!position) return {};

    return {
      left: position.left + '%',
      width: position.width + '%',
      backgroundColor: this.currentOverlap.hasOverlap ? '#f44336' : '#4CAF50'
    };
  }
}