// Calendar Application JavaScript
class CalendarApp {
    constructor() {
        this.events = [];
        this.timeSlots = [];
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.isScheduling = false;
        this.schedulingStartTime = '';
        this.schedulingEndTime = '';
        this.currentOverlap = { hasOverlap: false, overlappingEvents: [] };
        
        // Configuration
        this.HOUR_HEIGHT = 60; // pixels per hour
        this.START_HOUR = 9;   // 9 AM
        this.END_HOUR = 18;    // 6 PM
        this.PIXEL_PER_MINUTE = this.HOUR_HEIGHT / 60;
        
        this.init();
    }
    
    init() {
        this.loadMockEvents();
        this.generateTimeSlots();
        this.renderTimeLabels();
        this.renderEvents();
        this.setupEventListeners();
        this.updateCurrentDate();
    }
    
    loadMockEvents() {
        const today = this.selectedDate;
        
        this.events = [
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
    }
    
    generateTimeSlots() {
        this.timeSlots = [];
        for (let hour = this.START_HOUR; hour <= this.END_HOUR; hour++) {
            this.timeSlots.push({
                hour,
                label: this.formatHour(hour)
            });
        }
    }
    
    formatHour(hour) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:00 ${period}`;
    }
    
    renderTimeLabels() {
        const timeLabelsContainer = document.getElementById('time-labels');
        timeLabelsContainer.innerHTML = '';
        
        this.timeSlots.forEach(slot => {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.style.height = `${this.HOUR_HEIGHT}px`;
            timeLabel.textContent = slot.label;
            timeLabelsContainer.appendChild(timeLabel);
        });
    }
    
    renderEvents() {
        this.renderExistingEvents();
        this.renderNewEvents();
    }
    
    renderExistingEvents() {
        const container = document.getElementById('existing-events-grid');
        container.innerHTML = '';
        
        // Set container height
        container.style.height = `${this.timeSlots.length * this.HOUR_HEIGHT}px`;
        
        // Add time slot clickable areas
        this.timeSlots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.style.height = `${this.HOUR_HEIGHT}px`;
            timeSlot.style.top = `${(slot.hour - this.START_HOUR) * this.HOUR_HEIGHT}px`;
            timeSlot.addEventListener('click', (e) => this.onTimeSlotClick(e, slot.hour));
            timeSlot.addEventListener('mousemove', (e) => this.onSchedulingMouseMove(e, slot.hour));
            container.appendChild(timeSlot);
        });
        
        // Render existing events
        const existingEvents = this.events.filter(event => event.type === 'existing');
        existingEvents.forEach(event => {
            const eventElement = this.createEventElement(event, 'existing-event');
            container.appendChild(eventElement);
        });
        
        // Render scheduling preview
        if (this.isScheduling) {
            const schedulingPreview = this.createSchedulingPreview();
            if (schedulingPreview) {
                container.appendChild(schedulingPreview);
            }
        }
    }
    
    renderNewEvents() {
        const container = document.getElementById('new-events-grid');
        container.innerHTML = '';
        
        // Set container height
        container.style.height = `${this.timeSlots.length * this.HOUR_HEIGHT}px`;
        
        // Render new events
        const newEvents = this.events.filter(event => event.type === 'new');
        newEvents.forEach(event => {
            const eventElement = this.createEventElement(event, 'new-event');
            container.appendChild(eventElement);
        });
    }
    
    createEventElement(event, className) {
        const eventElement = document.createElement('div');
        eventElement.className = `event ${className}`;
        
        const position = this.calculateEventPosition(event);
        eventElement.style.top = `${position.top}px`;
        eventElement.style.height = `${position.height}px`;
        eventElement.style.backgroundColor = event.color;
        
        if (event.type === 'new' && this.currentOverlap.hasOverlap) {
            eventElement.style.borderLeft = '3px solid #f44336';
        }
        
        eventElement.innerHTML = `
            <div class="event-content">
                <div class="event-title">${event.title}</div>
                <div class="event-time">
                    ${this.formatTime(event.startTime)} - ${this.formatTime(event.endTime)}
                </div>
            </div>
        `;
        
        eventElement.title = `${event.title} (${this.formatTime(event.startTime)} - ${this.formatTime(event.endTime)})`;
        
        return eventElement;
    }
    
    createSchedulingPreview() {
        if (!this.schedulingStartTime || !this.schedulingEndTime) return null;
        
        const previewElement = document.createElement('div');
        previewElement.className = 'event scheduling-preview';
        
        const position = this.getSchedulingEventPosition();
        if (!position) return null;
        
        previewElement.style.top = `${position.top}px`;
        previewElement.style.height = `${position.height}px`;
        previewElement.style.backgroundColor = this.currentOverlap.hasOverlap ? 'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)';
        previewElement.style.border = this.currentOverlap.hasOverlap ? '2px solid #f44336' : '2px solid #4CAF50';
        
        previewElement.innerHTML = `
            <div class="event-content">
                <div class="event-title">New Event</div>
                <div class="event-time">
                    ${this.formatTime(this.schedulingStartTime)} - ${this.formatTime(this.schedulingEndTime)}
                </div>
                ${this.currentOverlap.hasOverlap ? 
                    `<div class="overlap-warning">
                        <small>⚠️ Overlaps with ${this.currentOverlap.overlappingEvents.length} event(s)</small>
                    </div>` : ''
                }
            </div>
        `;
        
        return previewElement;
    }
    
    calculateEventPosition(event) {
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
    
    getSchedulingEventPosition() {
        if (!this.schedulingStartTime || !this.schedulingEndTime) return null;
        
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
    
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    formatTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    onTimeSlotClick(event, hour) {
        if (!this.isScheduling) {
            this.startScheduling(event, hour);
        }
    }
    
    startScheduling(event, hour) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const minutes = Math.round(clickY / this.PIXEL_PER_MINUTE);
        const totalMinutes = (hour * 60) + minutes;
        
        this.schedulingStartTime = this.minutesToTime(totalMinutes);
        this.schedulingEndTime = this.minutesToTime(totalMinutes + 60); // Default 1 hour duration
        
        this.isScheduling = true;
        this.checkCurrentOverlap();
        this.updateSchedulingUI();
        this.renderEvents();
    }
    
    onSchedulingMouseMove(event, hour) {
        if (!this.isScheduling) return;
        
        const rect = event.currentTarget.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const minutes = Math.round(clickY / this.PIXEL_PER_MINUTE);
        const totalMinutes = (hour * 60) + minutes;
        const endTime = this.minutesToTime(totalMinutes);
        
        // Only update if it's after start time
        if (totalMinutes > this.timeToMinutes(this.schedulingStartTime)) {
            this.schedulingEndTime = endTime;
            this.checkCurrentOverlap();
            this.updateSchedulingUI();
            this.renderEvents();
        }
    }
    
    checkCurrentOverlap() {
        if (this.schedulingStartTime && this.schedulingEndTime) {
            this.currentOverlap = this.checkOverlap({
                startTime: this.schedulingStartTime,
                endTime: this.schedulingEndTime,
                date: this.selectedDate
            });
        }
    }
    
    checkOverlap(newEvent) {
        const existingEvents = this.events.filter(
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
    
    updateSchedulingUI() {
        const controls = document.getElementById('scheduling-controls');
        const info = document.getElementById('scheduling-info');
        const timeSpan = document.getElementById('scheduling-time');
        const indicator = document.getElementById('overlap-indicator');
        const overlapDetails = document.getElementById('overlap-details');
        const overlapList = document.getElementById('overlap-list');
        
        if (this.isScheduling) {
            controls.style.display = 'flex';
            timeSpan.textContent = `${this.formatTime(this.schedulingStartTime)} - ${this.formatTime(this.schedulingEndTime)}`;
            
            if (this.currentOverlap.hasOverlap) {
                indicator.textContent = 'OVERLAP DETECTED';
                indicator.className = 'overlap-indicator has-overlap';
                
                overlapDetails.style.display = 'block';
                overlapList.innerHTML = '';
                this.currentOverlap.overlappingEvents.forEach(event => {
                    const li = document.createElement('li');
                    li.textContent = `${event.title} (${this.formatTime(event.startTime)} - ${this.formatTime(event.endTime)})`;
                    overlapList.appendChild(li);
                });
            } else {
                indicator.textContent = 'NO CONFLICTS';
                indicator.className = 'overlap-indicator no-overlap';
                overlapDetails.style.display = 'none';
            }
        } else {
            controls.style.display = 'none';
            overlapDetails.style.display = 'none';
        }
    }
    
    confirmScheduling() {
        if (this.schedulingStartTime && this.schedulingEndTime) {
            const newEvent = {
                id: Date.now().toString(),
                title: 'New Event',
                startTime: this.schedulingStartTime,
                endTime: this.schedulingEndTime,
                date: this.selectedDate,
                type: 'new',
                color: this.currentOverlap.hasOverlap ? '#f44336' : '#4CAF50'
            };
            
            this.events.push(newEvent);
            this.cancelScheduling();
        }
    }
    
    cancelScheduling() {
        this.isScheduling = false;
        this.schedulingStartTime = '';
        this.schedulingEndTime = '';
        this.currentOverlap = { hasOverlap: false, overlappingEvents: [] };
        this.updateSchedulingUI();
        this.renderEvents();
    }
    
    updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        const date = new Date(this.selectedDate);
        dateElement.textContent = `Day View - ${date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`;
    }
    
    setupEventListeners() {
        // Event listeners are set up in renderExistingEvents method
        // Global functions for buttons are defined below
    }
}

// Global functions for button callbacks
let calendarApp;

function confirmScheduling() {
    calendarApp.confirmScheduling();
}

function cancelScheduling() {
    calendarApp.cancelScheduling();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    calendarApp = new CalendarApp();
});