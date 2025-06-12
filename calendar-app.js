// Calendar Event Scheduler
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
        // We have 12 time slots from 9:00 to 20:00 (each slot = 1 hour = 8.333% width)
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        
        const gridStartMinutes = 9 * 60; // 9:00 AM (540 minutes)
        const totalGridHours = 11; // From 9:00 to 20:00 (11 hours displayed)
        const slotWidthPercent = 100 / totalGridHours; // Each hour slot = ~9.09%
        
        // Calculate relative positions in minutes from 9:00 AM
        const relativeStartMinutes = startMinutes - gridStartMinutes;
        const relativeEndMinutes = endMinutes - gridStartMinutes;
        
        // Convert to hours (decimal) for precise positioning
        const relativeStartHours = relativeStartMinutes / 60;
        const relativeEndHours = relativeEndMinutes / 60;
        
        // Calculate percentage positions
        const leftPercent = (relativeStartHours / totalGridHours) * 100;
        const widthPercent = ((relativeEndHours - relativeStartHours) / totalGridHours) * 100;
        
        // Ensure bounds are within the grid
        const finalLeft = Math.max(0, Math.min(leftPercent, 100));
        const finalWidth = Math.max(0, Math.min(widthPercent, 100 - finalLeft));
        
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
                eventBlock.style.top = '8px';
                eventBlock.style.height = '64px';
                
                eventBlock.innerHTML = `
                    <div class="event-label">Booked</div>
                    <div class="event-time">${event.startTime} to ${event.endTime}</div>
                `;
                
                container.appendChild(eventBlock);
            }
        });
    }
    
    updateNewEventPreview() {
        const container = document.getElementById('new-events');
        // Clear existing event blocks but keep the cells
        const existingBlocks = container.querySelectorAll('.event-block');
        existingBlocks.forEach(block => block.remove());
        
        const startTime = this.selectedExecutionTime;
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = startMinutes + this.executionDuration;
        const endTime = this.minutesToTime(endMinutes);
        
        const position = this.getTimePosition(startTime, endTime);
        const eventBlock = document.createElement('div');
        
        const hasConflict = this.currentConflict !== null;
        eventBlock.className = hasConflict ? 'event-block conflict' : 'event-block new-time';
        eventBlock.style.left = position.left;
        eventBlock.style.width = position.width;
        eventBlock.style.top = '8px';
        eventBlock.style.height = '64px';
        
        const label = hasConflict ? 'Time Conflict' : 'New Time';
        eventBlock.innerHTML = `
            <div class="event-label">${label}</div>
            <div class="event-time">${startTime} to ${endTime}</div>
        `;
        
        container.appendChild(eventBlock);
    }
    
    checkForConflicts() {
        const startTime = this.selectedExecutionTime;
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = startMinutes + this.executionDuration;
        
        console.log(`Checking conflict for: ${startTime} to ${this.minutesToTime(endMinutes)}`);
        
        // Reset conflict state
        this.currentConflict = null;
        
        // Check if new event overlaps with any existing events
        for (const event of this.events) {
            if (event.type !== 'booked') continue;
            
            const eventStart = this.timeToMinutes(event.startTime);
            const eventEnd = this.timeToMinutes(event.endTime);
            
            console.log(`Existing event: ${event.startTime} to ${event.endTime}`);
            console.log(`New event minutes: ${startMinutes} to ${endMinutes}`);
            console.log(`Existing event minutes: ${eventStart} to ${eventEnd}`);
            
            // Overlap occurs when: new_start < existing_end AND new_end > existing_start
            const hasOverlap = (startMinutes < eventEnd && endMinutes > eventStart);
            console.log(`Overlap check: ${startMinutes} < ${eventEnd} && ${endMinutes} > ${eventStart} = ${hasOverlap}`);
            
            if (hasOverlap) {
                this.currentConflict = event;
                console.log('Conflict detected with:', this.currentConflict);
                this.showConflictAlert();
                return; // Exit early on first conflict
            }
        }
        
        console.log('No conflicts detected');
        this.hideConflictAlert();
    }
    
    showConflictAlert() {
        const alert = document.getElementById('conflict-alert');
        const message = document.getElementById('conflict-message');
        
        const startTime = this.selectedExecutionTime;
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = startMinutes + this.executionDuration;
        const endTime = this.minutesToTime(endMinutes);
        
        const conflict = this.currentConflict;
        message.innerHTML = `The execution time provided from ${startTime} to ${endTime} <strong>overlaps with another campaign</strong>, which is executing between ${conflict.startTime} to ${conflict.endTime}.<br>Your campaign would require ${this.executionDuration} minutes for execution.`;
        
        alert.style.display = 'flex';
    }
    
    hideConflictAlert() {
        const alert = document.getElementById('conflict-alert');
        alert.style.display = 'none';
    }
    
    updateExecutionTime() {
        const select = document.getElementById('execution-time');
        this.selectedExecutionTime = select.value;
        this.checkForConflicts();
        this.updateNewEventPreview();
    }
}

// Global functions for HTML callbacks
let scheduler;

function updateExecutionTime() {
    scheduler.updateExecutionTime();
}

function confirmExecution() {
    const hasConflict = scheduler.currentConflict !== null;
    if (hasConflict) {
        alert('Cannot confirm execution due to time conflict. Please select a different time.');
        return;
    }
    alert('Execution time confirmed successfully!');
}

function cancelExecution() {
    // Reset to default time
    const select = document.getElementById('execution-time');
    select.value = '11:00';
    scheduler.selectedExecutionTime = '11:00';
    scheduler.updateNewEventPreview();
    scheduler.checkForConflicts();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    scheduler = new CalendarScheduler();
});