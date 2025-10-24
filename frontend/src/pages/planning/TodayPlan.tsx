import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Button } from '../../components/ui/button';
import { useNavigation } from '../../router/routes';
import { apiClient } from '../../lib/api';
import { DailyPlan, Activity, ActivityUpdateFormData, validateForm, dailyPlanSchema } from '../../types';
import { toast } from '../../lib/toast';

export function TodayPlan() {
  const navigateTo = useNavigation();
  const queryClient = useQueryClient();
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's plan
  const { data: plan, isLoading, error, refetch } = useQuery({
    queryKey: ['todayPlan'],
    queryFn: () => apiClient.getTodayPlan(),
    select: (response) => response.data,
  });

  // Create today's plan mutation
  const createPlanMutation = useMutation({
    mutationFn: () => apiClient.createDailyPlan({
      date: today,
      activities: [],
      status: 'active',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayPlan'] });
      toast.success('Plan created', "Today's plan has been created");
    },
    onError: (error: Error) => {
      toast.error('Failed to create plan', error.message);
    },
  });

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: ({ planId, activityId, data }: {
      planId: string;
      activityId: string;
      data: ActivityUpdateFormData
    }) => apiClient.updateActivity(planId, activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayPlan'] });
      toast.success('Activity updated', 'Your changes have been saved');
      setEditingActivity(null);
    },
    onError: (error: Error) => {
      toast.error('Failed to update activity', error.message);
    },
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: (data: Omit<Activity, 'id'>) => {
      if (!plan) throw new Error('No plan found');
      return apiClient.createDailyPlan({
        ...plan,
        activities: [...plan.activities, { ...data, id: Date.now().toString() }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayPlan'] });
      toast.success('Activity added', 'New activity has been added to your plan');
      setIsAddingActivity(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to add activity', error.message);
    },
  });

  // Form for adding/editing activities
  const form = useForm({
    defaultValues: {
      description: '',
      estimatedTime: 30,
      category: 'Work',
      priority: 'medium' as const,
    },
    onSubmit: async (values) => {
      if (editingActivity && plan) {
        updateActivityMutation.mutate({
          planId: plan.id,
          activityId: editingActivity,
          data: values,
        });
      } else {
        const newActivity: Omit<Activity, 'id'> = {
          ...values,
          status: 'pending',
          order: plan?.activities.length || 0,
          actualTime: undefined,
        };
        addActivityMutation.mutate(newActivity);
      }
    },
  });

  const handleStatusChange = (activity: Activity, newStatus: Activity['status']) => {
    if (plan) {
      updateActivityMutation.mutate({
        planId: plan.id,
        activityId: activity.id,
        data: { status: newStatus },
      });
    }
  };

  const handleStartActivity = (activity: Activity) => {
    if (plan) {
      updateActivityMutation.mutate({
        planId: plan.id,
        activityId: activity.id,
        data: {
          status: 'in_progress',
          actualTime: 0,
        },
      });
    }
  };

  const handleCompleteActivity = (activity: Activity, actualTime: number) => {
    if (plan) {
      updateActivityMutation.mutate({
        planId: plan.id,
        activityId: activity.id,
        data: {
          status: 'completed',
          actualTime,
        },
      });
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">Failed to load today's plan</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Today's Plan</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="space-x-2">
            {!plan && (
              <Button onClick={() => createPlanMutation.mutate()}>
                Create Today's Plan
              </Button>
            )}
            {plan && (
              <Button onClick={() => setIsAddingActivity(true)}>
                Add Activity
              </Button>
            )}
          </div>
        </div>

        {!plan ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No plan for today yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a plan to organize your activities and track your progress
            </p>
            <Button onClick={() => createPlanMutation.mutate()}>
              Create Today's Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Total Activities</h3>
                <p className="text-2xl font-bold">{plan.activities.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Estimated Time</h3>
                <p className="text-2xl font-bold">
                  {formatTime(plan.totalEstimatedTime)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Completed</h3>
                <p className="text-2xl font-bold text-green-600">
                  {plan.activities.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>

            {/* Add/Edit Activity Form */}
            {(isAddingActivity || editingActivity) && (
              <div className="p-6 border rounded-lg bg-card mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingActivity ? 'Edit Activity' : 'Add New Activity'}
                </h2>
                <form onSubmit={form.handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <input
                      type="text"
                      {...form.getFieldProps('description')}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="What do you need to do?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Estimated Time (minutes)</label>
                      <input
                        type="number"
                        {...form.getFieldProps('estimatedTime')}
                        className="w-full px-3 py-2 border rounded-md"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        {...form.getFieldProps('category')}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="Work">Work</option>
                        <option value="Personal">Personal</option>
                        <option value="Learning">Learning</option>
                        <option value="Exercise">Exercise</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      {...form.getFieldProps('priority')}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={addActivityMutation.isPending || updateActivityMutation.isPending}
                    >
                      {editingActivity ? 'Update' : 'Add'} Activity
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingActivity(false);
                        setEditingActivity(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Activities List */}
            <div className="space-y-3">
              {plan.activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No activities yet. Add your first activity to get started!
                  </p>
                  <Button onClick={() => setIsAddingActivity(true)}>
                    Add First Activity
                  </Button>
                </div>
              ) : (
                plan.activities
                  .sort((a, b) => a.order - b.order)
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{activity.description}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(activity.status)}`}>
                              {activity.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(activity.priority)}`}>
                              {activity.priority}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>Category: {activity.category}</span>
                            <span className="ml-4">
                              Estimated: {formatTime(activity.estimatedTime)}
                            </span>
                            {activity.actualTime !== undefined && (
                              <span className="ml-4">
                                Actual: {formatTime(activity.actualTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {activity.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartActivity(activity)}
                            >
                              Start
                            </Button>
                          )}
                          {activity.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const actualTime = prompt(
                                  'Enter actual time spent (in minutes):',
                                  activity.estimatedTime.toString()
                                );
                                if (actualTime && !isNaN(Number(actualTime))) {
                                  handleCompleteActivity(activity, Number(actualTime));
                                }
                              }}
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingActivity(activity.id);
                              form.setValues({
                                description: activity.description,
                                estimatedTime: activity.estimatedTime,
                                category: activity.category,
                                priority: activity.priority,
                              });
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}