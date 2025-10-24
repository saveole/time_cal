import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { apiClient } from '../../lib/api';
import { Statistics as StatisticsType, CategoryStat, DailyStat } from '../../types';

export function Statistics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Fetch statistics overview
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['statisticsOverview', timeRange],
    queryFn: () => apiClient.getStatisticsOverview({ timeRange }),
    select: (response) => response.data,
  });

  // Fetch category statistics
  const { data: categoryStats, isLoading: categoriesLoading } = useQuery({
    queryKey: ['statisticsCategories', timeRange],
    queryFn: () => apiClient.getStatisticsCategories({ timeRange }),
    select: (response) => response.data,
  });

  // Fetch daily stats for time series
  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['statisticsTimeseries', timeRange],
    queryFn: () => apiClient.getStatisticsTimeseries({ timeRange, granularity: 'day' }),
    select: (response) => response.data,
  });

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  const isLoading = overviewLoading || categoriesLoading || dailyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">Failed to load statistics</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Statistics</h1>
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {overview && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-6 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Time</h3>
                <p className="text-3xl font-bold text-primary">
                  {formatHours(overview.totalTrackedTime)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  All tracked activities
                </p>
              </div>

              <div className="p-6 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Today</h3>
                <p className="text-3xl font-bold text-secondary">
                  {formatHours(overview.totalTimeToday)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Time tracked today
                </p>
              </div>

              <div className="p-6 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">This {timeRange}</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatHours(
                    timeRange === 'week'
                      ? overview.totalTimeThisWeek
                      : timeRange === 'month'
                      ? overview.totalTimeThisMonth
                      : overview.totalTrackedTime
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total this {timeRange}
                </p>
              </div>

              <div className="p-6 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Average</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {formatHours(Math.floor(overview.totalTrackedTime / 30))}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Per day this month
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            {categoryStats && categoryStats.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="p-6 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
                  <div className="space-y-4">
                    {categoryStats.map((category: CategoryStat) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatHours(category.totalTime)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPercentage(category.percentage)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simple Category Distribution Bar Chart */}
                <div className="p-6 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Time Distribution</h2>
                  <div className="space-y-3">
                    {categoryStats.map((category: CategoryStat) => (
                      <div key={category.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category.category}</span>
                          <span>{formatPercentage(category.percentage)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: category.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Daily Activity Chart */}
            {dailyStats && dailyStats.length > 0 && (
              <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Daily Activity</h2>
                <div className="space-y-2">
                  {dailyStats.slice(-7).map((day: DailyStat) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.activitiesCompleted} activities
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="h-2 bg-primary rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                (day.totalTime / Math.max(...dailyStats.map(d => d.totalTime))) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-sm font-medium w-16 text-right">
                          {formatHours(day.totalTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productivity Insights */}
            <div className="mt-8 p-6 border rounded-lg bg-muted/20">
              <h2 className="text-xl font-semibold mb-4">Quick Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {overview.totalTrackedTime > 0
                      ? formatHours(Math.floor(overview.totalTrackedTime / 7))
                      : '0h'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Daily average this week
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {categoryStats?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Categories tracked
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {dailyStats?.filter(d => d.totalTime > 0).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Active days this {timeRange}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}