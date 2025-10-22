/**
 * Statistics Module
 * Handles all statistics, analytics, and chart functionality
 */

class Statistics {
    constructor() {
        this.init();
    }

    /**
     * Initialize statistics module
     */
    init() {
        this.bindEvents();
        this.loadStatistics();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Export buttons
        const exportCsvBtn = document.getElementById('export-csv');
        const exportReportBtn = document.getElementById('export-report');

        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportToCSV();
            });
        }

        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // Navigation to statistics section should refresh data
        document.querySelector('[data-section="statistics"]')?.addEventListener('click', () => {
            setTimeout(() => this.loadStatistics(), 100);
        });
    }

    /**
     * Load all statistics
     */
    loadStatistics() {
        this.loadTimeDistribution();
        this.loadWeeklyTrends();
        this.loadGoalProgress();
    }

    /**
     * Load time distribution chart
     */
    loadTimeDistribution() {
        const container = document.getElementById('time-distribution');
        if (!container) return;

        const today = Utils.getToday();
        const todayActivities = storage.getActivitiesByDate(today);

        if (todayActivities.length === 0) {
            container.innerHTML = Components.createEmptyState(
                '暂无今日数据',
                '记录活动后可查看时间分布图表'
            );
            return;
        }

        // Calculate time by category
        const categoryData = {};
        let totalHours = 0;

        todayActivities.forEach(activity => {
            if (!categoryData[activity.category]) {
                categoryData[activity.category] = 0;
            }
            categoryData[activity.category] += activity.duration;
            totalHours += activity.duration;
        });

        // Prepare chart data
        const chartData = Object.entries(categoryData).map(([category, hours]) => ({
            label: Utils.getCategoryName(category),
            value: hours,
            color: Utils.getCategoryColor(category)
        }));

        // Create pie chart
        Components.createPieChart(container, chartData, {
            showLegend: true,
            valueFormatter: (value) => `${Utils.formatDuration(value)}`
        });
    }

    /**
     * Load weekly trends chart
     */
    loadWeeklyTrends() {
        const container = document.getElementById('weekly-trends');
        if (!container) return;

        const weekRange = Utils.getDateRange(7);
        const weekActivities = storage.getActivitiesByDateRange(weekRange.start, weekRange.end);

        if (weekActivities.length === 0) {
            container.innerHTML = Components.createEmptyState(
                '暂无本周数据',
                '记录活动后可查看趋势图表'
            );
            return;
        }

        // Group activities by day
        const dailyData = {};
        const workDailyData = {};

        // Initialize all days of the week
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = Utils.formatDate(date);
            const dayName = this.getDayName(date);
            dailyData[dayName] = 0;
            workDailyData[dayName] = 0;
        }

        // Calculate daily hours
        weekActivities.forEach(activity => {
            const date = new Date(activity.startTime);
            const dayName = this.getDayName(date);
            const duration = activity.duration;

            dailyData[dayName] += duration;
            if (activity.category === 'work') {
                workDailyData[dayName] += duration;
            }
        });

        // Prepare chart data
        const chartData = Object.entries(dailyData).map(([day, hours]) => ({
            label: day,
            value: hours,
            color: '#2563eb'
        }));

        const workChartData = Object.entries(workDailyData).map(([day, hours]) => ({
            label: day,
            value: hours,
            color: '#10b981'
        }));

        // Create a simple bar chart showing both total and work hours
        const chartHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <h4 style="margin-bottom: 0.5rem; color: #374151;">总活动时长</h4>
                    <div id="total-hours-chart"></div>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.5rem; color: #374151;">工作时长</h4>
                    <div id="work-hours-chart"></div>
                </div>
            </div>
        `;

        container.innerHTML = chartHTML;

        // Create separate charts
        setTimeout(() => {
            const totalContainer = document.getElementById('total-hours-chart');
            const workContainer = document.getElementById('work-hours-chart');

            if (totalContainer) {
                Components.createBarChart(totalContainer, chartData, {
                    height: 150,
                    valueFormatter: (value) => `${value.toFixed(1)}h`
                });
            }

            if (workContainer) {
                Components.createBarChart(workContainer, workChartData, {
                    height: 150,
                    valueFormatter: (value) => `${value.toFixed(1)}h`
                });
            }
        }, 100);
    }

    /**
     * Load goal progress
     */
    loadGoalProgress() {
        const container = document.getElementById('goal-progress');
        if (!container) return;

        const goals = storage.getGoals();
        const progress = this.calculateGoalProgress();

        const goalsHTML = Object.entries(progress).map(([goalType, data]) => {
            const goalName = this.getGoalDisplayName(goalType);
            const progressColor = this.getProgressColor(data.percentage);

            return `
                <div class="goal-item">
                    <div>
                        <span style="font-weight: 500;">${goalName}</span>
                        <span style="font-size: 0.875rem; color: #64748b; margin-left: 0.5rem;">
                            ${data.actual.toFixed(1)}h / ${data.target.toFixed(1)}h
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="mini-progress" style="width: 150px;">
                            <div class="mini-progress-fill" style="width: ${Math.min(data.percentage, 100)}%; background-color: ${progressColor};"></div>
                        </div>
                        <span style="font-size: 0.875rem; font-weight: 500; color: ${progressColor};">
                            ${data.percentage}%
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = goalsHTML || '<p class="text-muted">暂无目标数据</p>';
    }

    /**
     * Calculate goal progress
     */
    calculateGoalProgress() {
        const goals = storage.getGoals();
        const today = Utils.getToday();
        const todayActivities = storage.getActivitiesByDate(today);

        // Calculate current week progress for weekly goals
        const weekRange = Utils.getDateRange(7);
        const weekActivities = storage.getActivitiesByDateRange(weekRange.start, weekRange.end);

        const progress = {
            dailyWork: {
                actual: 0,
                target: goals.dailyWorkHours,
                percentage: 0
            },
            weeklyWork: {
                actual: 0,
                target: goals.weeklyWorkHours,
                percentage: 0
            },
            dailySleep: {
                actual: 0,
                target: goals.dailySleepHours,
                percentage: 0
            },
            weeklyExercise: {
                actual: 0,
                target: goals.weeklyExerciseHours,
                percentage: 0
            },
            dailyLearning: {
                actual: 0,
                target: goals.dailyLearningHours,
                percentage: 0
            }
        };

        // Calculate daily work progress
        todayActivities.forEach(activity => {
            if (activity.category === 'work') {
                progress.dailyWork.actual += activity.duration;
            } else if (activity.category === 'exercise') {
                progress.dailyExercise.actual += activity.duration;
            } else if (activity.category === 'learning') {
                progress.dailyLearning.actual += activity.duration;
            }
        });

        // Calculate weekly work progress
        weekActivities.forEach(activity => {
            if (activity.category === 'work') {
                progress.weeklyWork.actual += activity.duration;
            } else if (activity.category === 'exercise') {
                progress.weeklyExercise.actual += activity.duration;
            }
        });

        // Calculate daily sleep progress
        const todaySleep = storage.getSleepData().find(record => record.date === today);
        if (todaySleep && todaySleep.duration) {
            progress.dailySleep.actual = todaySleep.duration;
        }

        // Calculate percentages
        Object.keys(progress).forEach(key => {
            const data = progress[key];
            data.percentage = Utils.calculatePercentage(data.actual, data.target);
        });

        return progress;
    }

    /**
     * Get day name in Chinese
     */
    getDayName(date) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    }

    /**
     * Get goal display name in Chinese
     */
    getGoalDisplayName(goalType) {
        const names = {
            dailyWork: '每日工作',
            weeklyWork: '每周工作',
            dailySleep: '每日睡眠',
            weeklyExercise: '每周运动',
            dailyLearning: '每日学习'
        };
        return names[goalType] || goalType;
    }

    /**
     * Get progress color based on percentage
     */
    getProgressColor(percentage) {
        if (percentage >= 100) return '#10b981'; // Green
        if (percentage >= 75) return '#3b82f6'; // Blue
        if (percentage >= 50) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    }

    /**
     * Export data to CSV
     */
    exportToCSV() {
        try {
            const csvContent = this.generateCSVContent();
            const filename = `time_management_data_${Utils.formatDate(new Date())}.csv`;
            Utils.downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
            Components.showNotification('数据导出成功', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Components.showNotification('导出失败，请重试', 'error');
        }
    }

    /**
     * Generate CSV content
     */
    generateCSVContent() {
        const sleepData = storage.getSleepData();
        const activityData = storage.getActivityData();

        let csv = '\ufeff'; // UTF-8 BOM for Excel

        // Sleep data section
        csv += '睡眠数据\n';
        csv += '日期,起床时间,睡觉时间,睡眠时长,记录时间\n';
        sleepData.forEach(record => {
            csv += `${record.date},${record.wakeTime},${record.sleepTime},${record.duration},${record.createdAt}\n`;
        });

        csv += '\n'; // Empty line between sections

        // Activity data section
        csv += '活动数据\n';
        csv += '活动名称,类别,开始时间,结束时间,时长,描述,记录时间\n';
        activityData.forEach(record => {
            const name = `"${record.name.replace(/"/g, '""')}"`; // Escape quotes
            const description = `"${(record.description || '').replace(/"/g, '""')}"`;
            csv += `${name},${Utils.getCategoryName(record.category)},${record.startTime},${record.endTime},${record.duration},${description},${record.createdAt}\n`;
        });

        return csv;
    }

    /**
     * Generate and display report
     */
    generateReport() {
        const reportContent = this.generateReportContent();
        const modal = Components.showModal('时间管理报告', reportContent, {
            footer: `
                <button class="btn btn-secondary" onclick="Components.closeModal(this.closest('.modal'))">关闭</button>
                <button class="btn btn-primary" onclick="statistics.printReport()">打印报告</button>
            `
        });
    }

    /**
     * Generate report content
     */
    generateReportContent() {
        const today = Utils.getToday();
        const weekRange = Utils.getDateRange(7);
        const monthRange = Utils.getMonthRange();

        const sleepData = storage.getSleepData();
        const activityData = storage.getActivityData();
        const goals = storage.getGoals();

        const todayActivities = storage.getActivitiesByDate(today);
        const weekActivities = storage.getActivitiesByDateRange(weekRange.start, weekRange.end);
        const monthActivities = storage.getActivitiesByDateRange(monthRange.start, monthRange.end);

        const todaySleep = sleepData.find(record => record.date === today);
        const weekSleep = storage.getSleepDataByDateRange(weekRange.start, weekRange.end);
        const monthSleep = storage.getSleepDataByDateRange(monthRange.start, monthRange.end);

        // Calculate statistics
        const todayStats = this.calculateDailyStats(todayActivities, todaySleep);
        const weekStats = this.calculateWeeklyStats(weekActivities, weekSleep);
        const monthStats = this.calculateMonthlyStats(monthActivities, monthSleep);

        return `
            <div class="report-content" style="max-height: 70vh; overflow-y: auto; padding: 1rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2>时间管理报告</h2>
                    <p style="color: #64748b;">生成时间: ${Utils.formatDateTime(new Date())}</p>
                </div>

                <div class="report-section" style="margin-bottom: 2rem;">
                    <h3>今日概览</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">工作时长</div>
                            <div style="font-size: 1.5rem; color: #2563eb; font-weight: 700;">${Utils.formatDuration(todayStats.workHours)}</div>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">空闲时长</div>
                            <div style="font-size: 1.5rem; color: #10b981; font-weight: 700;">${Utils.formatDuration(todayStats.freeHours)}</div>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">睡眠时长</div>
                            <div style="font-size: 1.5rem; color: #6366f1; font-weight: 700;">${Utils.formatDuration(todayStats.sleepHours || 0)}</div>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">活动数量</div>
                            <div style="font-size: 1.5rem; color: #f59e0b; font-weight: 700;">${todayActivities.length}</div>
                        </div>
                    </div>
                </div>

                <div class="report-section" style="margin-bottom: 2rem;">
                    <h3>本周统计</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">总工作时长</div>
                            <div style="font-size: 1.5rem; color: #2563eb; font-weight: 700;">${Utils.formatDuration(weekStats.workHours)}</div>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">平均每日工作</div>
                            <div style="font-size: 1.5rem; color: #10b981; font-weight: 700;">${Utils.formatDuration(weekStats.avgDailyWork)}</div>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">平均睡眠时长</div>
                            <div style="font-size: 1.5rem; color: #6366f1; font-weight: 700;">${Utils.formatDuration(weekStats.avgSleep)}</div>
                        </div>
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                            <div style="font-weight: 600; color: #1e293b;">最高效的一天</div>
                            <div style="font-size: 1.25rem; color: #f59e0b; font-weight: 700;">${weekStats.mostProductiveDay || '-'}</div>
                        </div>
                    </div>
                </div>

                <div class="report-section" style="margin-bottom: 2rem;">
                    <h3>目标完成情况</h3>
                    <div style="margin-top: 1rem;">
                        ${this.generateGoalProgressReport()}
                    </div>
                </div>

                <div class="report-section" style="margin-bottom: 2rem;">
                    <h3>时间分配建议</h3>
                    <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 0.5rem; border-left: 4px solid #f59e0b;">
                        ${this.generateRecommendations(todayStats, weekStats)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate daily statistics
     */
    calculateDailyStats(activities, sleepRecord) {
        let workHours = 0;
        let freeHours = 0;

        activities.forEach(activity => {
            if (activity.category === 'work') {
                workHours += activity.duration;
            } else {
                freeHours += activity.duration;
            }
        });

        return {
            workHours,
            freeHours,
            totalHours: workHours + freeHours,
            sleepHours: sleepRecord ? sleepRecord.duration : 0,
            activityCount: activities.length
        };
    }

    /**
     * Calculate weekly statistics
     */
    calculateWeeklyStats(activities, sleepRecords) {
        let workHours = 0;
        const dailyWork = {};

        activities.forEach(activity => {
            const date = Utils.formatDate(activity.startTime);
            if (activity.category === 'work') {
                workHours += activity.duration;
                dailyWork[date] = (dailyWork[date] || 0) + activity.duration;
            }
        });

        const avgDailyWork = Object.keys(dailyWork).length > 0 ? workHours / 7 : 0;

        // Calculate average sleep
        const completeSleepRecords = sleepRecords.filter(record => record.duration > 0);
        const avgSleep = completeSleepRecords.length > 0
            ? completeSleepRecords.reduce((sum, record) => sum + record.duration, 0) / completeSleepRecords.length
            : 0;

        // Find most productive day
        let mostProductiveDay = null;
        let maxWorkHours = 0;
        Object.entries(dailyWork).forEach(([date, hours]) => {
            if (hours > maxWorkHours) {
                maxWorkHours = hours;
                mostProductiveDay = Utils.getRelativeDateString(date);
            }
        });

        return {
            workHours,
            avgDailyWork,
            avgSleep,
            mostProductiveDay,
            totalActivities: activities.length
        };
    }

    /**
     * Calculate monthly statistics
     */
    calculateMonthlyStats(activities, sleepRecords) {
        // Similar to weekly but for month
        return this.calculateWeeklyStats(activities, sleepRecords);
    }

    /**
     * Generate goal progress report
     */
    generateGoalProgressReport() {
        const progress = this.calculateGoalProgress();
        const goals = storage.getGoals();

        return Object.entries(progress).map(([goalType, data]) => {
            const goalName = this.getGoalDisplayName(goalType);
            const status = this.getGoalStatus(data.percentage);
            const statusColor = this.getStatusColor(data.percentage);

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                        <span style="font-weight: 500;">${goalName}</span>
                        <span style="margin-left: 1rem; color: #64748b; font-size: 0.875rem;">
                            ${data.actual.toFixed(1)}h / ${data.target.toFixed(1)}h
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${Math.min(data.percentage, 100)}%; height: 100%; background: ${this.getProgressColor(data.percentage)};"></div>
                        </div>
                        <span style="font-size: 0.875rem; font-weight: 500; color: ${statusColor};">
                            ${status}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get goal status text
     */
    getGoalStatus(percentage) {
        if (percentage >= 100) return '已完成';
        if (percentage >= 90) return '即将完成';
        if (percentage >= 70) return '进展良好';
        if (percentage >= 50) return '进展一般';
        if (percentage >= 30) return '需要努力';
        return '刚开始';
    }

    /**
     * Get status color
     */
    getStatusColor(percentage) {
        if (percentage >= 100) return '#10b981';
        if (percentage >= 70) return '#3b82f6';
        if (percentage >= 50) return '#f59e0b';
        return '#ef4444';
    }

    /**
     * Generate recommendations based on statistics
     */
    generateRecommendations(todayStats, weekStats) {
        const recommendations = [];

        // Work-life balance
        if (todayStats.workHours > 10) {
            recommendations.push('🌟 今日工作时间较长，记得适当休息，保持工作生活平衡。');
        } else if (todayStats.workHours < 4 && todayStats.workHours > 0) {
            recommendations.push('💪 可以适当增加工作时间，提高 productivity。');
        }

        // Sleep recommendations
        if (todayStats.sleepHours < 6) {
            recommendations.push('😴 睡眠时间不足，建议保证7-9小时的充足睡眠。');
        } else if (todayStats.sleepHours > 10) {
            recommendations.push('⏰ 睡眠时间较长，可以尝试调整作息，提高白天效率。');
        }

        // Activity recommendations
        if (todayStats.activityCount < 3) {
            recommendations.push('📝 尝试将时间分解为更小的活动块，提高时间利用效率。');
        }

        // Weekly trends
        if (weekStats.avgDailyWork < goals.dailyWorkHours * 0.8) {
            recommendations.push('🎯 本周平均工作时间略低于目标，可以制定更有效的时间计划。');
        }

        if (recommendations.length === 0) {
            recommendations.push('👍 保持良好的时间管理习惯，继续加油！');
        }

        return recommendations.join('<br><br>');
    }

    /**
     * Print report
     */
    printReport() {
        const reportContent = document.querySelector('.report-content');
        if (!reportContent) return;

        const printWindow = window.open('', '_blank');
        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>时间管理报告</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; line-height: 1.6; }
                    h1, h2, h3 { color: #1e293b; }
                    .report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
                    .stat-card { padding: 1rem; background: #f8fafc; border-radius: 0.5rem; text-align: center; }
                    .progress-bar { width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; display: inline-block; }
                    .progress-fill { height: 100%; background: #10b981; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${reportContent.innerHTML}
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.print();
    }
}

// Global functions
window.statistics = null;

// Initialize statistics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.statistics = new Statistics();
});