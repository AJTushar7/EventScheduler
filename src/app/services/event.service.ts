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
    
    const mockEvents: CalendarEvent[] = [
      // Provided mock data
      {
        id: '1',
        title: 'Team Meeting',
        startTime: '11:00',
        endTime: '11:30',
        date: today,
        type: 'existing',
        color: '#4CAF50'
      },
      {
        id: '2',
        title: 'Client Call',
        startTime: '13:00',
        endTime: '13:30',
        date: today,
        type: 'existing',
        color: '#2196F3'
      },
      // Additional events for better demonstration
      {
        id: '3',
        title: 'Project Review',
        startTime: '09:15',
        endTime: '10:45',
        date: today,
        type: 'existing',
        color: '#FF9800'
      },
      {
        id: '4',
        title: 'Lunch Break',
        startTime: '12:00',
        endTime: '13:00',
        date: today,
        type: 'existing',
        color: '#9C27B0'
      },
      {
        id: '5',
        title: 'Design Workshop',
        startTime: '15:30',
        endTime: '17:00',
        date: today,
        type: 'existing',
        color: '#E91E63'
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
