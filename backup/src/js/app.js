/**
 * Main Application Module
 * Coordinates all modules and handles application initialization
 */

class TimeManagementApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Time Management System...');

            // Check localStorage availability
            if (!this.checkLocalStorage()) {
                this.showFatalError('您的浏览器不支持本地存储，请使用现代浏览器。');
                return;
            }

            // Initialize storage first
            await this.initializeStorage();

            // Initialize all modules
            await this.initializeModules();

            // Set up global event listeners
            this.setupGlobalEventListeners();

            // Update all dashboard components
            this.updateAllDashboards();

            // Set up auto-save and periodic updates
            this.setupPeriodicUpdates();

            // Mark as initialized
            this.isInitialized = true;

            console.log('✅ Time Management System initialized successfully!');
            this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showFatalError('应用初始化失败，请刷新页面重试。');
        }
    }

    /**
     * Check localStorage availability
     */
    checkLocalStorage() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Initialize storage system
     */
    async initializeStorage() {
        // Wait for storage module to be available
        let attempts = 0;
        const maxAttempts = 10;

        while (!window.storage && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.storage) {
            throw new Error('Storage module not loaded after multiple attempts');
        }

        // Ensure data structures exist
        const sleepData = storage.getSleepData();
        const activityData = storage.getActivityData();
        const goals = storage.getGoals();
        const preferences = storage.getPreferences();

        console.log('📊 Data loaded:', {
            sleepRecords: sleepData.length,
            activityRecords: activityData.length,
            goals: Object.keys(goals).length,
            preferences: Object.keys(preferences).length
        });
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        // Wait for DOM to be ready if not already
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }

        // Check if modules are available
        const requiredModules = ['sleepTracker', 'activityTracker', 'statistics'];
        for (const moduleName of requiredModules) {
            if (window[moduleName]) {
                this.modules[moduleName] = window[moduleName];
                console.log(`📦 Module loaded: ${moduleName}`);
            } else {
                console.warn(`⚠️ Module not found: ${moduleName}`);
            }
        }
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.updateAllDashboards();
            }
        });

        // Handle window resize for responsive charts
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.isInitialized && this.modules.statistics) {
                    this.modules.statistics.loadStatistics();
                }
            }, 300);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            Components.showNotification('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            Components.showNotification('网络连接已断开，数据将保存在本地', 'warning');
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Prevent accidental navigation away
        window.addEventListener('beforeunload', (e) => {
            // Only show warning if there are unsaved changes
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
                return e.returnValue;
            }
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Only trigger shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ctrl/Cmd + S: Quick save (if implemented)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.quickSave();
        }

        // Ctrl/Cmd + E: Export data
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (this.modules.statistics) {
                this.modules.statistics.exportToCSV();
            }
        }

        // Ctrl/Cmd + R: Generate report
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (this.modules.statistics) {
                this.modules.statistics.generateReport();
            }
        }

        // Number keys 1-4: Navigate to sections
        if (e.key >= '1' && e.key <= '4') {
            const sections = ['dashboard', 'sleep', 'activities', 'statistics'];
            const sectionIndex = parseInt(e.key) - 1;
            const sectionButton = document.querySelector(`[data-section="${sections[sectionIndex]}"]`);
            if (sectionButton) {
                sectionButton.click();
            }
        }
    }

    /**
     * Update all dashboard components
     */
    updateAllDashboards() {
        if (!this.isInitialized) return;

        // Update sleep tracker dashboard
        if (this.modules.sleepTracker) {
            this.modules.sleepTracker.updateDashboard();
        }

        // Update activity tracker dashboard
        if (this.modules.activityTracker) {
            this.modules.activityTracker.updateDashboard();
        }

        // Update statistics (only if statistics section is active)
        if (this.modules.statistics && document.getElementById('statistics').classList.contains('active')) {
            this.modules.statistics.loadStatistics();
        }
    }

    /**
     * Set up periodic updates
     */
    setupPeriodicUpdates() {
        // Update dashboards every minute
        setInterval(() => {
            if (!document.hidden) {
                this.updateAllDashboards();
            }
        }, 60000); // 1 minute

        // Auto-save preferences every 5 minutes
        setInterval(() => {
            this.autoSave();
        }, 300000); // 5 minutes
    }

    /**
     * Show welcome message for first-time users
     */
    showWelcomeMessage() {
        const preferences = storage.getPreferences();
        if (!preferences.hasVisited) {
            // Update preferences to mark as visited
            storage.updatePreferences({ hasVisited: true });

            // Show welcome modal
            const welcomeContent = `
                <div style="text-align: center; padding: 1rem;">
                    <h2 style="color: #2563eb; margin-bottom: 1rem;">欢迎使用时间管理系统！</h2>
                    <p style="margin-bottom: 1rem;">这是一个帮助您追踪时间、提高效率的工具。</p>

                    <div style="text-align: left; margin: 1.5rem 0; padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">快速开始指南：</h4>
                        <ul style="margin: 0; padding-left: 1.5rem;">
                            <li>使用<strong>睡眠记录</strong>追踪您的作息时间</li>
                            <li>使用<strong>活动记录</strong>记录工作和休闲时间</li>
                            <li>在<strong>统计分析</strong>中查看您的数据报告</li>
                            <li>使用快捷键：1-4 切换页面，Ctrl+E 导出数据</li>
                        </ul>
                    </div>

                    <p style="color: #64748b; font-size: 0.875rem;">
                        所有数据都保存在您的浏览器本地，安全可靠。
                    </p>
                </div>
            `;

            Components.showModal('欢迎', welcomeContent, {
                footer: `
                    <button class="btn btn-primary" onclick="Components.closeModal(this.closest('.modal'))">开始使用</button>
                `
            });
        }
    }

    /**
     * Show fatal error message
     */
    showFatalError(message) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f7fa; font-family: system-ui, -apple-system, sans-serif;">
                <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h2 style="color: #1e293b; margin-bottom: 1rem;">应用启动失败</h2>
                    <p style="color: #64748b; margin-bottom: 1.5rem;">${message}</p>
                    <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Check for unsaved changes
     */
    hasUnsavedChanges() {
        // Check if any form has unsaved data
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const inputs = form.querySelectorAll('input, textarea, select');
            for (const input of inputs) {
                if (input.value && input.value !== input.defaultValue) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Quick save functionality
     */
    quickSave() {
        // This could be enhanced to auto-save any form data
        const activeSection = document.querySelector('.section.active');
        const activeForm = activeSection?.querySelector('form');

        if (activeForm) {
            const submitButton = activeForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        } else {
            Components.showNotification('没有需要保存的数据', 'info');
        }
    }

    /**
     * Auto-save preferences and settings
     */
    autoSave() {
        try {
            // Save current app state
            const currentState = {
                lastSection: document.querySelector('.section.active')?.id || 'dashboard',
                lastUpdated: new Date().toISOString()
            };

            storage.updatePreferences({ appState: currentState });
            console.log('🔄 Auto-saved application state');
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    /**
     * Export all application data
     */
    exportAllData() {
        try {
            const allData = storage.exportAllData();
            const jsonData = JSON.stringify(allData, null, 2);
            const filename = `time_management_backup_${Utils.formatDate(new Date())}.json`;

            Utils.downloadFile(jsonData, filename, 'application/json');
            Components.showNotification('数据备份成功', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            Components.showNotification('数据备份失败', 'error');
        }
    }

    /**
     * Import application data
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = storage.importData(data);

                    if (success) {
                        Components.showNotification('数据导入成功', 'success');
                        this.updateAllDashboards();
                        resolve(true);
                    } else {
                        reject(new Error('数据导入失败'));
                    }
                } catch (error) {
                    reject(new Error('数据格式无效'));
                }
            };

            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    /**
     * Reset all application data
     */
    resetAllData() {
        Components.confirmAction(
            '确定要重置所有数据吗？此操作不可恢复！',
            () => {
                try {
                    storage.clearAllData();
                    this.updateAllDashboards();
                    Components.showNotification('所有数据已重置', 'success');

                    // Reload page to ensure clean state
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    console.error('Reset failed:', error);
                    Components.showNotification('重置失败，请重试', 'error');
                }
            }
        );
    }

    /**
     * Get application information
     */
    getAppInfo() {
        return {
            name: '时间管理系统',
            version: '1.0.0',
            buildDate: '2024-10-16',
            dataStats: {
                sleepRecords: storage.getSleepData().length,
                activityRecords: storage.getActivityData().length,
                storageUsage: this.getStorageUsage()
            }
        };
    }

    /**
     * Get localStorage usage information
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('timecal_')) {
                    totalSize += localStorage[key].length;
                }
            }
            return {
                size: totalSize,
                sizeFormatted: this.formatBytes(totalSize),
                maxSize: 5 * 1024 * 1024, // 5MB estimated limit
                percentage: Math.round((totalSize / (5 * 1024 * 1024)) * 100)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Global app instance
window.app = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM ready, initializing app...');
    console.log('🔍 Checking modules:', {
        storage: typeof window.storage,
        Utils: typeof window.Utils,
        Components: typeof window.Components
    });

    // Small delay to ensure all modules are fully loaded
    setTimeout(() => {
        console.log('⚡ Creating app instance...');
        window.app = new TimeManagementApp();
    }, 100);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeManagementApp;
}