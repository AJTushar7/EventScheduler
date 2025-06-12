// Calendar Event Scheduler - Angular Version
class CalendarScheduler {
    constructor() {
        this.events = [];
        this.selectedExecutionTime = '11:00';
        this.executionDuration = 60; // minutes (1 hour)
        this.currentConflict = null;
        
        this.init();
    }
    
    init() {
        this.loadExistingEvents();
        this.renderExistingEvents();
        this.checkForConflicts();
        this.updateNewEventPreview();
    }
    
    loadExistingEvents() {
        // Load existing booked events with 1-hour intervals and varying start times
        this.events = [
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
    
    getTimePosition(startTime, endTime) {
        // We have 12 time slots from 9:00 to 20:00 
        // Slots: 9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00
        // That's 12 equal columns, each representing 1 hour
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        
        const gridStartMinutes = 9 * 60; // 9:00 AM (540 minutes)
        const gridEndMinutes = 20 * 60; // 8:00 PM (1200 minutes) 
        const totalSlots = 12; // We have 12 time slot columns
        const slotWidthPercent = 100 / totalSlots; // Each slot = 8.333%
        
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
    
    renderExistingEvents() {
        const container = document.getElementById('existing-events');
        // Clear existing event blocks but keep the cells
        const existingBlocks = container.querySelectorAll('.event-block');
        existingBlocks.forEach(block => block.remove());
        
        this.events.forEach(event => {
            if (event.type === 'booked') {
                const position = this.getTimePosition(event.startTime, event.endTime);
                const eventBlock = document.createElement('div');
                eventBlock.className = 'event-block booked';
                eventBlock.style.left = position.left;
                eventBlock.style.width = position.width;
                eventBlock.textContent = `${event.startTime} to ${event.endTime}`;
                
                container.appendChild(eventBlock);
            }
        });
    }
    
    updateNewEventPreview() {
        const startMinutes = this.timeToMinutes(this.selectedExecutionTime);
        const endMinutes = startMinutes + this.executionDuration;
        const endTime = this.minutesToTime(endMinutes);
        
        const container = document.getElementById('new-events');
        
        // Clear existing new event blocks
        const existingBlocks = container.querySelectorAll('.event-block');
        existingBlocks.forEach(block => block.remove());
        
        const position = this.getTimePosition(this.selectedExecutionTime, endTime);
        const eventBlock = document.createElement('div');
        eventBlock.className = 'event-block new-event';
        
        // Apply conflict styling if there's a conflict
        if (this.currentConflict) {
            eventBlock.classList.add('conflict');
        }
        
        eventBlock.style.left = position.left;
        eventBlock.style.width = position.width;
        eventBlock.textContent = `${this.selectedExecutionTime} to ${endTime}`;
        
        container.appendChild(eventBlock);
    }
    
    checkForConflicts() {
        const startMinutes = this.timeToMinutes(this.selectedExecutionTime);
        const endMinutes = startMinutes + this.executionDuration;
        const endTime = this.minutesToTime(endMinutes);
        
        console.log(`Checking conflict for: ${this.selectedExecutionTime} to ${endTime}`);
        
        this.currentConflict = null;
        
        // Check against existing events
        for (const event of this.events) {
            if (event.type === 'booked') {
                console.log(`Existing event: ${event.startTime} to ${event.endTime}`);
                
                const newEventStart = this.timeToMinutes(this.selectedExecutionTime);
                const newEventEnd = this.timeToMinutes(endTime);
                const existingStart = this.timeToMinutes(event.startTime);
                const existingEnd = this.timeToMinutes(event.endTime);
                
                console.log(`New event minutes: ${newEventStart} to ${newEventEnd}`);
                console.log(`Existing event minutes: ${existingStart} to ${existingEnd}`);
                
                // Check for overlap: events overlap if new start < existing end AND new end > existing start
                const hasOverlap = newEventStart < existingEnd && newEventEnd > existingStart;
                console.log(`Overlap check: ${newEventStart} < ${existingEnd} && ${newEventEnd} > ${existingStart} = ${hasOverlap}`);
                
                if (hasOverlap) {
                    console.log('Conflict detected with:', event);
                    this.currentConflict = event;
                    this.showConflictAlert(event);
                    return;
                }
            }
        }
        
        console.log('No conflicts detected');
        this.hideConflictAlert();
    }
    
    showConflictAlert(conflictEvent) {
        const alert = document.getElementById('conflict-alert');
        const message = document.getElementById('conflict-message');
        
        message.textContent = `This time conflicts with an existing event from ${conflictEvent.startTime} to ${conflictEvent.endTime}.`;
        alert.style.display = 'flex';
    }
    
    hideConflictAlert() {
        const alert = document.getElementById('conflict-alert');
        alert.style.display = 'none';
    }
}

// Global functions for event handlers
function updateExecutionTime() {
    const select = document.getElementById('execution-time');
    window.scheduler.selectedExecutionTime = select.value;
    window.scheduler.checkForConflicts();
    window.scheduler.updateNewEventPreview();
}

function confirmExecution() {
    if (!window.scheduler.currentConflict) {
        alert('Event confirmed!');
    }
}

function cancelExecution() {
    // Reset to default
    document.getElementById('execution-time').value = '11:00';
    updateExecutionTime();
}

// Initialize the calendar when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.scheduler = new CalendarScheduler();
});