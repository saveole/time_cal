/**
 * Sleep Tracker Module
 * Handles all sleep tracking functionality
 */

class SleepTracker {
    constructor() {
        this.currentEditId = null;
        this.editHistory = [];
        this.maxHistorySize = 10;
        this.init();
    }

    /**
     * Initialize sleep tracker
     */
    init() {
        this.bindEvents();
        this.setDefaultValues();
        this.loadSleepHistory();
        this.updateDashboard();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Sleep form submission
        const sleepForm = document.getElementById('sleep-form');
        if (sleepForm) {
            sleepForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSleepFormSubmit();
            });
        }

        // Quick action buttons
        const quickWakeBtn = document.getElementById('quick-wake');
        const quickSleepBtn = document.getElementById('quick-sleep');

        if (quickWakeBtn) {
            quickWakeBtn.addEventListener('click', () => {
                this.quickRecordWake();
            });
        }

        if (quickSleepBtn) {
            quickSleepBtn.addEventListener('click', () => {
                this.quickRecordSleep();
            });
        }

        // Sleep date change
        const sleepDateInput = document.getElementById('sleep-date');
        if (sleepDateInput) {
            sleepDateInput.addEventListener('change', () => {
                this.updateSleepTimeSuggestions();
            });
        }

        // Enhanced time input events
        this.bindTimeSliderEvents();
        this.bindQuickTimeButtonEvents();
        this.bindTimeInputEvents();
    }

    /**
     * Bind time slider events
     */
    bindTimeSliderEvents() {
        // Wake time slider
        const wakeTimeSlider = document.getElementById('wake-time-range');
        const wakeTimeInput = document.getElementById('wake-time');
        const wakePreview = document.getElementById('wake-preview');

        if (wakeTimeSlider && wakeTimeInput && wakePreview) {
            wakeTimeSlider.addEventListener('input', (e) => {
                const minutes = parseInt(e.target.value);
                const timeString = this.minutesToTimeString(minutes);
                wakeTimeInput.value = timeString;
                wakePreview.textContent = timeString;
                this.updateSleepDurationPreview();
            });

            // Initialize slider with input value
            const initialWakeTime = wakeTimeInput.value || '06:00';
            const initialWakeMinutes = this.timeStringToMinutes(initialWakeTime);
            wakeTimeSlider.value = initialWakeMinutes;
            wakePreview.textContent = initialWakeTime;
        }

        // Sleep time slider
        const sleepTimeSlider = document.getElementById('sleep-time-range');
        const sleepTimeInput = document.getElementById('sleep-time');
        const sleepPreview = document.getElementById('sleep-preview');

        if (sleepTimeSlider && sleepTimeInput && sleepPreview) {
            sleepTimeSlider.addEventListener('input', (e) => {
                const minutes = parseInt(e.target.value);
                const timeString = this.minutesToTimeString(minutes);
                sleepTimeInput.value = timeString;
                sleepPreview.textContent = timeString;
                this.updateSleepDurationPreview();
            });

            // Initialize slider with input value
            const initialSleepTime = sleepTimeInput.value || '22:00';
            const initialSleepMinutes = this.timeStringToMinutes(initialSleepTime);
            sleepTimeSlider.value = initialSleepMinutes;
            sleepPreview.textContent = initialSleepTime;
        }
    }

    /**
     * Bind quick time button events
     */
    bindQuickTimeButtonEvents() {
        // Wake time quick buttons
        const wakeQuickButtons = document.querySelectorAll('#wake-quick-times .btn-quick-time');
        wakeQuickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const timeValue = e.target.dataset.time;
                this.setWakeTime(timeValue);

                // Update active state
                wakeQuickButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Sleep time quick buttons
        const sleepQuickButtons = document.querySelectorAll('#sleep-quick-times .btn-quick-time');
        sleepQuickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const timeValue = e.target.dataset.time;
                this.setSleepTime(timeValue);

                // Update active state
                sleepQuickButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    /**
     * Bind time input events for real-time updates
     */
    bindTimeInputEvents() {
        const wakeTimeInput = document.getElementById('wake-time');
        const sleepTimeInput = document.getElementById('sleep-time');

        if (wakeTimeInput) {
            wakeTimeInput.addEventListener('input', (e) => {
                const timeValue = e.target.value;
                if (Utils.isValidTimeFormat(timeValue)) {
                    this.updateWakeTimeSlider(timeValue);
                    this.updateSleepDurationPreview();
                }
            });

            wakeTimeInput.addEventListener('change', (e) => {
                this.updateQuickTimeButtonStates('wake', e.target.value);
            });
        }

        if (sleepTimeInput) {
            sleepTimeInput.addEventListener('input', (e) => {
                const timeValue = e.target.value;
                if (Utils.isValidTimeFormat(timeValue)) {
                    this.updateSleepTimeSlider(timeValue);
                    this.updateSleepDurationPreview();
                }
            });

            sleepTimeInput.addEventListener('change', (e) => {
                this.updateQuickTimeButtonStates('sleep', e.target.value);
            });
        }

        // Reset button
        const resetBtn = document.getElementById('sleep-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
                this.updateSleepDurationPreview();
            });
        }
    }

    /**
     * Set wake time and update all related elements
     */
    setWakeTime(timeString) {
        const wakeTimeInput = document.getElementById('wake-time');
        const wakePreview = document.getElementById('wake-preview');

        if (wakeTimeInput) {
            wakeTimeInput.value = timeString;
            this.updateWakeTimeSlider(timeString);
        }

        if (wakePreview) {
            wakePreview.textContent = timeString;
        }

        this.updateSleepDurationPreview();
    }

    /**
     * Set sleep time and update all related elements
     */
    setSleepTime(timeString) {
        const sleepTimeInput = document.getElementById('sleep-time');
        const sleepPreview = document.getElementById('sleep-preview');

        if (sleepTimeInput) {
            sleepTimeInput.value = timeString;
            this.updateSleepTimeSlider(timeString);
        }

        if (sleepPreview) {
            sleepPreview.textContent = timeString;
        }

        this.updateSleepDurationPreview();
    }

    /**
     * Update wake time slider position
     */
    updateWakeTimeSlider(timeString) {
        const wakeTimeSlider = document.getElementById('wake-time-range');
        if (wakeTimeSlider && Utils.isValidTimeFormat(timeString)) {
            const minutes = this.timeStringToMinutes(timeString);
            wakeTimeSlider.value = minutes;
        }
    }

    /**
     * Update sleep time slider position
     */
    updateSleepTimeSlider(timeString) {
        const sleepTimeSlider = document.getElementById('sleep-time-range');
        if (sleepTimeSlider && Utils.isValidTimeFormat(timeString)) {
            const minutes = this.timeStringToMinutes(timeString);
            sleepTimeSlider.value = minutes;
        }
    }

    /**
     * Update quick time button active states
     */
    updateQuickTimeButtonStates(type, timeString) {
        const buttonSelector = type === 'wake' ? '#wake-quick-times' : '#sleep-quick-times';
        const buttons = document.querySelectorAll(`${buttonSelector} .btn-quick-time`);

        buttons.forEach(button => {
            if (button.dataset.time === timeString) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Update sleep duration preview in real-time
     */
    updateSleepDurationPreview() {
        const wakeTimeInput = document.getElementById('wake-time');
        const sleepTimeInput = document.getElementById('sleep-time');
        const durationPreview = document.querySelector('.duration-value');

        if (wakeTimeInput && sleepTimeInput && durationPreview) {
            const wakeTime = wakeTimeInput.value;
            const sleepTime = sleepTimeInput.value;

            if (Utils.isValidTimeFormat(wakeTime) && Utils.isValidTimeFormat(sleepTime)) {
                const duration = this.calculateSleepDuration(wakeTime, sleepTime);
                if (duration !== null) {
                    const hours = Math.floor(duration);
                    const minutes = Math.round((duration - hours) * 60);

                    let durationText = '';
                    if (hours > 0) {
                        durationText += `${hours}小时`;
                    }
                    if (minutes > 0) {
                        durationText += `${minutes}分钟`;
                    }
                    if (durationText === '') {
                        durationText = '0分钟';
                    }

                    durationPreview.textContent = durationText;

                    // Add visual feedback for duration quality
                    const durationDisplay = document.querySelector('.sleep-duration-display');
                    if (durationDisplay) {
                        durationDisplay.className = 'sleep-duration-display';
                        if (duration >= 7 && duration <= 9) {
                            durationDisplay.classList.add('good-duration');
                        } else if (duration < 3) {
                            durationDisplay.classList.add('conflict-duration');
                        } else if (duration < 6 || duration > 10) {
                            durationDisplay.classList.add('poor-duration');
                        }
                    }

                    // Add conflict warning
                    if (duration < 3 || duration > 16) {
                        this.showTimeConflictWarning(duration < 3 ? '过短' : '过长');
                    }
                } else {
                    durationPreview.textContent = '时间冲突';
                    this.showTimeConflictWarning('冲突');
                }
            } else {
                durationPreview.textContent = '请输入有效时间';
            }
        }
    }

    /**
     * Show time conflict warning
     */
    showTimeConflictWarning(type) {
        // Remove existing warning
        const existingWarning = document.querySelector('.time-conflict-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // Create warning message
        const warningDiv = document.createElement('div');
        warningDiv.className = 'time-conflict-warning';

        if (type === '冲突') {
            warningDiv.innerHTML = '⚠️ 时间冲突：起床时间不能等于睡觉时间';
        } else if (type === '过短') {
            warningDiv.innerHTML = '⚠️ 睡眠时间过短，请检查时间是否正确';
        } else if (type === '过长') {
            warningDiv.innerHTML = '⚠️ 睡眠时间过长，请检查时间是否正确';
        }

        // Insert warning after duration display
        const durationDisplay = document.querySelector('.sleep-duration-display');
        if (durationDisplay && type !== '正常') {
            durationDisplay.parentNode.insertBefore(warningDiv, durationDisplay.nextSibling);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.remove();
                }
            }, 5000);
        }
    }

    /**
     * Convert time string (HH:MM) to minutes since midnight
     */
    timeStringToMinutes(timeString) {
        if (!Utils.isValidTimeFormat(timeString)) {
            return 0;
        }

        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convert minutes since midnight to time string (HH:MM)
     */
    minutesToTimeString(minutes) {
        if (minutes < 0 || minutes >= 1440) {
            return '00:00';
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Calculate sleep duration in hours
     */
    calculateSleepDuration(wakeTime, sleepTime) {
        if (!Utils.isValidTimeFormat(wakeTime) || !Utils.isValidTimeFormat(sleepTime)) {
            return null;
        }

        const wakeMinutes = this.timeStringToMinutes(wakeTime);
        const sleepMinutes = this.timeStringToMinutes(sleepTime);

        // Handle cross-midnight sleep
        let duration;
        if (wakeMinutes > sleepMinutes) {
            // Sleep across midnight (e.g., sleep 23:00, wake 07:00)
            duration = (24 * 60 - sleepMinutes) + wakeMinutes;
        } else if (wakeMinutes < sleepMinutes) {
            // Same day sleep (unlikely but possible for naps)
            duration = wakeMinutes - sleepMinutes;
        } else {
            // Same time - invalid or zero duration
            return null;
        }

        return duration / 60; // Convert to hours
    }

    /**
     * Set default form values
     */
    setDefaultValues() {
        const today = Utils.getToday();
        const currentTime = Utils.getCurrentTime();
        const sleepDateInput = document.getElementById('sleep-date');
        const wakeTimeInput = document.getElementById('wake-time');
        const sleepTimeInput = document.getElementById('sleep-time');

        if (sleepDateInput && !sleepDateInput.value) {
            sleepDateInput.value = today;
        }

        // Set wake time to current time if it's morning (before 12 PM)
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12 && wakeTimeInput && !wakeTimeInput.value) {
            wakeTimeInput.value = currentTime;
        }

        // Set sleep time to current time if it's evening (after 8 PM)
        if (currentHour >= 20 || currentHour < 2 && sleepTimeInput && !sleepTimeInput.value) {
            sleepTimeInput.value = currentTime;
        }

        // Initialize duration preview
        this.updateSleepDurationPreview();
    }

    /**
     * Handle sleep form submission
     */
    handleSleepFormSubmit() {
        const form = document.getElementById('sleep-form');
        const formData = new FormData(form);

        const sleepRecord = {
            date: formData.get('sleep-date') || document.getElementById('sleep-date').value,
            wakeTime: formData.get('wake-time') || document.getElementById('wake-time').value,
            sleepTime: formData.get('sleep-time') || document.getElementById('sleep-time').value
        };

        // Validate form data
        if (!this.validateSleepRecord(sleepRecord)) {
            return;
        }

        try {
            let savedRecord;
            if (this.currentEditId) {
                // Store original record for undo
                const originalRecord = storage.getSleepData().find(r => r.id === this.currentEditId);
                if (originalRecord) {
                    this.addToHistory({
                        action: 'update',
                        recordId: this.currentEditId,
                        originalData: { ...originalRecord },
                        timestamp: new Date().toISOString()
                    });
                }

                // Update existing record
                savedRecord = storage.updateSleepRecord(this.currentEditId, sleepRecord);
                if (savedRecord) {
                    Components.showNotification('睡眠记录更新成功', 'success');
                }
            } else {
                // Add new record
                savedRecord = storage.addSleepRecord(sleepRecord);
                if (savedRecord) {
                    Components.showNotification('睡眠记录添加成功', 'success');
                }
            }

            if (savedRecord) {
                this.resetForm();
                this.loadSleepHistory();
                this.updateDashboard();
            }
        } catch (error) {
            console.error('Error saving sleep record:', error);
            Components.showNotification('保存失败，请重试', 'error');
        }
    }

    /**
     * Validate sleep record
     */
    validateSleepRecord(record) {
        const errors = [];

        // Check if all fields are filled
        if (!record.date) {
            errors.push('请选择日期');
        }
        if (!record.wakeTime) {
            errors.push('请输入起床时间');
        }
        if (!record.sleepTime) {
            errors.push('请输入睡觉时间');
        }

        // Validate formats
        if (record.date && !Utils.isValidDateFormat(record.date)) {
            errors.push('日期格式无效');
        }
        if (record.wakeTime && !Utils.isValidTimeFormat(record.wakeTime)) {
            errors.push('起床时间格式无效');
        }
        if (record.sleepTime && !Utils.isValidTimeFormat(record.sleepTime)) {
            errors.push('睡觉时间格式无效');
        }

        // Time conflict detection
        if (record.wakeTime && record.sleepTime && Utils.isValidTimeFormat(record.wakeTime) && Utils.isValidTimeFormat(record.sleepTime)) {
            const duration = this.calculateSleepDuration(record.wakeTime, record.sleepTime);
            if (duration === null) {
                errors.push('时间组合无效：起床时间不能等于睡觉时间');
            } else if (duration < 3) {
                errors.push('睡眠时间过短，请检查时间是否正确');
            } else if (duration > 16) {
                errors.push('睡眠时间过长，请检查时间是否正确');
            }
        }

        if (errors.length > 0) {
            Components.showNotification(errors[0], 'error');
            return false;
        }

        return true;
    }

    /**
     * Quick record wake time
     */
    quickRecordWake() {
        const today = Utils.getToday();
        const currentTime = Utils.getCurrentTime();

        // Check if there's already a wake record for today
        const todayRecords = storage.getSleepData().filter(record => record.date === today);
        const existingRecord = todayRecords.find(record => record.wakeTime);

        if (existingRecord) {
            Components.confirmAction(
                '今天已经记录了起床时间，是否要更新？',
                () => {
                    this.quickUpdateWakeTime(existingRecord.id, currentTime);
                }
            );
        } else {
            // Create new record or update existing one without wake time
            const sleepRecord = {
                date: today,
                wakeTime: currentTime,
                sleepTime: '22:00' // Default sleep time
            };

            const savedRecord = storage.addSleepRecord(sleepRecord);
            if (savedRecord) {
                Components.showNotification('起床时间记录成功', 'success');
                this.loadSleepHistory();
                this.updateDashboard();
            }
        }
    }

    /**
     * Quick record sleep time
     */
    quickRecordSleep() {
        const today = Utils.getToday();
        const currentTime = Utils.getCurrentTime();

        // Check if there's already a sleep record for today
        const todayRecords = storage.getSleepData().filter(record => record.date === today);
        let existingRecord = todayRecords.find(record => record.sleepTime);

        // If current time is after midnight, it belongs to previous day
        const currentHour = new Date().getHours();
        let targetDate = today;
        if (currentHour < 4) {
            // It's after midnight, so it belongs to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = Utils.formatDate(yesterday);
            existingRecord = storage.getSleepData().find(record =>
                record.date === targetDate && record.sleepTime
            );
        }

        if (existingRecord) {
            Components.confirmAction(
                '今天已经记录了睡觉时间，是否要更新？',
                () => {
                    this.quickUpdateSleepTime(existingRecord.id, currentTime);
                }
            );
        } else {
            // Create new record or update existing one without sleep time
            const sleepRecord = {
                date: targetDate,
                wakeTime: '07:00', // Default wake time
                sleepTime: currentTime
            };

            const savedRecord = storage.addSleepRecord(sleepRecord);
            if (savedRecord) {
                Components.showNotification('睡觉时间记录成功', 'success');
                this.loadSleepHistory();
                this.updateDashboard();
            }
        }
    }

    /**
     * Quick update wake time
     */
    quickUpdateWakeTime(id, wakeTime) {
        const updated = storage.updateSleepRecord(id, { wakeTime });
        if (updated) {
            Components.showNotification('起床时间更新成功', 'success');
            this.loadSleepHistory();
            this.updateDashboard();
        }
    }

    /**
     * Quick update sleep time
     */
    quickUpdateSleepTime(id, sleepTime) {
        const updated = storage.updateSleepRecord(id, { sleepTime });
        if (updated) {
            Components.showNotification('睡觉时间更新成功', 'success');
            this.loadSleepHistory();
            this.updateDashboard();
        }
    }

    /**
     * Update sleep time suggestions based on selected date
     */
    updateSleepTimeSuggestions() {
        const sleepDateInput = document.getElementById('sleep-date');
        const selectedDate = sleepDateInput.value;
        const today = Utils.getToday();

        if (selectedDate === today) {
            // If today, suggest current time for appropriate periods
            const currentHour = new Date().getHours();
            const wakeTimeInput = document.getElementById('wake-time');
            const sleepTimeInput = document.getElementById('sleep-time');
            const currentTime = Utils.getCurrentTime();

            if (currentHour >= 5 && currentHour < 12 && !wakeTimeInput.value) {
                wakeTimeInput.value = currentTime;
            }
            if (currentHour >= 20 || currentHour < 2 && !sleepTimeInput.value) {
                sleepTimeInput.value = currentTime;
            }
        }
    }

    /**
     * Load sleep history
     */
    loadSleepHistory() {
        const historyContainer = document.getElementById('sleep-history');
        if (!historyContainer) return;

        const sleepData = storage.getSleepData();
        const sortedData = Utils.sortByDate(sleepData, 'date', true); // Most recent first

        if (sortedData.length === 0) {
            historyContainer.innerHTML = Components.createEmptyState(
                '暂无睡眠记录',
                '开始记录您的睡眠时间，帮助您建立良好的作息习惯。',
                '<button class="btn btn-primary" onclick="document.getElementById(\'wake-time\').focus()">记录睡眠</button>'
            );
            return;
        }

        // Show last 7 records
        const recentRecords = sortedData.slice(0, 7);
        historyContainer.innerHTML = recentRecords
            .map(record => Components.createSleepHistoryItem(record))
            .join('');
    }

    /**
     * Update dashboard with sleep information
     */
    updateDashboard() {
        const sleepStatusContainer = document.getElementById('sleep-status');
        if (!sleepStatusContainer) return;

        const today = Utils.getToday();
        const todayRecord = storage.getSleepData().find(record => record.date === today);

        if (todayRecord) {
            let statusHTML = '<div class="sleep-today">';

            if (todayRecord.wakeTime) {
                statusHTML += `<p><strong>起床时间:</strong> ${todayRecord.wakeTime}</p>`;
            }
            if (todayRecord.sleepTime) {
                statusHTML += `<p><strong>睡觉时间:</strong> ${todayRecord.sleepTime}</p>`;
            }
            if (todayRecord.duration) {
                statusHTML += `<p><strong>睡眠时长:</strong> ${Utils.formatDuration(todayRecord.duration)}</p>`;
            }

            if (!todayRecord.wakeTime && !todayRecord.sleepTime) {
                statusHTML = '<p>今日睡眠记录待更新</p>';
            } else if (todayRecord.wakeTime && !todayRecord.sleepTime) {
                statusHTML += '<p style="color: #f59e0b;">晚上记得记录睡觉时间哦</p>';
            } else if (!todayRecord.wakeTime && todayRecord.sleepTime) {
                statusHTML += '<p style="color: #3b82f6;">明天记得记录起床时间哦</p>';
            } else {
                const durationHours = todayRecord.duration;
                if (durationHours >= 7 && durationHours <= 9) {
                    statusHTML += '<p style="color: #10b981;">✨ 睡眠时长很棒！</p>';
                } else if (durationHours < 6) {
                    statusHTML += '<p style="color: #ef4444;">⚠️ 睡眠不足，注意休息</p>';
                } else if (durationHours > 10) {
                    statusHTML += '<p style="color: #f59e0b;">🌙 睡眠时间较长，可以调整作息</p>';
                } else {
                    statusHTML += '<p style="color: #64748b;">😴 继续保持规律作息</p>';
                }
            }

            statusHTML += '</div>';
            sleepStatusContainer.innerHTML = statusHTML;
        } else {
            sleepStatusContainer.innerHTML = `
                <div class="sleep-today">
                    <p>今日睡眠记录待更新</p>
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-small btn-primary" onclick="sleepTracker.quickRecordWake()">记录起床</button>
                        <button class="btn btn-small btn-secondary" onclick="sleepTracker.quickRecordSleep()">记录睡觉</button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Edit sleep record
     */
    editSleepRecord(id) {
        const record = storage.getSleepData().find(r => r.id === id);
        if (!record) {
            Components.showNotification('找不到该记录', 'error');
            return;
        }

        this.currentEditId = id;
        const form = document.getElementById('sleep-form');
        const dateInput = document.getElementById('sleep-date');
        const wakeTimeInput = document.getElementById('wake-time');
        const sleepTimeInput = document.getElementById('sleep-time');

        // Fill form with record data
        dateInput.value = record.date;
        wakeTimeInput.value = record.wakeTime;
        sleepTimeInput.value = record.sleepTime;

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });

        // Update submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = '更新记录';

        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary';
        cancelButton.textContent = '取消编辑';
        cancelButton.onclick = () => this.cancelEdit();
        submitButton.parentNode.appendChild(cancelButton);

        // Switch to sleep section
        document.querySelector('[data-section="sleep"]').click();
    }

    /**
     * Delete sleep record
     */
    deleteSleepRecord(id) {
        Components.confirmAction(
            '确定要删除这条睡眠记录吗？',
            () => {
                const success = storage.deleteSleepRecord(id);
                if (success) {
                    Components.showNotification('睡眠记录删除成功', 'success');
                    this.loadSleepHistory();
                    this.updateDashboard();
                } else {
                    Components.showNotification('删除失败，请重试', 'error');
                }
            }
        );
    }

    /**
     * Cancel editing
     */
    cancelEdit() {
        this.currentEditId = null;
        this.resetForm();
    }

    /**
     * Reset form to default state
     */
    resetForm() {
        const form = document.getElementById('sleep-form');
        form.reset();
        this.setDefaultValues();
        this.currentEditId = null;

        // Reset submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = '保存记录';

        // Remove cancel button if exists
        const cancelButton = form.querySelector('button[type="button"]');
        if (cancelButton && cancelButton.textContent === '取消编辑') {
            cancelButton.remove();
        }
    }

    /**
     * Get sleep statistics for the last 7 days
     */
    getWeeklySleepStats() {
        const weekRange = Utils.getDateRange(7);
        const weekData = storage.getSleepDataByDateRange(weekRange.start, weekRange.end);

        const stats = {
            totalRecords: weekData.length,
            averageDuration: 0,
            totalSleep: 0,
            recordsWithCompleteData: 0,
            earliestWake: null,
            latestSleep: null,
            sleepPattern: []
        };

        if (weekData.length === 0) {
            return stats;
        }

        const completeRecords = weekData.filter(record => record.duration > 0);
        stats.recordsWithCompleteData = completeRecords.length;

        if (completeRecords.length > 0) {
            stats.totalSleep = completeRecords.reduce((sum, record) => sum + record.duration, 0);
            stats.averageDuration = stats.totalSleep / completeRecords.length;

            // Find earliest wake and latest sleep
            completeRecords.forEach(record => {
                if (!stats.earliestWake || record.wakeTime < stats.earliestWake) {
                    stats.earliestWake = record.wakeTime;
                }
                if (!stats.latestSleep || record.sleepTime > stats.latestSleep) {
                    stats.latestSleep = record.sleepTime;
                }
            });
        }

        return stats;
    }

    /**
     * Get sleep consistency score (0-100)
     */
    getSleepConsistencyScore() {
        const weekData = storage.getSleepDataByDateRange(...Object.values(Utils.getDateRange(7)));
        const completeRecords = weekData.filter(record => record.duration > 0);

        if (completeRecords.length < 3) {
            return null; // Not enough data
        }

        // Calculate variance in sleep duration
        const durations = completeRecords.map(r => r.duration);
        const average = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((sum, duration) => {
            return sum + Math.pow(duration - average, 2);
        }, 0) / durations.length;

        // Convert variance to consistency score (lower variance = higher score)
        const consistencyScore = Math.max(0, 100 - (variance * 10));
        return Math.round(consistencyScore);
    }

    /**
     * Add action to edit history
     */
    addToHistory(action) {
        this.editHistory.unshift(action);
        if (this.editHistory.length > this.maxHistorySize) {
            this.editHistory = this.editHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Undo last action
     */
    undoLastAction() {
        if (this.editHistory.length === 0) {
            Components.showNotification('没有可撤销的操作', 'info');
            return;
        }

        const lastAction = this.editHistory.shift();

        if (lastAction.action === 'update') {
            const success = storage.updateSleepRecord(lastAction.recordId, lastAction.originalData);
            if (success) {
                Components.showNotification('已撤销上次修改', 'success');
                this.loadSleepHistory();
                this.updateDashboard();
            } else {
                Components.showNotification('撤销失败，请重试', 'error');
            }
        }
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.editHistory.length > 0;
    }
}

// Global functions for onclick handlers
window.editSleepRecord = (id) => {
    if (window.sleepTracker) {
        window.sleepTracker.editSleepRecord(id);
    }
};

window.deleteSleepRecord = (id) => {
    if (window.sleepTracker) {
        window.sleepTracker.deleteSleepRecord(id);
    }
};

window.undoLastSleepAction = () => {
    if (window.sleepTracker) {
        window.sleepTracker.undoLastAction();
    }
};

// Initialize sleep tracker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sleepTracker = new SleepTracker();
});