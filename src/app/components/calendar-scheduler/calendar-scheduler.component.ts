import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CalendarSchedulerService, CalendarEvent, ConflictInfo } from '../../services/calendar-scheduler.service';

@Component({
  selector: 'app-calendar-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-scheduler.component.html',
  styleUrls: ['./calendar-scheduler.component.scss']
})
export class CalendarSchedulerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  events: CalendarEvent[] = [];
  selectedExecutionTime: string = '11:00';
  conflict: ConflictInfo = { hasConflict: false };
  timeSlots: { hour: number; label: string }[] = [];
  availableTimeSlots: string[] = [];

  constructor(private calendarService: CalendarSchedulerService) {}

  ngOnInit(): void {
    this.timeSlots = this.calendarService.getTimeSlotHeaders();
    this.availableTimeSlots = this.calendarService.getAvailableTimeSlots();

    // Subscribe to events
    this.calendarService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.events = events;
      });

    // Subscribe to selected execution time
    this.calendarService.selectedExecutionTime$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => {
        this.selectedExecutionTime = time;
      });

    // Subscribe to conflict information
    this.calendarService.conflict$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conflict => {
        this.conflict = conflict;
      });

    // Initial conflict check
    this.calendarService.checkForConflicts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getExistingEvents(): CalendarEvent[] {
    return this.events.filter(event => event.type === 'booked');
  }

  getNewEvents(): CalendarEvent[] {
    const newEvent = this.calendarService.getNewEventPreview();
    return newEvent ? [newEvent] : [];
  }

  getEventStyle(event: CalendarEvent): any {
    const position = this.calendarService.getTimePosition(event.startTime, event.endTime);
    return {
      left: position.left,
      width: position.width,
      position: 'absolute',
      top: '0',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '500',
      color: 'white',
      borderRadius: '4px',
      backgroundColor: event.type === 'booked' ? '#e74c3c' : '#27ae60',
      zIndex: 10
    };
  }

  onExecutionTimeChange(): void {
    this.calendarService.updateExecutionTime(this.selectedExecutionTime);
  }

  confirmExecution(): void {
    if (!this.conflict.hasConflict) {
      this.calendarService.confirmExecution();
    }
  }

  cancelExecution(): void {
    // Reset to default time
    this.selectedExecutionTime = '11:00';
    this.calendarService.updateExecutionTime(this.selectedExecutionTime);
  }
}