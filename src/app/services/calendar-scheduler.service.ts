import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CalendarEvent {
  id: string;
  startTime: string;
  endTime: string;
  type: 'booked' | 'new';
}

export interface EventPosition {
  left: string;
  width: string;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvent?: CalendarEvent;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarSchedulerService {
  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  private selectedExecutionTimeSubject = new BehaviorSubject<string>('11:00');
  private conflictSubject = new BehaviorSubject<ConflictInfo>({ hasConflict: false });

  public events$ = this.eventsSubject.asObservable();
  public selectedExecutionTime$ = this.selectedExecutionTimeSubject.asObservable();
  public conflict$ = this.conflictSubject.asObservable();

  private executionDuration = 60; // minutes (1 hour)

  constructor() {
    this.loadExistingEvents();
  }

  private loadExistingEvents(): void {
    const events: CalendarEvent[] = [
      {
        id: '1',
        startTime: '11:33',
        endTime: '12:33',
        type: 'booked'
      },
      {
        id: '2', 
        startTime: '14:07',
        endTime: '15:07',
        type: 'booked'
      },
      {
        id: '3',
        startTime: '18:30',
        endTime: '19:30',
        type: 'booked'
      }
    ];
    this.eventsSubject.next(events);
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  getTimePosition(startTime: string, endTime: string): EventPosition {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    const gridStartMinutes = 9 * 60; // 9:00 AM (540 minutes)
    const totalSlots = 12; // We have 12 time slot columns
    
    // Calculate which slot the start and end times fall into
    const relativeStartMinutes = startMinutes - gridStartMinutes;
    const relativeEndMinutes = endMinutes - gridStartMinutes;
    
    // Convert to slot positions (each slot = 60 minutes)
    const startSlotPosition = relativeStartMinutes / 60; // Position in hours from 9:00
    const endSlotPosition = relativeEndMinutes / 60; // Position in hours from 9:00
    
    // Calculate percentage positions
    const leftPercent = (startSlotPosition / totalSlots) * 100;
    const widthPercent = ((endSlotPosition - startSlotPosition) / totalSlots) * 100;
    
    // Ensure bounds are within the grid
    const finalLeft = Math.max(0, Math.min(leftPercent, 100));
    const finalWidth = Math.max(0, Math.min(widthPercent, 100 - finalLeft));
    
    console.log(`Positioning ${startTime}-${endTime}: left=${finalLeft.toFixed(2)}%, width=${finalWidth.toFixed(2)}%`);
    
    return {
      left: `${finalLeft.toFixed(2)}%`,
      width: `${finalWidth.toFixed(2)}%`
    };
  }

  checkForConflicts(executionTime?: string): void {
    const selectedTime = executionTime || this.selectedExecutionTimeSubject.value;
    const selectedMinutes = this.timeToMinutes(selectedTime);
    const endMinutes = selectedMinutes + this.executionDuration;
    const endTime = this.minutesToTime(endMinutes);
    
    console.log(`Checking conflict for: ${selectedTime} to ${endTime}`);
    
    const events = this.eventsSubject.value;
    let conflictInfo: ConflictInfo = { hasConflict: false };
    
    for (const event of events) {
      if (event.type === 'booked') {
        console.log(`Existing event: ${event.startTime} to ${event.endTime}`);
        
        const eventStartMinutes = this.timeToMinutes(event.startTime);
        const eventEndMinutes = this.timeToMinutes(event.endTime);
        
        console.log(`New event minutes: ${selectedMinutes} to ${endMinutes}`);
        console.log(`Existing event minutes: ${eventStartMinutes} to ${eventEndMinutes}`);
        
        const hasOverlap = selectedMinutes < eventEndMinutes && endMinutes > eventStartMinutes;
        console.log(`Overlap check: ${selectedMinutes} < ${eventEndMinutes} && ${endMinutes} > ${eventStartMinutes} = ${hasOverlap}`);
        
        if (hasOverlap) {
          console.log('Conflict detected with:', event);
          conflictInfo = {
            hasConflict: true,
            conflictingEvent: event,
            message: `Your selected time (${selectedTime} - ${endTime}) conflicts with an existing event (${event.startTime} - ${event.endTime}).`
          };
          break;
        }
      }
    }
    
    this.conflictSubject.next(conflictInfo);
  }

  updateExecutionTime(time: string): void {
    this.selectedExecutionTimeSubject.next(time);
    this.checkForConflicts(time);
  }

  getNewEventPreview(): CalendarEvent | null {
    const selectedTime = this.selectedExecutionTimeSubject.value;
    const selectedMinutes = this.timeToMinutes(selectedTime);
    const endMinutes = selectedMinutes + this.executionDuration;
    const endTime = this.minutesToTime(endMinutes);
    
    return {
      id: 'preview',
      startTime: selectedTime,
      endTime: endTime,
      type: 'new'
    };
  }

  confirmExecution(): void {
    const conflict = this.conflictSubject.value;
    if (!conflict.hasConflict) {
      const newEvent = this.getNewEventPreview();
      if (newEvent) {
        const currentEvents = this.eventsSubject.value;
        const updatedEvents = [...currentEvents, { ...newEvent, id: Date.now().toString() }];
        this.eventsSubject.next(updatedEvents);
        console.log('Event confirmed and added to calendar');
      }
    }
  }

  getAvailableTimeSlots(): string[] {
    return [
      '09:00', '09:15', '09:30', '09:45',
      '10:00', '10:15', '10:30', '10:45',
      '11:00', '11:15', '11:30', '11:33', '11:45',
      '12:00', '12:15', '12:30', '12:33', '12:45', '12:47',
      '13:00', '13:15', '13:30', '13:45',
      '14:00', '14:07', '14:15', '14:30', '14:45',
      '15:00', '15:07', '15:15', '15:30', '15:45',
      '16:00', '16:15', '16:30', '16:45',
      '17:00', '17:15', '17:30', '17:45',
      '18:00', '18:15', '18:30', '18:45',
      '19:00', '19:15', '19:30', '19:45',
      '20:00'
    ];
  }

  getTimeSlotHeaders(): { hour: number; label: string }[] {
    return [
      { hour: 9, label: '9:00' },
      { hour: 10, label: '10:00' },
      { hour: 11, label: '11:00' },
      { hour: 12, label: '12:00' },
      { hour: 13, label: '13:00' },
      { hour: 14, label: '14:00' },
      { hour: 15, label: '15:00' },
      { hour: 16, label: '16:00' },
      { hour: 17, label: '17:00' },
      { hour: 18, label: '18:00' },
      { hour: 19, label: '19:00' },
      { hour: 20, label: '20:00' }
    ];
  }
}