import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useEffect } from 'react';
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

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="material-icons-round text-4xl text-primary animate-spin">refresh</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="material-icons-round text-4xl text-primary animate-spin">refresh</span>
      </div>
    );
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
