import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PlanGenerationProvider } from './context/PlanGenerationContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import CreatePlan from './pages/CreatePlan';
import Login from './pages/Login';
import OnboardingName from './pages/OnboardingName';
import OnboardingBasic from './pages/OnboardingBasic';
import OnboardingHealth from './pages/OnboardingHealth';
import Loading from './pages/Loading';
import PlanSummary from './pages/PlanSummary';
import PlanDetails from './pages/PlanDetails';
import HomePage from './pages/HomePage';
import DashboardDaily from './pages/DashboardDaily';
import CalendarPage from './pages/CalendarPage';
import AnalysisPage from './pages/AnalysisPage';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import PetEdit from './pages/PetEdit';
import { useBackButton } from './hooks/useBackButton';

function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  // 处理移动端返回按钮
  useBackButton();

  // 处理通知点击 - 跳转到计划页面
  useEffect(() => {
    const notificationListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        console.log('Notification action performed:', notification);
        // 点击通知后跳转到计划页面
        const route = notification.notification?.extra?.route;
        if (route) {
          navigate(route);
        }
      }
    );

    return () => {
      notificationListener.remove();
    };
  }, [navigate]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/plan/create" element={<CreatePlan />} />
          <Route path="/plan/summary" element={<PlanSummary />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Full screen pages without bottom nav */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding/step1" element={<OnboardingName />} />
        <Route path="/onboarding/step2" element={<OnboardingBasic />} />
        <Route path="/onboarding/step3" element={<OnboardingHealth />} />
        <Route path="/planning" element={<Loading />} />
        <Route path="/plan/details" element={<PlanDetails />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/pet/edit/:id" element={<PetEdit />} />
      </Routes>
    </AnimatePresence>
  );
}


function App() {
  return (
    <Router>
      <PlanGenerationProvider>
        <AnimatedRoutes />
      </PlanGenerationProvider>
    </Router>
  );
}

export default App;
