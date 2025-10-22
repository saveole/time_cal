/**
 * Activity Tracker Module
 * Handles all activity tracking and daily planning functionality
 */

class ActivityTracker {
    constructor() {
        this.currentEditId = null;
        this.init();
    }

    /**
     * Initialize activity tracker
     */
    init() {
        this.bindEvents();
        this.setDefaultValues();
        this.loadTodayActivities();
        this.updateDashboard();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Activity form submission
        const activityForm = document.getElementById('activity-form');
        if (activityForm) {
            activityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleActivityFormSubmit();
            });
        }

        // Quick activity button
        const quickActivityBtn = document.getElementById('quick-activity');
        if (quickActivityBtn) {
            quickActivityBtn.addEventListener('click', () => {
                this.showQuickActivityModal();
            });
        }

        // Start/end time validation
        const startTimeInput = document.getElementById('activity-start');
        const endTimeInput = document.getElementById('activity-end');

        if (startTimeInput && endTimeInput) {
            startTimeInput.addEventListener('change', () => {
                this.validateTimeRange();
            });

            endTimeInput.addEventListener('change', () => {
                this.validateTimeRange();
            });
        }
    }

    /**
     * Set default form values
     */
    setDefaultValues() {
        const now = new Date();
        const currentDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        const startTimeInput = document.getElementById('activity-start');
        const endTimeInput = document.getElementById('activity-end');

        if (startTimeInput && !startTimeInput.value) {
            startTimeInput.value = currentDateTime;
        }

        // Set end time to 1 hour after start time
        if (endTimeInput && !endTimeInput.value && startTimeInput && startTimeInput.value) {
            const endTime = new Date(startTimeInput.value);
            endTime.setHours(endTime.getHours() + 1);
            endTimeInput.value = endTime.toISOString().slice(0, 16);
        }
    }

    /**
     * Handle activity form submission
     */
    handleActivityFormSubmit() {
        const form = document.getElementById('activity-form');
        const formData = new FormData(form);

        const activityRecord = {
            name: formData.get('activity-name') || document.getElementById('activity-name').value,
            category: formData.get('activity-category') || document.getElementById('activity-category').value,
            startTime: formData.get('activity-start') || document.getElementById('activity-start').value,
            endTime: formData.get('activity-end') || document.getElementById('activity-end').value,
            description: formData.get('activity-description') || document.getElementById('activity-description').value
        };

        // Validate form data
        if (!this.validateActivityRecord(activityRecord)) {
            return;
        }

        try {
            let savedRecord;
            if (this.currentEditId) {
                // Update existing record
                savedRecord = storage.updateActivityRecord(this.currentEditId, activityRecord);
                if (savedRecord) {
                    Components.showNotification('活动记录更新成功', 'success');
                }
            } else {
                // Add new record
                savedRecord = storage.addActivityRecord(activityRecord);
                if (savedRecord) {
                    Components.showNotification('活动记录添加成功', 'success');
                }
            }

            if (savedRecord) {
                this.resetForm();
                this.loadTodayActivities();
                this.updateDashboard();
            }
        } catch (error) {
            console.error('Error saving activity record:', error);
            Components.showNotification('保存失败，请重试', 'error');
        }
    }

    /**
     * Validate activity record
     */
    validateActivityRecord(record) {
        const errors = [];

        // Check required fields
        if (!record.name || record.name.trim() === '') {
            errors.push('请输入活动名称');
        }
        if (!record.category) {
            errors.push('请选择活动类别');
        }
        if (!record.startTime) {
            errors.push('请选择开始时间');
        }
        if (!record.endTime) {
            errors.push('请选择结束时间');
        }

        // Validate datetime formats
        if (record.startTime && !Utils.isValidDateTime(record.startTime)) {
            errors.push('开始时间格式无效');
        }
        if (record.endTime && !Utils.isValidDateTime(record.endTime)) {
            errors.push('结束时间格式无效');
        }

        // Validate time range
        if (record.startTime && record.endTime) {
            const start = new Date(record.startTime);
            const end = new Date(record.endTime);
            if (start >= end) {
                errors.push('结束时间必须晚于开始时间');
            }

            // Check if duration is reasonable (not more than 24 hours)
            const durationHours = (end - start) / (1000 * 60 * 60);
            if (durationHours > 24) {
                errors.push('活动时长不能超过24小时');
            }
        }

        if (errors.length > 0) {
            Components.showNotification(errors[0], 'error');
            return false;
        }

        return true;
    }

    /**
     * Validate time range in real-time
     */
    validateTimeRange() {
        const startTimeInput = document.getElementById('activity-start');
        const endTimeInput = document.getElementById('activity-end');

        if (!startTimeInput.value || !endTimeInput.value) {
            return;
        }

        const start = new Date(startTimeInput.value);
        const end = new Date(endTimeInput.value);

        if (start >= end) {
            Components.showNotification('结束时间必须晚于开始时间', 'error');
            endTimeInput.classList.add('error');
        } else {
            endTimeInput.classList.remove('error');
        }
    }

    /**
     * Show quick activity modal
     */
    showQuickActivityModal() {
        const modalContent = `
            <form id="quick-activity-form" class="form">
                <div class="form-group">
                    <label for="quick-activity-name">活动名称</label>
                    <input type="text" id="quick-activity-name" class="form-input" placeholder="例如：编程、读书、运动" required>
                </div>
                <div class="form-group">
                    <label for="quick-activity-category">活动类别</label>
                    <select id="quick-activity-category" class="form-select" required>
                        <option value="">选择类别</option>
                        <option value="work">工作</option>
                        <option value="personal">个人</option>
                        <option value="leisure">休闲</option>
                        <option value="exercise">运动</option>
                        <option value="learning">学习</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="quick-activity-duration">活动时长（小时）</label>
                    <input type="number" id="quick-activity-duration" class="form-input" min="0.25" max="24" step="0.25" value="1" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="quick-activity-start-now" checked>
                        立即开始
                    </label>
                </div>
            </form>
        `;

        const modal = Components.showModal('快速记录活动', modalContent, {
            footer: `
                <button class="btn btn-secondary" onclick="Components.closeModal(this.closest('.modal'))">取消</button>
                <button class="btn btn-primary" onclick="activityTracker.handleQuickActivitySubmit()">开始记录</button>
            `
        });

        // Set default values
        setTimeout(() => {
            const nameInput = document.getElementById('quick-activity-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    /**
     * Handle quick activity submission
     */
    handleQuickActivitySubmit() {
        const nameInput = document.getElementById('quick-activity-name');
        const categoryInput = document.getElementById('quick-activity-category');
        const durationInput = document.getElementById('quick-activity-duration');
        const startNowInput = document.getElementById('quick-activity-start-now');

        const name = nameInput.value.trim();
        const category = categoryInput.value;
        const duration = parseFloat(durationInput.value);
        const startNow = startNowInput.checked;

        if (!name) {
            Components.showNotification('请输入活动名称', 'error');
            return;
        }

        if (!category) {
            Components.showNotification('请选择活动类别', 'error');
            return;
        }

        if (!duration || duration <= 0 || duration > 24) {
            Components.showNotification('请输入有效的活动时长', 'error');
            return;
        }

        const now = new Date();
        const startTime = startNow ? now.toISOString() : new Date(now.getTime() - duration * 60 * 60 * 1000).toISOString();
        const endTime = startNow ? new Date(now.getTime() + duration * 60 * 60 * 1000).toISOString() : now.toISOString();

        const activityRecord = {
            name,
            category,
            startTime,
            endTime,
            description: ''
        };

        const savedRecord = storage.addActivityRecord(activityRecord);
        if (savedRecord) {
            Components.showNotification('活动记录添加成功', 'success');
            Components.closeModal(document.querySelector('.modal.active'));
            this.loadTodayActivities();
            this.updateDashboard();
        } else {
            Components.showNotification('保存失败，请重试', 'error');
        }
    }

    /**
     * Load today's activities
     */
    loadTodayActivities() {
        const todayContainer = document.getElementById('today-activities');
        if (!todayContainer) return;

        const today = Utils.getToday();
        const todayActivities = storage.getActivitiesByDate(today);
        const sortedActivities = Utils.sortByDate(todayActivities, 'startTime');

        if (sortedActivities.length === 0) {
            todayContainer.innerHTML = Components.createEmptyState(
                '暂无今日活动',
                '开始记录您的活动，了解您的时间分配情况。',
                '<button class="btn btn-primary" onclick="activityTracker.showQuickActivityModal()">记录活动</button>'
            );
            return;
        }

        todayContainer.innerHTML = sortedActivities
            .map(activity => Components.createActivityItem(activity))
            .join('');
    }

    /**
     * Update dashboard with activity information
     */
    updateDashboard() {
        const workTimeContainer = document.getElementById('work-time');
        const freeTimeContainer = document.getElementById('free-time');
        const progressContainer = document.getElementById('daily-progress');

        const today = Utils.getToday();
        const todayActivities = storage.getActivitiesByDate(today);
        const goals = storage.getGoals();

        // Calculate work and free time
        let workHours = 0;
        let freeHours = 0;

        todayActivities.forEach(activity => {
            if (activity.category === 'work') {
                workHours += activity.duration;
            } else {
                freeHours += activity.duration;
            }
        });

        // Update work time display
        if (workTimeContainer) {
            workTimeContainer.querySelector('.time-value').textContent = workHours.toFixed(1);
        }

        // Update free time display
        if (freeTimeContainer) {
            freeTimeContainer.querySelector('.time-value').textContent = freeHours.toFixed(1);
        }

        // Update progress display
        if (progressContainer && goals.dailyWorkHours > 0) {
            const workProgress = Utils.calculatePercentage(workHours, goals.dailyWorkHours);
            const progressFill = progressContainer.querySelector('.progress-fill');
            const progressText = progressContainer.querySelector('.progress-text');

            progressFill.style.width = `${Math.min(workProgress, 100)}%`;
            progressText.textContent = `${workProgress}% 完成`;

            // Change color based on progress
            if (workProgress >= 100) {
                progressFill.style.backgroundColor = '#10b981'; // Green
            } else if (workProgress >= 75) {
                progressFill.style.backgroundColor = '#3b82f6'; // Blue
            } else if (workProgress >= 50) {
                progressFill.style.backgroundColor = '#f59e0b'; // Yellow
            } else {
                progressFill.style.backgroundColor = '#ef4444'; // Red
            }
        }
    }

    /**
     * Edit activity
     */
    editActivity(id) {
        const record = storage.getActivityData().find(r => r.id === id);
        if (!record) {
            Components.showNotification('找不到该活动记录', 'error');
            return;
        }

        this.currentEditId = id;
        const form = document.getElementById('activity-form');
        const nameInput = document.getElementById('activity-name');
        const categoryInput = document.getElementById('activity-category');
        const startTimeInput = document.getElementById('activity-start');
        const endTimeInput = document.getElementById('activity-end');
        const descriptionInput = document.getElementById('activity-description');

        // Fill form with record data
        nameInput.value = record.name;
        categoryInput.value = record.category;
        startTimeInput.value = record.startTime.slice(0, 16); // Format for datetime-local input
        endTimeInput.value = record.endTime.slice(0, 16);
        descriptionInput.value = record.description || '';

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });

        // Update submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = '更新活动';

        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary';
        cancelButton.textContent = '取消编辑';
        cancelButton.onclick = () => this.cancelEdit();
        submitButton.parentNode.appendChild(cancelButton);

        // Switch to activities section
        document.querySelector('[data-section="activities"]').click();
    }

    /**
     * Delete activity
     */
    deleteActivity(id) {
        Components.confirmAction(
            '确定要删除这条活动记录吗？',
            () => {
                const success = storage.deleteActivityRecord(id);
                if (success) {
                    Components.showNotification('活动记录删除成功', 'success');
                    this.loadTodayActivities();
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
        const form = document.getElementById('activity-form');
        form.reset();
        this.setDefaultValues();
        this.currentEditId = null;

        // Reset submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = '保存活动';

        // Remove cancel button if exists
        const cancelButton = form.querySelector('button[type="button"]');
        if (cancelButton && cancelButton.textContent === '取消编辑') {
            cancelButton.remove();
        }

        // Remove error states
        const errorElements = form.querySelectorAll('.error');
        errorElements.forEach(element => element.classList.remove('error'));
    }

    /**
     * Get activity statistics for the last 7 days
     */
    getWeeklyActivityStats() {
        const weekRange = Utils.getDateRange(7);
        const weekActivities = storage.getActivitiesByDateRange(weekRange.start, weekRange.end);

        const stats = {
            totalActivities: weekActivities.length,
            totalHours: 0,
            workHours: 0,
            freeHours: 0,
            categoryBreakdown: {},
            dailyBreakdown: {},
            mostProductiveDay: null,
            mostFrequentCategory: null
        };

        weekActivities.forEach(activity => {
            const date = Utils.formatDate(activity.startTime);
            const duration = activity.duration;

            stats.totalHours += duration;

            if (activity.category === 'work') {
                stats.workHours += duration;
            } else {
                stats.freeHours += duration;
            }

            // Category breakdown
            if (!stats.categoryBreakdown[activity.category]) {
                stats.categoryBreakdown[activity.category] = 0;
            }
            stats.categoryBreakdown[activity.category] += duration;

            // Daily breakdown
            if (!stats.dailyBreakdown[date]) {
                stats.dailyBreakdown[date] = 0;
            }
            stats.dailyBreakdown[date] += duration;
        });

        // Find most productive day
        let maxHours = 0;
        Object.entries(stats.dailyBreakdown).forEach(([date, hours]) => {
            if (hours > maxHours) {
                maxHours = hours;
                stats.mostProductiveDay = date;
            }
        });

        // Find most frequent category
        let maxCategoryHours = 0;
        Object.entries(stats.categoryBreakdown).forEach(([category, hours]) => {
            if (hours > maxCategoryHours) {
                maxCategoryHours = hours;
                stats.mostFrequentCategory = category;
            }
        });

        return stats;
    }

    /**
     * Get daily goal progress
     */
    getDailyGoalProgress() {
        const today = Utils.getToday();
        const todayActivities = storage.getActivitiesByDate(today);
        const goals = storage.getGoals();

        const progress = {
            workHours: 0,
            workGoal: goals.dailyWorkHours,
            workProgress: 0,
            exerciseHours: 0,
            exerciseGoal: goals.weeklyExerciseHours / 7, // Daily portion
            exerciseProgress: 0,
            learningHours: 0,
            learningGoal: goals.dailyLearningHours,
            learningProgress: 0
        };

        todayActivities.forEach(activity => {
            if (activity.category === 'work') {
                progress.workHours += activity.duration;
            } else if (activity.category === 'exercise') {
                progress.exerciseHours += activity.duration;
            } else if (activity.category === 'learning') {
                progress.learningHours += activity.duration;
            }
        });

        progress.workProgress = Utils.calculatePercentage(progress.workHours, progress.workGoal);
        progress.exerciseProgress = Utils.calculatePercentage(progress.exerciseHours, progress.exerciseGoal);
        progress.learningProgress = Utils.calculatePercentage(progress.learningHours, progress.learningGoal);

        return progress;
    }

    /**
     * Start activity timer (for future enhancement)
     */
    startActivityTimer(activityData) {
        // This could be implemented in the future to track real-time activities
        // For now, we use manual time entry
        Components.showNotification('计时功能即将推出', 'info');
    }
}

// Global functions for onclick handlers
window.editActivity = (id) => {
    if (window.activityTracker) {
        window.activityTracker.editActivity(id);
    }
};

window.deleteActivity = (id) => {
    if (window.activityTracker) {
        window.activityTracker.deleteActivity(id);
    }
};

// Initialize activity tracker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.activityTracker = new ActivityTracker();
});