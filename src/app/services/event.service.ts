import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalendarEvent, OverlapInfo } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  constructor() {
    // Initialize with mock data including the provided examples
    this.loadMockEvents();
  }

  private loadMockEvents(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Match the exact vanilla JS events
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Existing Event',
        startTime: '11:33',
        endTime: '12:33',
        date: today,
        type: 'existing',
        color: '#e3f2fd'
      },
      {
        id: '2',
        title: 'Existing Event',
        startTime: '14:07',
        endTime: '15:07',
        date: today,
        type: 'existing',
        color: '#e3f2fd'
      },
      {
        id: '3',
        title: 'Existing Event',
        startTime: '18:30',
        endTime: '19:30',
        date: today,
        type: 'existing',
        color: '#e3f2fd'
      }
    ];

    this.eventsSubject.next(mockEvents);
  }

  getEvents(): Observable<CalendarEvent[]> {
    return this.events$;
  }

  addEvent(event: CalendarEvent): void {
    const currentEvents = this.eventsSubject.value;
    this.eventsSubject.next([...currentEvents, event]);
  }

  checkOverlap(newEvent: { startTime: string; endTime: string; date: string }): OverlapInfo {
    const existingEvents = this.eventsSubject.value.filter(
      event => event.date === newEvent.date && event.type === 'existing'
    );

    const newStart = this.timeToMinutes(newEvent.startTime);
    const newEnd = this.timeToMinutes(newEvent.endTime);

    const overlappingEvents = existingEvents.filter(event => {
      const eventStart = this.timeToMinutes(event.startTime);
      const eventEnd = this.timeToMinutes(event.endTime);

      return (newStart < eventEnd && newEnd > eventStart);
    });

    return {
      hasOverlap: overlappingEvents.length > 0,
      overlappingEvents
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
