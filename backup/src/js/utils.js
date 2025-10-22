/**
 * Utility Functions Module
 * Common helper functions used throughout the application
 */

class Utils {
    /**
     * Format date to YYYY-MM-DD string
     */
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    /**
     * Format time to HH:MM string
     */
    static formatTime(date) {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Format datetime to YYYY-MM-DD HH:MM string
     */
    static formatDateTime(dateTime) {
        const d = new Date(dateTime);
        return `${this.formatDate(d)} ${this.formatTime(d)}`;
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    static getToday() {
        return this.formatDate(new Date());
    }

    /**
     * Get current time in HH:MM format
     */
    static getCurrentTime() {
        return this.formatTime(new Date());
    }

    /**
     * Get current datetime in ISO format
     */
    static getCurrentDateTime() {
        return new Date().toISOString();
    }

    /**
     * Convert hours to readable format (X小时Y分钟)
     */
    static formatDuration(hours) {
        if (hours < 0) return '0小时0分钟';

        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);

        if (wholeHours === 0 && minutes === 0) {
            return '0分钟';
        } else if (wholeHours === 0) {
            return `${minutes}分钟`;
        } else if (minutes === 0) {
            return `${wholeHours}小时`;
        } else {
            return `${wholeHours}小时${minutes}分钟`;
        }
    }

    /**
     * Convert decimal hours to HH:MM format
     */
    static decimalHoursToTime(hours) {
        if (hours < 0) return '00:00';

        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);

        return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    /**
     * Convert HH:MM to decimal hours
     */
    static timeToDecimalHours(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + (minutes / 60);
    }

    /**
     * Get date range for the last N days
     */
    static getDateRange(daysBack) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysBack + 1);

        return {
            start: this.formatDate(startDate),
            end: this.formatDate(endDate)
        };
    }

    /**
     * Get week date range (current week)
     */
    static getWeekRange() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);

        return {
            start: this.formatDate(startDate),
            end: this.formatDate(today)
        };
    }

    /**
     * Get month date range (current month)
     */
    static getMonthRange() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

        return {
            start: this.formatDate(startDate),
            end: this.formatDate(today)
        };
    }

    /**
     * Check if a date is today
     */
    static isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    }

    /**
     * Check if a date is yesterday
     */
    static isYesterday(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const checkDate = new Date(date);
        return yesterday.toDateString() === checkDate.toDateString();
    }

    /**
     * Get relative date string (今天, 昨天, or specific date)
     */
    static getRelativeDateString(date) {
        if (this.isToday(date)) {
            return '今天';
        } else if (this.isYesterday(date)) {
            return '昨天';
        } else {
            return this.formatDate(date);
        }
    }

    /**
     * Get Chinese name for activity category
     */
    static getCategoryName(category) {
        const categoryNames = {
            work: '工作',
            personal: '个人',
            leisure: '休闲',
            exercise: '运动',
            learning: '学习',
            other: '其他'
        };
        return categoryNames[category] || category;
    }

    /**
     * Get category color
     */
    static getCategoryColor(category) {
        const categoryColors = {
            work: '#2563eb',
            personal: '#a21caf',
            leisure: '#15803d',
            exercise: '#c2410c',
            learning: '#b45309',
            other: '#6b7280'
        };
        return categoryColors[category] || '#6b7280';
    }

    /**
     * Validate time format (HH:MM)
     */
    static isValidTimeFormat(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    /**
     * Validate date format (YYYY-MM-DD)
     */
    static isValidDateFormat(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;

        const d = new Date(date);
        return !isNaN(d.getTime());
    }

    /**
     * Validate datetime format (ISO string)
     */
    static isValidDateTime(dateTime) {
        const d = new Date(dateTime);
        return !isNaN(d.getTime());
    }

    /**
     * Sort array of objects by date property
     */
    static sortByDate(array, dateProperty, ascending = false) {
        return [...array].sort((a, b) => {
            const dateA = new Date(a[dateProperty]);
            const dateB = new Date(b[dateProperty]);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }

    /**
     * Group activities by date
     */
    static groupActivitiesByDate(activities) {
        return activities.reduce((groups, activity) => {
            const date = this.formatDate(activity.startTime);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
            return groups;
        }, {});
    }

    /**
     * Calculate percentage
     */
    static calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Generate chart colors
     */
    static generateChartColors(count) {
        const baseColors = [
            '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    /**
     * Download data as file
     */
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Escape HTML to prevent XSS
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show notification (helper for components)
     */
    static showNotification(message, type = 'info', duration = 3000) {
        // This will be implemented in components.js
        if (window.showNotification) {
            window.showNotification(message, type, duration);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Make Utils available globally
window.Utils = Utils;