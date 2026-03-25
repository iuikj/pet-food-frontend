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

function SplashScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background-light to-secondary/20 dark:from-primary/10 dark:via-background-dark dark:to-secondary/10 overflow-hidden relative">
      {/* Floating decorative bubbles */}
      <div className="absolute top-[15%] left-[12%] w-16 h-16 rounded-full bg-primary/20 animate-float" />
      <div className="absolute top-[25%] right-[15%] w-10 h-10 rounded-full bg-secondary/30 animate-float" style={{ animationDelay: '0.8s' }} />
      <div className="absolute bottom-[22%] left-[20%] w-12 h-12 rounded-full bg-accent-blue/25 animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-[30%] right-[10%] w-8 h-8 rounded-full bg-primary/15 animate-float" style={{ animationDelay: '2.2s' }} />

      {/* Paw trail — 3 small paw prints walking toward center */}
      <div className="absolute top-[38%] left-[22%] text-primary/30 animate-paw-step" style={{ animationDelay: '0s' }}>
        <span className="material-icons-round text-2xl">pets</span>
      </div>
      <div className="absolute top-[42%] left-[35%] text-primary/40 animate-paw-step" style={{ animationDelay: '0.6s' }}>
        <span className="material-icons-round text-2xl">pets</span>
      </div>

      {/* Main icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 w-28 h-28 rounded-full bg-primary/20 blur-xl animate-pulse-slow" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow animate-bounce-gentle">
          <span className="material-icons-round text-white dark:text-gray-900 text-5xl">pets</span>
        </div>
        {/* Little food bowl accent */}
        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-soft animate-bounce-gentle" style={{ animationDelay: '0.3s' }}>
          <span className="material-icons-round text-yellow-800 text-lg">restaurant</span>
        </div>
      </div>

      {/* App name */}
      <h1 className="text-2xl font-bold font-display text-text-main-light dark:text-text-main-dark mb-1">
        PetCare
      </h1>
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8">
        智能宠物饮食助手
      </p>

      {/* Dot loading indicator */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary animate-dot-blink"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return <SplashScreen />;
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
