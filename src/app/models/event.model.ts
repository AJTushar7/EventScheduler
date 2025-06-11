export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  date: string;      // Format: "YYYY-MM-DD"
  type: 'existing' | 'new';
  color?: string;
}

export interface TimeSlot {
  hour: number;
  label: string;
}

export interface EventPosition {
  left: number;
  width: number;
  top: number;
  height: number;
}

export interface OverlapInfo {
  hasOverlap: boolean;
  overlappingEvents: CalendarEvent[];
}
