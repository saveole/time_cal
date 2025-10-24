import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { Button } from '../../components/ui/button';
import { apiClient } from '../../lib/api';
import { TimeEntry, TimeEntryFormData, validateForm, timeEntrySchema } from '../../types';
import { toast } from '../../lib/toast';

export function TimeEntryDetail() {
  const { id } = useParams({ from: '/time-entries/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);

  // Fetch time entry
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ['timeEntry', id],
    queryFn: () => apiClient.getTimeEntry(id!),
    select: (response) => response.data,
    enabled: !!id,
  });

  // Update time entry mutation
  const updateMutation = useMutation({
    mutationFn: (data: TimeEntryFormData) => apiClient.updateTimeEntry(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntry', id] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Time entry updated', 'Your changes have been saved');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to update time entry', error.message);
    },
  });

  // Delete time entry mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiClient.deleteTimeEntry(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Time entry deleted', 'The entry has been removed');
      navigate({ to: '/time-entries' });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete time entry', error.message);
    },
  });

  // Form for editing
  const form = useForm<TimeEntryFormData>({
    defaultValues: {
      description: entry?.description || '',
      startTime: entry?.startTime || '',
      endTime: entry?.endTime || '',
      category: entry?.category || 'Work',
      tags: entry?.tags || [],
    },
    onSubmit: async (values) => {
      const validation = validateForm(timeEntrySchema, values);
      if (!validation.success) {
        toast.error('Please fix the errors in the form');
        return;
      }
      updateMutation.mutate(values);
    },
  });

  // Update form values when entry changes
  React.useEffect(() => {
    if (entry) {
      form.setValues({
        description: entry.description,
        startTime: entry.startTime,
        endTime: entry.endTime || '',
        category: entry.category,
        tags: entry.tags,
      });
    }
  }, [entry, form]);

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

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Entry Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The time entry you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate({ to: '/time-entries' })}>
              Back to Time Entries
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
          <div>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/time-entries' })}
              className="mb-4"
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">Time Entry Details</h1>
          </div>
          <div className="space-x-2">
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this time entry?')) {
                  deleteMutation.mutate();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* View Mode */}
        {!isEditing && (
          <div className="space-y-6">
            <div className="p-6 border rounded-lg bg-card">
              <h2 className="text-2xl font-semibold mb-4">{entry.description}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Time Period</h3>
                  <div className="text-lg">
                    <p>{new Date(entry.startTime).toLocaleString()}</p>
                    {entry.endTime && (
                      <>
                        <p>to {new Date(entry.endTime).toLocaleString()}</p>
                        <p className="font-medium text-primary mt-2">
                          Duration: {formatDuration(entry.startTime, entry.endTime)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Category & Tags</h3>
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded text-sm">
                      {entry.category}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>{' '}
                    {new Date(entry.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Edit Time Entry</h2>
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

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  {...form.getFieldProps('tags')}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="tag1, tag2, tag3"
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    form.setFieldValue('tags', tags);
                  }}
                  value={form.getFieldValue('tags')?.join(', ') || ''}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    if (entry) {
                      form.setValues({
                        description: entry.description,
                        startTime: entry.startTime,
                        endTime: entry.endTime || '',
                        category: entry.category,
                        tags: entry.tags,
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}