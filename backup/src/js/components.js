/**
 * UI Components Module
 * Reusable UI components for the time management system
 */

class Components {
    /**
     * Initialize all components
     */
    static init() {
        this.initNavigation();
        this.initNotifications();
        this.initModals();
        this.initForms();
        this.initCharts();
    }

    /**
     * Initialize navigation system
     */
    static initNavigation() {
        const navLinks = document.querySelectorAll('.nav__link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.dataset.section;

                // Update active states
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                link.classList.add('active');
                const targetElement = document.getElementById(targetSection);
                if (targetElement) {
                    targetElement.classList.add('active');
                }
            });
        });
    }

    /**
     * Initialize notification system
     */
    static initNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';
            document.body.appendChild(container);
        }

        // Make showNotification globally available
        window.showNotification = this.showNotification.bind(this);
    }

    /**
     * Show notification message
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${Utils.escapeHtml(message)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);

        return notification;
    }

    /**
     * Initialize modal system
     */
    static initModals() {
        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(document.querySelector('.modal.active'));
            }
        });
    }

    /**
     * Show modal
     */
    static showModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${Utils.escapeHtml(title)}</h3>
                    <button class="modal-close" onclick="Components.closeModal(this.closest('.modal'))">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Close modal
     */
    static closeModal(modal) {
        if (modal && modal.classList.contains('modal')) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Initialize form validation
     */
    static initForms() {
        // Add form validation styles
        const style = document.createElement('style');
        style.textContent = `
            .form-input.error, .form-select.error, .form-textarea.error {
                border-color: #ef4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            .form-error {
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            .form-success {
                color: #10b981;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Validate form field
     */
    static validateField(field, rules) {
        const value = field.value.trim();
        let errors = [];

        // Required validation
        if (rules.required && !value) {
            errors.push('此字段为必填项');
        }

        // Time format validation
        if (rules.time && value && !Utils.isValidTimeFormat(value)) {
            errors.push('请输入有效的时间格式 (HH:MM)');
        }

        // Date format validation
        if (rules.date && value && !Utils.isValidDateFormat(value)) {
            errors.push('请输入有效的日期格式 (YYYY-MM-DD)');
        }

        // Datetime validation
        if (rules.datetime && value && !Utils.isValidDateTime(value)) {
            errors.push('请输入有效的日期时间');
        }

        // Min/max length validation
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`最少需要 ${rules.minLength} 个字符`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`最多允许 ${rules.maxLength} 个字符`);
        }

        // Custom validation
        if (rules.custom && typeof rules.custom === 'function') {
            const customError = rules.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }

        // Display errors or clear them
        this.showFieldErrors(field, errors);
        return errors.length === 0;
    }

    /**
     * Show field validation errors
     */
    static showFieldErrors(field, errors) {
        // Remove existing error messages
        const existingError = field.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        // Update field appearance
        if (errors.length > 0) {
            field.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.textContent = errors[0];
            field.parentNode.appendChild(errorElement);
        } else {
            field.classList.remove('error');
        }
    }

    /**
     * Create simple bar chart
     */
    static createBarChart(container, data, options = {}) {
        const {
            height = 300,
            barColor = '#2563eb',
            labelFormatter = (label) => label,
            valueFormatter = (value) => value.toFixed(1)
        } = options;

        const maxValue = Math.max(...data.map(item => item.value));
        const chartHTML = `
            <div class="simple-chart" style="height: ${height}px;">
                ${data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * (height - 40);
                    return `
                        <div class="chart-bar" style="height: ${barHeight}px; background-color: ${item.color || barColor};" title="${item.label}: ${valueFormatter(item.value)}">
                            <div class="chart-bar-value">${valueFormatter(item.value)}</div>
                            <div class="chart-bar-label">${labelFormatter(item.label)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = chartHTML;
        return container;
    }

    /**
     * Create simple pie chart
     */
    static createPieChart(container, data, options = {}) {
        const {
            size = 250,
            showLegend = true,
            valueFormatter = (value) => value.toFixed(1)
        } = options;

        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            container.innerHTML = '<p class="text-muted">暂无数据</p>';
            return container;
        }

        let currentAngle = -90; // Start from top
        const slices = data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const largeArcFlag = angle > 180 ? 1 : 0;
            const startX = size / 2 + (size / 2 - 10) * Math.cos(startAngle * Math.PI / 180);
            const startY = size / 2 + (size / 2 - 10) * Math.sin(startAngle * Math.PI / 180);
            const endX = size / 2 + (size / 2 - 10) * Math.cos(endAngle * Math.PI / 180);
            const endY = size / 2 + (size / 2 - 10) * Math.sin(endAngle * Math.PI / 180);

            return {
                ...item,
                percentage,
                path: `M ${size/2} ${size/2} L ${startX} ${startY} A ${size/2 - 10} ${size/2 - 10} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
            };
        });

        const chartHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    ${slices.map((slice, index) => `
                        <path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="2"
                              title="${slice.label}: ${valueFormatter(slice.value)} (${slice.percentage.toFixed(1)}%)">
                        </path>
                    `).join('')}
                </svg>
                ${showLegend ? `
                    <div class="pie-chart-legend">
                        ${slices.map(slice => `
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: ${slice.color}"></div>
                                <span>${slice.label}: ${slice.percentage.toFixed(1)}%</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = chartHTML;
        return container;
    }

    /**
     * Create activity list item
     */
    static createActivityItem(activity) {
        const startTime = Utils.formatTime(activity.startTime);
        const endTime = Utils.formatTime(activity.endTime);
        const duration = Utils.formatDuration(activity.duration);
        const categoryClass = `category-${activity.category}`;

        return `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-info">
                    <div class="activity-name">${Utils.escapeHtml(activity.name)}</div>
                    <span class="activity-category ${categoryClass}">${Utils.getCategoryName(activity.category)}</span>
                    <div class="activity-duration">${startTime} - ${endTime} (${duration})</div>
                    ${activity.description ? `<div class="activity-description">${Utils.escapeHtml(activity.description)}</div>` : ''}
                </div>
                <div class="activity-controls">
                    <button class="btn btn-small btn-secondary" onclick="editActivity('${activity.id}')">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="deleteActivity('${activity.id}')">删除</button>
                </div>
            </div>
        `;
    }

    /**
     * Create sleep history item
     */
    static createSleepHistoryItem(sleepRecord) {
        const dateStr = Utils.getRelativeDateString(sleepRecord.date);
        const duration = Utils.formatDuration(sleepRecord.duration);

        return `
            <div class="sleep-history-item" data-id="${sleepRecord.id}">
                <div class="sleep-date">${dateStr}</div>
                <div class="sleep-times">
                    <div>起床: <span class="editable-time clickable-time" onclick="Components.openInlineTimeEditor('${sleepRecord.id}', 'wakeTime', '${sleepRecord.wakeTime}')" title="点击编辑">${sleepRecord.wakeTime}</span></div>
                    <div>睡觉: <span class="editable-time clickable-time" onclick="Components.openInlineTimeEditor('${sleepRecord.id}', 'sleepTime', '${sleepRecord.sleepTime}')" title="点击编辑">${sleepRecord.sleepTime}</span></div>
                    <div class="sleep-duration">睡眠时长: ${duration}</div>
                </div>
                <div class="activity-controls">
                    <button class="btn btn-small btn-secondary" onclick="editSleepRecord('${sleepRecord.id}')">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="deleteSleepRecord('${sleepRecord.id}')">删除</button>
                </div>
            </div>
        `;
    }

    /**
     * Open inline time editor modal
     */
    static openInlineTimeEditor(recordId, field, currentTime) {
        const fieldName = field === 'wakeTime' ? '起床时间' : '睡觉时间';
        const fieldId = field === 'wakeTime' ? 'inline-wake-time' : 'inline-sleep-time';
        const sliderId = field === 'wakeTime' ? 'inline-wake-slider' : 'inline-sleep-slider';
        const previewId = field === 'wakeTime' ? 'inline-wake-preview' : 'inline-sleep-preview';

        const modalContent = `
            <div class="inline-time-editor">
                <div class="form-group">
                    <label for="${fieldId}">${fieldName}</label>
                    <input type="time" id="${fieldId}" class="form-input" value="${currentTime}">
                </div>

                <div class="time-input-group">
                    <div class="time-slider-container">
                        <input type="range" id="${sliderId}" class="time-slider" min="0" max="1439" step="15">
                        <div class="time-preview" id="${previewId}">${currentTime}</div>
                    </div>
                </div>

                <div class="quick-time-buttons">
                    ${field === 'wakeTime' ?
                        `<button type="button" class="btn-quick-time" data-time="05:00">5:00</button>
                         <button type="button" class="btn-quick-time" data-time="06:00">6:00</button>
                         <button type="button" class="btn-quick-time" data-time="06:30">6:30</button>
                         <button type="button" class="btn-quick-time" data-time="07:00">7:00</button>
                         <button type="button" class="btn-quick-time" data-time="07:30">7:30</button>
                         <button type="button" class="btn-quick-time" data-time="08:00">8:00</button>` :
                        `<button type="button" class="btn-quick-time" data-time="21:00">21:00</button>
                         <button type="button" class="btn-quick-time" data-time="22:00">22:00</button>
                         <button type="button" class="btn-quick-time" data-time="22:30">22:30</button>
                         <button type="button" class="btn-quick-time" data-time="23:00">23:00</button>
                         <button type="button" class="btn-quick-time" data-time="23:30">23:30</button>
                         <button type="button" class="btn-quick-time" data-time="00:00">00:00</button>`
                    }
                </div>

                <div class="quick-adjustment-buttons">
                    <button type="button" class="btn btn-small btn-secondary" onclick="Components.adjustTime('${fieldId}', -15)">-15分钟</button>
                    <button type="button" class="btn btn-small btn-secondary" onclick="Components.adjustTime('${fieldId}', -60)">-1小时</button>
                    <button type="button" class="btn btn-small btn-secondary" onclick="Components.adjustTime('${fieldId}', 60)">+1小时</button>
                    <button type="button" class="btn btn-small btn-secondary" onclick="Components.adjustTime('${fieldId}', 15)">+15分钟</button>
                </div>

                <div class="inline-edit-status" id="inline-edit-status"></div>
            </div>
        `;

        const modal = this.showModal(`编辑${fieldName}`, modalContent, {
            footer: `
                <button class="btn btn-secondary" onclick="Components.closeModal(this.closest('.modal'))">取消</button>
                <button class="btn btn-primary" onclick="Components.saveInlineTimeEdit('${recordId}', '${field}')">保存</button>
            `
        });

        // Initialize the inline editor
        this.initializeInlineTimeEditor(fieldId, sliderId, previewId, currentTime);
    }

    /**
     * Initialize inline time editor
     */
    static initializeInlineTimeEditor(inputId, sliderId, previewId, initialTime) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        const preview = document.getElementById(previewId);

        if (!input || !slider || !preview) return;

        // Initialize slider with current time
        const initialMinutes = this.timeStringToMinutes(initialTime);
        slider.value = initialMinutes;
        preview.textContent = initialTime;

        // Slider event
        slider.addEventListener('input', (e) => {
            const minutes = parseInt(e.target.value);
            const timeString = this.minutesToTimeString(minutes);
            input.value = timeString;
            preview.textContent = timeString;
            this.validateInlineTimeEdit(inputId);
        });

        // Input event
        input.addEventListener('input', (e) => {
            const timeValue = e.target.value;
            if (Utils.isValidTimeFormat(timeValue)) {
                const minutes = this.timeStringToMinutes(timeValue);
                slider.value = minutes;
                preview.textContent = timeValue;
            }
            this.validateInlineTimeEdit(inputId);
        });

        // Quick time buttons - find them in the current modal
        const quickButtons = document.querySelectorAll('.modal.active .btn-quick-time');
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const timeValue = e.target.dataset.time;
                input.value = timeValue;
                const minutes = this.timeStringToMinutes(timeValue);
                slider.value = minutes;
                preview.textContent = timeValue;

                // Update active state
                quickButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                this.validateInlineTimeEdit(inputId);
            });
        });

        // Set initial active state for quick time buttons
        quickButtons.forEach(button => {
            if (button.dataset.time === initialTime) {
                button.classList.add('active');
            }
        });
    }

    /**
     * Adjust time by specified minutes
     */
    static adjustTime(inputId, minutes) {
        const input = document.getElementById(inputId);
        if (!input || !Utils.isValidTimeFormat(input.value)) return;

        const currentMinutes = this.timeStringToMinutes(input.value);
        let newMinutes = currentMinutes + minutes;

        // Handle wrap around
        if (newMinutes < 0) newMinutes += 1440;
        if (newMinutes >= 1440) newMinutes -= 1440;

        const newTime = this.minutesToTimeString(newMinutes);
        input.value = newTime;

        // Update slider and preview
        const fieldId = inputId.replace('-time', '');
        const slider = document.getElementById(`${fieldId}-slider`);
        const preview = document.getElementById(`${fieldId}-preview`);

        if (slider) slider.value = newMinutes;
        if (preview) preview.textContent = newTime;

        this.validateInlineTimeEdit(inputId);
    }

    /**
     * Validate inline time edit
     */
    static validateInlineTimeEdit(inputId) {
        const input = document.getElementById(inputId);
        const statusDiv = document.getElementById('inline-edit-status');

        if (!input || !statusDiv) return;

        if (Utils.isValidTimeFormat(input.value)) {
            statusDiv.textContent = '';
            statusDiv.className = 'inline-edit-status';
        } else {
            statusDiv.textContent = '请输入有效的时间格式 (HH:MM)';
            statusDiv.className = 'inline-edit-status error';
        }
    }

    /**
     * Save inline time edit
     */
    static saveInlineTimeEdit(recordId, field) {
        const fieldId = field === 'wakeTime' ? 'inline-wake-time' : 'inline-sleep-time';
        const input = document.getElementById(fieldId);

        if (!input || !Utils.isValidTimeFormat(input.value)) {
            this.showNotification('请输入有效的时间格式', 'error');
            return;
        }

        const newTime = input.value;

        // Update the record using the sleep tracker
        if (window.sleepTracker) {
            // Store original record for undo
            const originalRecord = storage.getSleepData().find(r => r.id === recordId);
            if (originalRecord) {
                window.sleepTracker.addToHistory({
                    action: 'update',
                    recordId: recordId,
                    originalData: { ...originalRecord },
                    timestamp: new Date().toISOString()
                });
            }

            const success = storage.updateSleepRecord(recordId, { [field]: newTime });
            if (success) {
                this.showNotification(`${field === 'wakeTime' ? '起床' : '睡觉'}时间更新成功`, 'success');
                this.closeModal(document.querySelector('.modal.active'));

                // Refresh the sleep history and dashboard
                window.sleepTracker.loadSleepHistory();
                window.sleepTracker.updateDashboard();
            } else {
                this.showNotification('更新失败，请重试', 'error');
            }
        }
    }

    /**
     * Convert time string to minutes
     */
    static timeStringToMinutes(timeString) {
        if (!Utils.isValidTimeFormat(timeString)) {
            return 0;
        }

        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convert minutes to time string
     */
    static minutesToTimeString(minutes) {
        if (minutes < 0 || minutes >= 1440) {
            return '00:00';
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Create empty state message
     */
    static createEmptyState(title, description, actionButton = null) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-description">${description}</div>
                ${actionButton || ''}
            </div>
        `;
    }

    /**
     * Show loading state
     */
    static showLoading(container, message = '加载中...') {
        container.innerHTML = `
            <div class="loading">
                ${message}
            </div>
        `;
    }

    /**
     * Clear loading state
     */
    static clearLoading(container) {
        const loadingElement = container.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    /**
     * Initialize chart interactions
     */
    static initCharts() {
        // Add chart interaction styles if not already added
        if (!document.getElementById('chart-interaction-styles')) {
            const style = document.createElement('style');
            style.id = 'chart-interaction-styles';
            style.textContent = `
                .chart-container {
                    position: relative;
                }
                .chart-tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    pointer-events: none;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .chart-tooltip.show {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Format currency (for future use)
     */
    static formatCurrency(amount, currency = 'CNY') {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Confirm action
     */
    static confirmAction(message, onConfirm, onCancel = null) {
        const modal = this.showModal('确认操作', `
            <p>${message}</p>
        `, {
            footer: `
                <button class="btn btn-secondary" onclick="Components.closeModal(this.closest('.modal'))">取消</button>
                <button class="btn btn-danger" id="confirm-action">确认</button>
            `
        });

        const confirmButton = modal.querySelector('#confirm-action');
        confirmButton.addEventListener('click', () => {
            this.closeModal(modal);
            if (onConfirm) onConfirm();
        });

        if (onCancel) {
            modal.querySelector('.btn-secondary').addEventListener('click', onCancel);
        }
    }
}

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Components.init();
});

// Make Components available globally
window.Components = Components;