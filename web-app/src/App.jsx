import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PlanGenerationProvider } from './context/PlanGenerationProvider';
import { MealProvider } from './context/MealProvider';
import { PetProvider } from './context/PetProvider';
import { UserProvider } from './context/UserProvider';
import { useUser } from './hooks/useUser';
import Layout from './components/layout/Layout';
import CreatePlan from './pages/CreatePlan';
import Login from './pages/Login';
import OnboardingName from './pages/OnboardingName';
import OnboardingBasic from './pages/OnboardingBasic';
import OnboardingHealth from './pages/OnboardingHealth';
import Loading from './pages/Loading';
import PlanSummary from './pages/PlanSummary';
import HomePage from './pages/HomePage';
import DashboardDaily from './pages/DashboardDaily';
import CalendarPage from './pages/CalendarPage';
import RecipesPage from './pages/RecipesPage';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import PetEdit from './pages/PetEdit';
import { useBackButton } from './hooks/useBackButton';
import ScrollToTop from './components/ScrollToTop';
import Skeleton from './components/ui/Skeleton';

function AppSkeleton() {
  return (
    <div className="h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton.Circle size={48} />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton.Circle size={40} />
          <Skeleton.Circle size={40} />
        </div>
      </div>
      {/* Week bar */}
      <div className="px-6 mb-6">
        <div className="space-y-2 mb-4">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex justify-between bg-white dark:bg-surface-dark p-3 rounded-2xl">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-4" />
              <Skeleton.Circle size={36} />
            </div>
          ))}
        </div>
      </div>
      {/* Nutrition card */}
      <div className="px-6 mb-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
      {/* Meal cards */}
      <div className="px-6 space-y-4">
        <Skeleton className="h-5 w-28 mb-2" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-2xl">
            <Skeleton.Circle size={44} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <AppSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <AppSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  useBackButton();

  useEffect(() => {
    let listenerHandle = null;

    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        const route = notification.notification?.extra?.route;
        if (route) {
          navigate(route);
        }
      }
    ).then((handle) => {
      listenerHandle = handle;
    }).catch(() => {
    });

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [navigate]);

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/plan/create" element={<CreatePlan />} />
            <Route path="/plan/summary" element={<PlanSummary />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/onboarding/step1" element={<ProtectedRoute><OnboardingName /></ProtectedRoute>} />
          <Route path="/onboarding/step2" element={<ProtectedRoute><OnboardingBasic /></ProtectedRoute>} />
          <Route path="/onboarding/step3" element={<ProtectedRoute><OnboardingHealth /></ProtectedRoute>} />
          <Route path="/planning" element={<ProtectedRoute><Loading /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/pet/edit/:id" element={<ProtectedRoute><PetEdit /></ProtectedRoute>} />
          <Route path="/dashboard/daily" element={<ProtectedRoute><DashboardDaily /></ProtectedRoute>} />

          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <PetProvider>
          <MealProvider>
            <PlanGenerationProvider>
              <AnimatedRoutes />
            </PlanGenerationProvider>
          </MealProvider>
        </PetProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
