document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const meetingTime = document.getElementById('meeting-time');
    const baseTimezone = document.getElementById('base-timezone');
    const addTimezone = document.getElementById('add-timezone');
    const addTimezoneBtn = document.getElementById('add-timezone-btn');
    const timezoneList = document.getElementById('timezone-list');
    
    // Detect if we're on a mobile device
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    // Detect if we're on a tablet in portrait mode
    const isTabletPortrait = window.matchMedia("(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)").matches;
    
    // Add classes to help with responsive styling
    if (isMobile) {
        document.body.classList.add('mobile-device');
    } else if (isTabletPortrait) {
        document.body.classList.add('tablet-portrait');
    }
    
    // Detect orientation changes and update classes
    window.addEventListener('orientationchange', function() {
        // Small delay to ensure window dimensions are updated
        setTimeout(function() {
            const isPortrait = window.matchMedia("(orientation: portrait)").matches;
            const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
            
            if (isTablet && isPortrait) {
                document.body.classList.add('tablet-portrait');
            } else {
                document.body.classList.remove('tablet-portrait');
            }
            
            // Recenter the meeting time after orientation change
            setTimeout(centerOnMeetingTime, 300);
        }, 100);
    });
    
    // Initialize with current date
    const today = new Date();
    
    // Set current time (rounded to nearest half hour) as default
    const roundedMinutes = Math.round(today.getMinutes() / 30) * 30;
    today.setMinutes(roundedMinutes, 0, 0);
    meetingTime.value = today.toTimeString().substring(0, 5);
    
    // Set indicator that we're in initial load
    window._isInitialLoad = true;
    
    // Available timezones in increasing order with GMT only
    const timezones = [
        { id: 'Pacific/Honolulu', name: 'GMT-10:00', offset: -10, label: 'GMT-10:00' },
        { id: 'America/Anchorage', name: 'GMT-9:00', offset: -9, label: 'GMT-9:00' },
        { id: 'America/Los_Angeles', name: 'GMT-8:00', offset: -8, label: 'GMT-8:00' },
        { id: 'America/Denver', name: 'GMT-7:00', offset: -7, label: 'GMT-7:00' },
        { id: 'America/Chicago', name: 'GMT-6:00', offset: -6, label: 'GMT-6:00' },
        { id: 'America/New_York', name: 'GMT-5:00', offset: -5, label: 'GMT-5:00' },
        { id: 'America/Halifax', name: 'GMT-4:00', offset: -4, label: 'GMT-4:00' },
        { id: 'America/Sao_Paulo', name: 'GMT-3:00', offset: -3, label: 'GMT-3:00' },
        { id: 'Atlantic/South_Georgia', name: 'GMT-2:00', offset: -2, label: 'GMT-2:00' },
        { id: 'Atlantic/Cape_Verde', name: 'GMT-1:00', offset: -1, label: 'GMT-1:00' },
        { id: 'GMT', name: 'GMT+0:00', offset: 0, label: 'GMT+0:00' },
        { id: 'Europe/Paris', name: 'GMT+1:00', offset: 1, label: 'GMT+1:00' },
        { id: 'Europe/Athens', name: 'GMT+2:00', offset: 2, label: 'GMT+2:00' },
        { id: 'Europe/Moscow', name: 'GMT+3:00', offset: 3, label: 'GMT+3:00' },
        { id: 'Asia/Dubai', name: 'GMT+4:00', offset: 4, label: 'GMT+4:00' },
        { id: 'Asia/Karachi', name: 'GMT+5:00', offset: 5, label: 'GMT+5:00' },
        { id: 'Asia/Kolkata', name: 'GMT+5:30', offset: 5.5, label: 'GMT+5:30' },
        { id: 'Asia/Dhaka', name: 'GMT+6:00', offset: 6, label: 'GMT+6:00' },
        { id: 'Asia/Bangkok', name: 'GMT+7:00', offset: 7, label: 'GMT+7:00' },
        { id: 'Asia/Singapore', name: 'GMT+8:00', offset: 8, label: 'GMT+8:00' },
        { id: 'Asia/Tokyo', name: 'GMT+9:00', offset: 9, label: 'GMT+9:00' },
        { id: 'Australia/Sydney', name: 'GMT+10:00', offset: 10, label: 'GMT+10:00' },
        { id: 'Pacific/Noumea', name: 'GMT+11:00', offset: 11, label: 'GMT+11:00' },
        { id: 'Pacific/Auckland', name: 'GMT+12:00', offset: 12, label: 'GMT+12:00' }
    ];

    // Selected timezones
    let selectedTimezones = new Set();
    
    // Initialize timezone selectors
    function initializeTimezoneSelectors() {
        // For base timezone
        const baseFragment = document.createDocumentFragment();
        
        // Use local timezone as default
        const localTimezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let localTimezoneFound = false;
        
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz.id;
            option.textContent = tz.label;
            
            // If this is the local timezone or close to it, select it by default
            if (tz.id === localTimezoneName || 
                (tz.id === 'GMT' && !localTimezoneFound && !timezones.some(t => t.id === localTimezoneName))) {
                option.selected = true;
                localTimezoneFound = true;
                
                // Add this timezone to the list
                selectedTimezones.add(tz.id);
            }
            
            baseFragment.appendChild(option);
        });
        
        baseTimezone.appendChild(baseFragment);
        
        // For add timezone dropdown
        const addFragment = document.createDocumentFragment();
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz.id;
            option.textContent = tz.label;
            addFragment.appendChild(option);
        });
        
        addTimezone.appendChild(addFragment);
        
        // Update the timezone list initially
        updateTimezoneList();
    }
    
    // Get the time for a specific timezone
    function getTimeForZone(time, sourceTimezone, targetTimezone) {
        // Create date in the source timezone
        const [hours, minutes] = time.split(':').map(Number);
        const sourceDate = new Date();
        sourceDate.setHours(hours, minutes, 0, 0);
        
        // Convert to target timezone
        const sourceOffset = getTimezoneOffset(sourceTimezone);
        const targetOffset = getTimezoneOffset(targetTimezone);
        const offsetDifference = targetOffset - sourceOffset;
        
        const targetDate = new Date(sourceDate.getTime() + offsetDifference * 60 * 60 * 1000);
        return targetDate;
    }
    
    // Get the timezone offset (simplified for demo)
    function getTimezoneOffset(timezoneId) {
        const timezone = timezones.find(tz => tz.id === timezoneId);
        return timezone ? timezone.offset : 0;
    }
    
    // Determine time period class (morning, afternoon, evening, night)
    function getTimePeriodClass(hour) {
        if (hour >= 22 || hour < 6) return 'night';
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        return 'evening';
    }
    
    // Check if it's within typical working hours (9 AM - 5 PM)
    function isWorkingHours(hour) {
        return hour >= 9 && hour < 17;
    }
    
    // Update the timezone list display
    function updateTimezoneList() {
        timezoneList.innerHTML = '';
        
        if (selectedTimezones.size === 0) {
            return;
        }
        
        const baseTime = meetingTime.value;
        const baseTz = baseTimezone.value;
        
        // Store references to all timezone hour containers for synchronized scrolling
        const hourContainers = [];
        
        // Store current meeting hour for scrolling to it later
        let meetingHourBlock = null;
        
        selectedTimezones.forEach(tzId => {
            const timezone = timezones.find(tz => tz.id === tzId);
            if (!timezone) return;
            
            // Create row for this timezone
            const row = document.createElement('div');
            row.className = 'timezone-row';
            
            // Timezone info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'timezone-info';
            
            // Timezone label display
            const nameSpan = document.createElement('span');
            nameSpan.className = 'timezone-name';
            nameSpan.textContent = timezone.label;
            
            // Create a button wrapper for better touch target
            const btnWrapper = document.createElement('div');
            btnWrapper.className = 'btn-wrapper';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-timezone';
            removeBtn.innerHTML = '<span class="material-icons">close</span>';
            // Larger touch target on mobile
            if (isMobile) {
                removeBtn.style.width = '32px';
                removeBtn.style.height = '32px';
            }
            removeBtn.onclick = () => {
                selectedTimezones.delete(tzId);
                updateTimezoneList();
            };
            
            // Add aria-label for accessibility
            removeBtn.setAttribute('aria-label', `Remove ${timezone.label} timezone`);
            
            // Prevent event bubbling when touching the button on mobile
            removeBtn.addEventListener('touchend', e => {
                e.stopPropagation();
            });
            
            btnWrapper.appendChild(removeBtn);
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(btnWrapper);
            
            // Hours display
            const hoursDiv = document.createElement('div');
            hoursDiv.className = 'timezone-hours';
            
            // Add to our collection for synchronized scrolling
            hourContainers.push(hoursDiv);
            
            // Reference time in this timezone (used to populate 24-hour display)
            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            
            // Meeting time in this timezone
            const meetingDateTime = getTimeForZone(baseTime, baseTz, tzId);
            const meetingHour = meetingDateTime.getHours();
            const meetingMinutes = meetingDateTime.getMinutes();
            
            // Calculate offset for aligned display
            const baseTimezoneOffset = getTimezoneOffset(baseTz);
            const thisTimezoneOffset = getTimezoneOffset(tzId);
            const hourShift = thisTimezoneOffset - baseTimezoneOffset;
            
            // Generate 24 hour blocks
            for (let hour = 0; hour < 24; hour++) {
                const hourBlock = document.createElement('div');
                const adjustedHour = (hour + 24 - hourShift) % 24;
                hourBlock.className = `hour-block ${getTimePeriodClass(hour)}`;
                hourBlock.setAttribute('data-actual-hour', hour);
                hourBlock.setAttribute('data-aligned-hour', adjustedHour);
                
                // Add hour tooltip
                hourBlock.title = `${timezone.label} at ${hour}:00`;
                
                if (isWorkingHours(hour)) {
                    hourBlock.classList.add('working-hours');
                }
                
                // Add time label
                const hourLabel = document.createElement('span');
                hourLabel.className = 'hour-label';
                hourLabel.textContent = `${hour}:00`;
                hourBlock.appendChild(hourLabel);
                
                // Time of day icon
                const timeIcon = document.createElement('span');
                timeIcon.className = 'time-icon material-icons';
                
                // Assign time period icon
                if (hour >= 22 || hour < 6) {
                    timeIcon.textContent = 'dark_mode';
                } else if (hour >= 6 && hour < 12) {
                    timeIcon.textContent = 'brightness_5';
                } else if (hour >= 12 && hour < 17) {
                    timeIcon.textContent = 'wb_sunny';
                } else {
                    timeIcon.textContent = 'nights_stay';
                }
                
                hourBlock.appendChild(timeIcon);
                
                // Create hour text element
                const hourText = document.createElement('span');
                hourText.className = 'hour-text';
                const display12Hour = hour % 12 === 0 ? 12 : hour % 12;
                hourText.textContent = `${display12Hour}${hour < 12 ? 'a' : 'p'}`;
                hourBlock.appendChild(hourText);
                
                // Highlight selected meeting time
                if (hour === meetingHour) {
                    hourBlock.classList.add('current');
                    
                    // Add bottom marker
                    const meetingMarker = document.createElement('div');
                    meetingMarker.className = 'meeting-marker';
                    hourBlock.appendChild(meetingMarker);
                    
                    // Enhanced tooltip for selected time
                    const formattedMinutes = meetingMinutes === 0 ? '00' : meetingMinutes;
                    hourBlock.title = `SELECTED: ${timezone.label} at ${meetingHour}:${formattedMinutes}`;
                    
                    // Store this block for auto-scrolling to the meeting time
                    if (meetingHourBlock === null) {
                        meetingHourBlock = hourBlock;
                    }
                }
                
                // Add double-tap zoom for mobile
                if (isMobile) {
                    let lastTap = 0;
                    hourBlock.addEventListener('touchend', (e) => {
                        const currentTime = new Date().getTime();
                        const tapLength = currentTime - lastTap;
                        
                        if (tapLength < 300 && tapLength > 0) {
                            // Double tap detected
                            e.preventDefault();
                            
                            // Toggle a zoomed class
                            if (hourBlock.classList.contains('zoomed')) {
                                hourBlock.classList.remove('zoomed');
                                // Remove any other zoomed blocks
                                document.querySelectorAll('.hour-block.zoomed').forEach(block => {
                                    block.classList.remove('zoomed');
                                });
                            } else {
                                // Remove zoomed class from any other blocks first
                                document.querySelectorAll('.hour-block.zoomed').forEach(block => {
                                    block.classList.remove('zoomed');
                                });
                                hourBlock.classList.add('zoomed');
                            }
                        }
                        lastTap = currentTime;
                    });
                }
                
                // Set data attribute for the correct hour position
                hourBlock.setAttribute('data-hour', hour);
                
                // Set horizontal position using flexbox order
                // This ensures proper horizontal alignment across all timezones
                hourBlock.style.order = adjustedHour;
                
                hoursDiv.appendChild(hourBlock);
            }
            
            row.appendChild(infoDiv);
            row.appendChild(hoursDiv);
            timezoneList.appendChild(row);
        });
        
        // Dispatch event to trigger synchronized scrolling setup
        document.dispatchEvent(new CustomEvent('timezonesUpdated'));
        
        // Center on meeting time with a slight delay to ensure DOM is fully updated
        setTimeout(centerOnMeetingTime, 50);
    }
    
    // Function to add a timezone independently then relink scrolling
    function addNewTimezone(timezoneId) {
        if (timezoneId && !selectedTimezones.has(timezoneId)) {
            // First, remove any existing scroll synchronization
            removeSyncScrolling();
            
            // Add the timezone to the list and update the display
            selectedTimezones.add(timezoneId);
            updateTimezoneList();
            
            // Give the DOM time to update with the new timezone
            setTimeout(() => {
                // Get all timezone containers now that the new one is added
                const allContainers = document.querySelectorAll('.timezone-hours');
                
                // Find the newly added container (last one)
                const newContainer = allContainers[allContainers.length - 1];
                
                // Center each container independently on its own meeting time
                allContainers.forEach(container => {
                    centerSingleTimezoneOnMeetingTime(container);
                });
                
                // Only after all containers are centered, set up the synchronized scrolling
                setTimeout(setupSynchronizedScrolling, 500);
                
                // Add highlight animation to the new row on mobile or tablet portrait
                if ((isMobile || isTabletPortrait) && newContainer) {
                    const newRow = newContainer.closest('.timezone-row');
                    if (newRow) {
                        newRow.classList.add('highlight-new');
                        setTimeout(() => {
                            newRow.classList.remove('highlight-new');
                        }, 1500);
                    }
                }
            }, 100);
        }
    }
    
    // Event listeners
    addTimezoneBtn.addEventListener('click', () => {
        addNewTimezone(addTimezone.value);
    });
    
    // Add timezone on Enter key
    addTimezone.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTimezone(addTimezone.value);
        }
    });
    
    // Add a global function to force center on the meeting time
    // This can be called from the browser console for debugging if needed
    window.forceCenterOnMeetingTime = function() {
        // Force multiple centering attempts with delays
        centerOnMeetingTime();
        setTimeout(centerOnMeetingTime, 100);
        setTimeout(centerOnMeetingTime, 300);
        setTimeout(centerOnMeetingTime, 600);
    };
    
    // Handle arrow key navigation in time input for continuous 24-hour cycling
    meetingTime.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault(); // Prevent default browser behavior
            
            // Get current time value
            const timeValue = meetingTime.value;
            if (!timeValue) return;
            
            // Parse hours and minutes
            const [hours, minutes] = timeValue.split(':').map(Number);
            
            // Calculate new hour based on arrow key
            let newHour = hours;
            if (e.key === 'ArrowUp') {
                newHour = (hours + 1) % 24; // Increment hour, wrap around at 24
            } else {
                newHour = (hours - 1 + 24) % 24; // Decrement hour, wrap around at 0
            }
            
            // Format the new time value (ensure leading zeros)
            const formattedHour = newHour.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
            
            // Set the new time value
            meetingTime.value = `${formattedHour}:${formattedMinutes}`;
            
            // Trigger change event to update the display
            meetingTime.dispatchEvent(new Event('change'));
        }
    });
    
    meetingTime.addEventListener('change', function() {
        updateTimezoneList();
        // Add a small delay to ensure DOM is updated before centering
        setTimeout(centerOnMeetingTime, 150);
    });
    
    baseTimezone.addEventListener('change', function() {
        updateTimezoneList();
        // Add a small delay to ensure DOM is updated before centering
        setTimeout(centerOnMeetingTime, 150);
    });
    
    // Simple function to link scrolling between timezone containers
    function setupSynchronizedScrolling() {
        const hourContainers = document.querySelectorAll('.timezone-hours');
        if (hourContainers.length <= 1) return;
        
        // First remove any existing scroll handlers to prevent conflicts
        removeSyncScrolling();
        
        // Create a very simple synchronization system
        let isCurrentlySyncing = false;
        
        // Create a new scroll handler
        window._syncScrollHandler = function(e) {
            // Skip if we're already in the middle of syncing
            if (isCurrentlySyncing) return;
            
            // Set syncing flag to prevent loops
            isCurrentlySyncing = true;
            
            // Get the scroll position from the container being scrolled
            const scrollPosition = this.scrollLeft;
            
            // Apply this scroll position to all OTHER containers
            hourContainers.forEach(container => {
                if (container !== this) {
                    // Direct assignment for immediate update
                    container.scrollLeft = scrollPosition;
                }
            });
            
            // Reset the syncing flag
            setTimeout(() => {
                isCurrentlySyncing = false;
            }, 50);
        };
        
        // Add the scroll handler to all containers
        hourContainers.forEach(container => {
            container.addEventListener('scroll', window._syncScrollHandler, { passive: true });
        });
    }
    
    // Call this whenever timezones are added or removed
    /**
     * Centers a specific timezone container on its current meeting time
     * This function centers ONE container at a time independently
     */
    function centerSingleTimezoneOnMeetingTime(container) {
        if (!container) return false;
        
        // Find the current time block in THIS SPECIFIC container
        const currentBlock = container.querySelector('.hour-block.current');
        if (!currentBlock) return false;
        
        // Make sure the block is properly rendered
        if (!currentBlock.offsetParent || currentBlock.offsetWidth === 0) return false;
        
        // Calculate the position to center this block in this container
        const blockOffsetLeft = currentBlock.offsetLeft;
        const containerWidth = container.clientWidth;
        const blockWidth = currentBlock.offsetWidth;
        
        // Calculate the scroll position
        const scrollPosition = blockOffsetLeft - (containerWidth / 2) + (blockWidth / 2);
        
        // Apply scroll to ONLY this container
        container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        
        return true; // Successfully centered
    }
    
    /**
     * Centers all timezone containers independently, then links their scrolling
     */
    function centerOnMeetingTime() {
        // First, get all timezone hour containers
        const hourContainers = document.querySelectorAll('.timezone-hours');
        if (hourContainers.length === 0) return;
        
        // Temporarily remove any scroll synchronization
        removeSyncScrolling();
        
        // For each container, independently center it on its meeting time
        let anySucceeded = false;
        hourContainers.forEach(container => {
            const success = centerSingleTimezoneOnMeetingTime(container);
            if (success) anySucceeded = true;
        });
        
        // If at least one container was centered successfully, set up sync scrolling
        if (anySucceeded) {
            // Wait until the smooth scrolling has finished before linking
            setTimeout(setupSynchronizedScrolling, 500);
        } else if (window._isInitialLoad) {
            // If we couldn't center any container and this is initial load, try again
            window._isInitialLoad = false;
            setTimeout(centerOnMeetingTime, 100);
        }
    }
    
    /**
     * Removes any synchronized scrolling handlers
     */
    function removeSyncScrolling() {
        if (!window._syncScrollHandler) return;
        
        const hourContainers = document.querySelectorAll('.timezone-hours');
        hourContainers.forEach(container => {
            container.removeEventListener('scroll', window._syncScrollHandler);
        });
    }
    
    // Call this whenever timezones are added, removed, or meeting time changes
    document.addEventListener('timezonesUpdated', setupSynchronizedScrolling);
    
    // Initialize
    initializeTimezoneSelectors();
    
    // Add window resize handler to keep meeting time centered
    window.addEventListener('resize', function() {
        // Debounce resize handler to improve performance
        clearTimeout(window._resizeTimer);
        window._resizeTimer = setTimeout(centerOnMeetingTime, 100);
    });
    
    // Create a mutation observer to detect when timezone rows are fully rendered
    const timezoneListObserver = new MutationObserver(mutations => {
        // Check if timezone rows were added
        const hasAddedTimezones = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && node.classList && node.classList.contains('timezone-row')
            )
        );
        
        if (hasAddedTimezones) {
            // When timezone rows are added, center on meeting time
            setTimeout(centerOnMeetingTime, 100);
        }
    });
    
    // Observe timezone list for DOM changes
    const tzList = document.getElementById('timezone-list');
    if (tzList) {
        timezoneListObserver.observe(tzList, { childList: true, subtree: true });
    }
    
    // Add scroll indicators for mobile devices and tablets in portrait mode
    if (isMobile || isTabletPortrait) {
        const timezoneListContainer = document.querySelector('.timezone-list-container');
        
        // Show scroll hints on first load
        setTimeout(() => {
            const scrollHint = document.createElement('div');
            scrollHint.className = 'scroll-hint';
            scrollHint.innerHTML = '<span class="material-icons">swipe</span> Swipe to see all hours';
            timezoneListContainer.appendChild(scrollHint);
            
            // Remove hint after 5 seconds
            setTimeout(() => {
                scrollHint.style.opacity = '0';
                setTimeout(() => scrollHint.remove(), 500);
            }, 5000);
        }, 1000);
        
        // Add touch-friendly swipe-to-scroll support
        let isScrolling = false;
        let startX;
        let scrollLeft;
        
        // Add a visual indicator that shows horizontal scrolling is available
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'horizontal-scroll-indicator';
        scrollIndicator.innerHTML = '<div class="scroll-track"><div class="scroll-thumb"></div></div>';
        timezoneListContainer.appendChild(scrollIndicator);
        
        // Add a button to recenter on meeting time
        const centerButton = document.createElement('button');
        centerButton.className = 'center-meeting-button';
        centerButton.innerHTML = '<span class="material-icons">center_focus_strong</span>';
        centerButton.setAttribute('aria-label', 'Center on meeting time');
        centerButton.title = 'Center on meeting time';
        centerButton.onclick = function() {
            centerOnMeetingTime();
        };
        timezoneListContainer.appendChild(centerButton);
        
        // Update scroll indicator position based on scroll position
        function updateScrollIndicator() {
            if (!timezoneListContainer) return;
            
            const scrollWidth = timezoneListContainer.scrollWidth;
            const clientWidth = timezoneListContainer.clientWidth;
            
            if (scrollWidth <= clientWidth) {
                scrollIndicator.style.display = 'none';
                return;
            }
            
            scrollIndicator.style.display = 'block';
            const scrollThumb = scrollIndicator.querySelector('.scroll-thumb');
            const scrollPercentage = timezoneListContainer.scrollLeft / (scrollWidth - clientWidth);
            const thumbWidth = (clientWidth / scrollWidth) * 100;
            const thumbPosition = scrollPercentage * (100 - thumbWidth);
            
            scrollThumb.style.width = thumbWidth + '%';
            scrollThumb.style.left = thumbPosition + '%';
        }
        
        // Initialize the indicator and update on content changes
        updateScrollIndicator();
        window.addEventListener('resize', updateScrollIndicator);
        new MutationObserver(() => {
            updateScrollIndicator();
            // Reapply scrolling to selected hour when content changes
            const currentHourElements = document.querySelectorAll('.hour-block.current');
            if (currentHourElements.length > 0) {
                const firstCurrentHour = currentHourElements[0];
                const hourContainers = Array.from(document.querySelectorAll('.timezone-hours'));
                if (hourContainers.length > 0) {
                    const scrollPosition = firstCurrentHour.offsetLeft - (hourContainers[0].clientWidth / 2) + (firstCurrentHour.offsetWidth / 2);
                    hourContainers.forEach(container => {
                        container.scrollLeft = scrollPosition;
                    });
                }
            }
        }).observe(timezoneList, { childList: true, subtree: true });
        
        timezoneListContainer.addEventListener('scroll', updateScrollIndicator);
        
        timezoneListContainer.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - timezoneListContainer.offsetLeft;
            scrollLeft = timezoneListContainer.scrollLeft;
        });
        
        timezoneListContainer.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            const x = e.touches[0].pageX - timezoneListContainer.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            timezoneListContainer.scrollLeft = scrollLeft - walk;
        });
        
        timezoneListContainer.addEventListener('touchend', () => {
            isScrolling = false;
        });
    }
});