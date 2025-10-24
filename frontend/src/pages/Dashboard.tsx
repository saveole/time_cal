import React from 'react';
import { Button } from '../components/ui/button';
import { useNavigation } from '../router/routes';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const navigateTo = useNavigation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigateTo.navigateToLogin();
            }}
          >
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Today's Time</h2>
            <p className="text-3xl font-bold text-primary">4h 32m</p>
            <p className="text-sm text-muted-foreground mt-1">
              3 entries logged
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">This Week</h2>
            <p className="text-3xl font-bold text-secondary">28h 15m</p>
            <p className="text-sm text-muted-foreground mt-1">
              12% increase from last week
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Daily Goal</h2>
            <p className="text-3xl font-bold text-green-600">✓ Met</p>
            <p className="text-sm text-muted-foreground mt-1">
              5h 0m of 5h 0m completed
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Active Streak</h2>
            <p className="text-3xl font-bold text-orange-600">7 days</p>
            <p className="text-sm text-muted-foreground mt-1">
              Keep it going!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() => navigateTo.navigateToTimeEntries()}
                className="w-full justify-start"
              >
                Start Time Entry
              </Button>
              <Button
                onClick={() => navigateTo.navigateToToday()}
                variant="outline"
                className="w-full justify-start"
              >
                View Today's Plan
              </Button>
              <Button
                onClick={() => navigateTo.navigateToStatistics()}
                variant="outline"
                className="w-full justify-start"
              >
                View Statistics
              </Button>
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Project Development</span>
                <span className="text-muted-foreground">2h 15m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Team Meeting</span>
                <span className="text-muted-foreground">45m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Code Review</span>
                <span className="text-muted-foreground">1h 32m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}