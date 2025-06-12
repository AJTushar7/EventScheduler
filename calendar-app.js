// Calendar Event Scheduler
class CalendarScheduler {
    constructor() {
        this.events = [];
        this.selectedExecutionTime = '11:00';
        this.executionDuration = 40; // minutes
        this.currentConflict = null;
        
        this.init();
    }
    
    init() {
        this.loadExistingEvents();
        this.renderExistingEvents();
        this.updateNewEventPreview();
        this.checkForConflicts();
    }
    
    loadExistingEvents() {
        // Load existing booked events based on the provided mock data
        this.events = [
            {
                id: '1',
                startTime: '11:00',
                endTime: '11:30',
                type: 'booked'
            },
            {
                id: '2', 
                startTime: '13:00',
                endTime: '13:30',
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
        // Calculate position based on 12-hour grid (9:00 to 20:00)
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        const gridStartMinutes = 9 * 60; // 9:00 AM
        const gridEndMinutes = 20 * 60; // 8:00 PM
        const totalGridMinutes = gridEndMinutes - gridStartMinutes;
        
        const relativeStart = startMinutes - gridStartMinutes;
        const duration = endMinutes - startMinutes;
        
        const leftPercent = (relativeStart / totalGridMinutes) * 100;
        const widthPercent = (duration / totalGridMinutes) * 100;
        
        return {
            left: `${leftPercent}%`,
            width: `${widthPercent}%`
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
        
        // Check if new event overlaps with any existing events
        const conflicts = this.events.filter(event => {
            if (event.type !== 'booked') return false;
            
            const eventStart = this.timeToMinutes(event.startTime);
            const eventEnd = this.timeToMinutes(event.endTime);
            
            return (startMinutes < eventEnd && endMinutes > eventStart);
        });
        
        if (conflicts.length > 0) {
            this.currentConflict = conflicts[0];
            this.showConflictAlert();
        } else {
            this.currentConflict = null;
            this.hideConflictAlert();
        }
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
        this.updateNewEventPreview();
        this.checkForConflicts();
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