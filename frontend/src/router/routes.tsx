import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { ProtectedRoute } from '../contexts/AuthContext';
import { App } from '../App';

// Root route
const rootRoute = createRootRoute({
  component: App,
});

// Index route (redirect to dashboard)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    // Redirect authenticated users to dashboard
    const token = localStorage.getItem('auth_tokens');
    if (token) {
      throw redirect({ to: '/dashboard' });
    }
    // Otherwise show landing page
    throw redirect({ to: '/login' });
  },
});

// Auth routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => import('../pages/auth/Login').then(m => <m.Login />),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: () => import('../pages/auth/Register').then(m => <m.Register />),
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <ProtectedRoute>
      {import('../pages/Dashboard').then(m => <m.Dashboard />)}
    </ProtectedRoute>
  ),
});

// Time tracking routes
const timeEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/time-entries',
  component: () => (
    <ProtectedRoute>
      {import('../pages/time/TimeEntries').then(m => <m.TimeEntries />)}
    </ProtectedRoute>
  ),
});

const timeEntryRoute = createRoute({
  getParentRoute: () => timeEntriesRoute,
  path: '/$id',
  component: () => (
    <ProtectedRoute>
      {import('../pages/time/TimeEntryDetail').then(m => <m.TimeEntryDetail />)}
    </ProtectedRoute>
  ),
});

// Daily planning routes
const dailyPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/daily-plans',
  component: () => (
    <ProtectedRoute>
      {import('../pages/planning/DailyPlans').then(m => <m.DailyPlans />)}
    </ProtectedRoute>
  ),
});

const dailyPlanRoute = createRoute({
  getParentRoute: () => dailyPlansRoute,
  path: '/$id',
  component: () => (
    <ProtectedRoute>
      {import('../pages/planning/DailyPlanDetail').then(m => <m.DailyPlanDetail />)}
    </ProtectedRoute>
  ),
});

const todayPlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/today',
  component: () => (
    <ProtectedRoute>
      {import('../pages/planning/TodayPlan').then(m => <m.TodayPlan />)}
    </ProtectedRoute>
  ),
});

// Statistics routes
const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: () => (
    <ProtectedRoute>
      {import('../pages/statistics/Statistics').then(m => <m.Statistics />)}
    </ProtectedRoute>
  ),
});

const insightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/insights',
  component: () => (
    <ProtectedRoute>
      {import('../pages/statistics/Insights').then(m => <m.Insights />)}
    </ProtectedRoute>
  ),
});

// Profile route
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => (
    <ProtectedRoute>
      {import('../pages/profile/Profile').then(m => <m.Profile />)}
    </ProtectedRoute>
  ),
});

// Settings route
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <ProtectedRoute>
      {import('../pages/settings/Settings').then(m => <m.Settings />)}
    </ProtectedRoute>
  ),
});

// Create router instance
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    loginRoute,
    registerRoute,
    dashboardRoute,
    timeEntriesRoute.addChildren([timeEntryRoute]),
    dailyPlansRoute.addChildren([dailyPlanRoute]),
    todayPlanRoute,
    statisticsRoute,
    insightsRoute,
    profileRoute,
    settingsRoute,
  ]),
});

// Route definitions for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Navigation utilities
export const routes = {
  index: () => ({ to: '/' }),
  login: () => ({ to: '/login' }),
  register: () => ({ to: '/register' }),
  dashboard: () => ({ to: '/dashboard' }),
  timeEntries: () => ({ to: '/time-entries' }),
  timeEntry: (id: string) => ({ to: '/time-entries/$id', params: { id } }),
  dailyPlans: () => ({ to: '/daily-plans' }),
  dailyPlan: (id: string) => ({ to: '/daily-plans/$id', params: { id } }),
  today: () => ({ to: '/today' }),
  statistics: () => ({ to: '/statistics' }),
  insights: () => ({ to: '/insights' }),
  profile: () => ({ to: '/profile' }),
  settings: () => ({ to: '/settings' }),
} as const;

// Navigation hook
export const useNavigation = () => {
  const navigate = router.useNavigate();

  return {
    navigateTo: (path: string) => navigate({ to: path }),
    navigateToIndex: () => navigate(routes.index()),
    navigateToLogin: () => navigate(routes.login()),
    navigateToRegister: () => navigate(routes.register()),
    navigateToDashboard: () => navigate(routes.dashboard()),
    navigateToTimeEntries: () => navigate(routes.timeEntries()),
    navigateToTimeEntry: (id: string) => navigate(routes.timeEntry(id)),
    navigateToDailyPlans: () => navigate(routes.dailyPlans()),
    navigateToDailyPlan: (id: string) => navigate(routes.dailyPlan(id)),
    navigateToToday: () => navigate(routes.today()),
    navigateToStatistics: () => navigate(routes.statistics()),
    navigateToInsights: () => navigate(routes.insights()),
    navigateToProfile: () => navigate(routes.profile()),
    navigateToSettings: () => navigate(routes.settings()),
    navigateToLogout: () => {
      // Clear tokens and redirect to login
      localStorage.removeItem('auth_tokens');
      navigate(routes.login());
    },
    goBack: () => window.history.back(),
  };
};