/**
 * Storage Management Module
 * Handles all local storage operations for the time management system
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            SLEEP_DATA: 'timecal_sleep_data',
            ACTIVITY_DATA: 'timecal_activity_data',
            USER_PREFERENCES: 'timecal_user_preferences',
            GOALS: 'timecal_goals',
            VERSION: 'timecal_version'
        };

        this.CURRENT_VERSION = '1.0.0';
        this.init();
    }

    /**
     * Initialize storage and check for migrations
     */
    init() {
        this.checkVersion();
        this.migrateData();
    }

    /**
     * Check current version and handle migrations
     */
    checkVersion() {
        const storedVersion = this.getItem(this.STORAGE_KEYS.VERSION);
        if (storedVersion !== this.CURRENT_VERSION) {
            console.log(`Migrating from version ${storedVersion} to ${this.CURRENT_VERSION}`);
            this.setItem(this.STORAGE_KEYS.VERSION, this.CURRENT_VERSION);
        }
    }

    /**
     * Migrate data between versions if needed
     */
    migrateData() {
        // Future migration logic will go here
        // For now, just ensure all data structures exist
        this.ensureDataStructures();
    }

    /**
     * Ensure all required data structures exist
     */
    ensureDataStructures() {
        if (!this.getItem(this.STORAGE_KEYS.SLEEP_DATA)) {
            this.setItem(this.STORAGE_KEYS.SLEEP_DATA, []);
        }
        if (!this.getItem(this.STORAGE_KEYS.ACTIVITY_DATA)) {
            this.setItem(this.STORAGE_KEYS.ACTIVITY_DATA, []);
        }
        if (!this.getItem(this.STORAGE_KEYS.USER_PREFERENCES)) {
            this.setItem(this.STORAGE_KEYS.USER_PREFERENCES, this.getDefaultPreferences());
        }
        if (!this.getItem(this.STORAGE_KEYS.GOALS)) {
            this.setItem(this.STORAGE_KEYS.GOALS, this.getDefaultGoals());
        }
    }

    /**
     * Get default user preferences
     */
    getDefaultPreferences() {
        return {
            theme: 'light',
            language: 'zh-CN',
            defaultWorkDayHours: 8,
            defaultSleepHours: 8,
            notifications: true,
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h'
        };
    }

    /**
     * Get default goals
     */
    getDefaultGoals() {
        return {
            dailyWorkHours: 8,
            weeklyWorkHours: 40,
            dailySleepHours: 8,
            weeklyExerciseHours: 5,
            dailyLearningHours: 1
        };
    }

    /**
     * Generic get item from localStorage
     */
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error getting item ${key}:`, error);
            return null;
        }
    }

    /**
     * Generic set item to localStorage
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting item ${key}:`, error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing item ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all app data from localStorage
     */
    clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            this.removeItem(key);
        });
        this.init(); // Reinitialize with default data
    }

    // ===== Sleep Data Operations =====

    /**
     * Get all sleep records
     */
    getSleepData() {
        return this.getItem(this.STORAGE_KEYS.SLEEP_DATA) || [];
    }

    /**
     * Add a new sleep record
     */
    addSleepRecord(sleepRecord) {
        const sleepData = this.getSleepData();
        const newRecord = {
            id: this.generateId(),
            date: sleepRecord.date,
            wakeTime: sleepRecord.wakeTime,
            sleepTime: sleepRecord.sleepTime,
            duration: this.calculateSleepDuration(sleepRecord.wakeTime, sleepRecord.sleepTime),
            createdAt: new Date().toISOString()
        };

        sleepData.push(newRecord);
        return this.setItem(this.STORAGE_KEYS.SLEEP_DATA, sleepData) ? newRecord : null;
    }

    /**
     * Update an existing sleep record
     */
    updateSleepRecord(id, updates) {
        const sleepData = this.getSleepData();
        const index = sleepData.findIndex(record => record.id === id);

        if (index !== -1) {
            sleepData[index] = { ...sleepData[index], ...updates };
            if (updates.wakeTime || updates.sleepTime) {
                sleepData[index].duration = this.calculateSleepDuration(
                    sleepData[index].wakeTime,
                    sleepData[index].sleepTime
                );
            }
            sleepData[index].updatedAt = new Date().toISOString();
            return this.setItem(this.STORAGE_KEYS.SLEEP_DATA, sleepData) ? sleepData[index] : null;
        }

        return null;
    }

    /**
     * Delete a sleep record
     */
    deleteSleepRecord(id) {
        const sleepData = this.getSleepData();
        const filteredData = sleepData.filter(record => record.id !== id);
        return this.setItem(this.STORAGE_KEYS.SLEEP_DATA, filteredData);
    }

    /**
     * Get sleep records for a date range
     */
    getSleepDataByDateRange(startDate, endDate) {
        const sleepData = this.getSleepData();
        return sleepData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
    }

    // ===== Activity Data Operations =====

    /**
     * Get all activity records
     */
    getActivityData() {
        return this.getItem(this.STORAGE_KEYS.ACTIVITY_DATA) || [];
    }

    /**
     * Add a new activity record
     */
    addActivityRecord(activityRecord) {
        const activityData = this.getActivityData();
        const newRecord = {
            id: this.generateId(),
            name: activityRecord.name,
            category: activityRecord.category,
            startTime: activityRecord.startTime,
            endTime: activityRecord.endTime,
            duration: this.calculateActivityDuration(activityRecord.startTime, activityRecord.endTime),
            description: activityRecord.description || '',
            createdAt: new Date().toISOString()
        };

        activityData.push(newRecord);
        return this.setItem(this.STORAGE_KEYS.ACTIVITY_DATA, activityData) ? newRecord : null;
    }

    /**
     * Update an existing activity record
     */
    updateActivityRecord(id, updates) {
        const activityData = this.getActivityData();
        const index = activityData.findIndex(record => record.id === id);

        if (index !== -1) {
            activityData[index] = { ...activityData[index], ...updates };
            if (updates.startTime || updates.endTime) {
                activityData[index].duration = this.calculateActivityDuration(
                    activityData[index].startTime,
                    activityData[index].endTime
                );
            }
            activityData[index].updatedAt = new Date().toISOString();
            return this.setItem(this.STORAGE_KEYS.ACTIVITY_DATA, activityData) ? activityData[index] : null;
        }

        return null;
    }

    /**
     * Delete an activity record
     */
    deleteActivityRecord(id) {
        const activityData = this.getActivityData();
        const filteredData = activityData.filter(record => record.id !== id);
        return this.setItem(this.STORAGE_KEYS.ACTIVITY_DATA, filteredData);
    }

    /**
     * Get activities for a specific date
     */
    getActivitiesByDate(date) {
        const activityData = this.getActivityData();
        return activityData.filter(record => {
            const recordDate = new Date(record.startTime).toDateString();
            return recordDate === new Date(date).toDateString();
        });
    }

    /**
     * Get activities for a date range
     */
    getActivitiesByDateRange(startDate, endDate) {
        const activityData = this.getActivityData();
        return activityData.filter(record => {
            const recordDate = new Date(record.startTime);
            return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
    }

    /**
     * Get activities by category
     */
    getActivitiesByCategory(category) {
        const activityData = this.getActivityData();
        return activityData.filter(record => record.category === category);
    }

    // ===== Goals Operations =====

    /**
     * Get current goals
     */
    getGoals() {
        return this.getItem(this.STORAGE_KEYS.GOALS) || this.getDefaultGoals();
    }

    /**
     * Update goals
     */
    updateGoals(goals) {
        const currentGoals = this.getGoals();
        const updatedGoals = { ...currentGoals, ...goals };
        return this.setItem(this.STORAGE_KEYS.GOALS, updatedGoals) ? updatedGoals : null;
    }

    // ===== Preferences Operations =====

    /**
     * Get user preferences
     */
    getPreferences() {
        return this.getItem(this.STORAGE_KEYS.USER_PREFERENCES) || this.getDefaultPreferences();
    }

    /**
     * Update user preferences
     */
    updatePreferences(preferences) {
        const currentPreferences = this.getPreferences();
        const updatedPreferences = { ...currentPreferences, ...preferences };
        return this.setItem(this.STORAGE_KEYS.USER_PREFERENCES, updatedPreferences) ? updatedPreferences : null;
    }

    // ===== Utility Methods =====

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Calculate sleep duration in hours
     */
    calculateSleepDuration(wakeTime, sleepTime) {
        const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
        const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);

        let duration = (wakeHours + wakeMinutes / 60) - (sleepHours + sleepMinutes / 60);
        if (duration < 0) {
            duration += 24; // Sleep spans midnight
        }

        return Math.round(duration * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculate activity duration in hours
     */
    calculateActivityDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        const durationHours = durationMs / (1000 * 60 * 60);

        return Math.round(durationHours * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Export all data as JSON
     */
    exportAllData() {
        return {
            version: this.CURRENT_VERSION,
            exportedAt: new Date().toISOString(),
            sleepData: this.getSleepData(),
            activityData: this.getActivityData(),
            goals: this.getGoals(),
            preferences: this.getPreferences()
        };
    }

    /**
     * Import data from JSON
     */
    importData(data) {
        try {
            if (data.sleepData) {
                this.setItem(this.STORAGE_KEYS.SLEEP_DATA, data.sleepData);
            }
            if (data.activityData) {
                this.setItem(this.STORAGE_KEYS.ACTIVITY_DATA, data.activityData);
            }
            if (data.goals) {
                this.setItem(this.STORAGE_KEYS.GOALS, data.goals);
            }
            if (data.preferences) {
                this.setItem(this.STORAGE_KEYS.USER_PREFERENCES, data.preferences);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global storage instance
const storage = new StorageManager();

// Make storage available globally
window.storage = storage;