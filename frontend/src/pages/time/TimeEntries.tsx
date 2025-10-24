import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Button } from '../../components/ui/button';
import { useNavigation } from '../../router/routes';
import { apiClient } from '../../lib/api';
import { TimeEntry, TimeEntryFormData, validateForm, timeEntrySchema } from '../../types';
import { toast } from '../../lib/toast';

export function TimeEntries() {
  const navigateTo = useNavigation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  // Fetch time entries
  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => apiClient.getTimeEntries(),
    select: (response) => response.data,
  });

  // Create time entry mutation
  const createMutation = useMutation({
    mutationFn: (data: TimeEntryFormData) => apiClient.createTimeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Time entry created', 'Your time entry has been recorded');
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to create time entry', error.message);
    },
  });

  // Update time entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntryFormData> }) =>
      apiClient.updateTimeEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Time entry updated', 'Your changes have been saved');
      setEditingEntry(null);
    },
    onError: (error: Error) => {
      toast.error('Failed to update time entry', error.message);
    },
  });

  // Delete time entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Time entry deleted', 'The entry has been removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete time entry', error.message);
    },
  });

  // Form for creating/editing entries
  const form = useForm<TimeEntryFormData>({
    defaultValues: {
      description: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: '',
      category: 'Work',
      tags: [],
    },
    onSubmit: async (values) => {
      const validation = validateForm(timeEntrySchema, values);
      if (!validation.success) {
        toast.error('Please fix the errors in the form');
        return;
      }

      if (editingEntry) {
        updateMutation.mutate({ id: editingEntry, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleStartTimer = () => {
    setIsCreating(true);
    form.setFieldValue('startTime', new Date().toISOString().slice(0, 16));
    form.setFieldValue('endTime', '');
  };

  const handleStopTimer = (entry: TimeEntry) => {
    const endTime = new Date().toISOString().slice(0, 16);
    updateMutation.mutate({
      id: entry.id,
      data: { endTime },
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Active';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
            <p className="text-muted-foreground">Failed to load time entries</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Time Entries</h1>
          <div className="space-x-2">
            <Button onClick={handleStartTimer} variant="outline">
              Start Timer
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              Add Entry
            </Button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingEntry) && (
          <div className="mb-8 p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">
              {editingEntry ? 'Edit Entry' : 'Create New Entry'}
            </h2>
            <form onSubmit={form.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  {...form.getFieldProps('description')}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="What are you working on?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    {...form.getFieldProps('startTime')}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    {...form.getFieldProps('endTime')}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
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

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingEntry ? 'Update' : 'Create'} Entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingEntry(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Time Entries List */}
        <div className="space-y-4">
          {entries?.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No time entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your time to see your entries here
              </p>
              <Button onClick={handleStartTimer}>Start Your First Entry</Button>
            </div>
          ) : (
            entries?.map((entry: TimeEntry) => (
              <div
                key={entry.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{entry.description}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{new Date(entry.startTime).toLocaleString()}</span>
                      {entry.endTime && (
                        <>
                          <span> - {new Date(entry.endTime).toLocaleString()}</span>
                          <span className="ml-2 font-medium">
                            ({formatDuration(entry.startTime, entry.endTime)})
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                        {entry.category}
                      </span>
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!entry.endTime && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopTimer(entry)}
                      >
                        Stop
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEntry(entry.id);
                        form.setValues({
                          description: entry.description,
                          startTime: entry.startTime,
                          endTime: entry.endTime || '',
                          category: entry.category,
                          tags: entry.tags,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(entry.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}