import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PlanGenerationProvider } from './context/PlanGenerationContext';
import { PetProvider } from './context/PetContext';
import { UserProvider, useUser } from './context/UserContext';
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

// 路由保护组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    // 显示加载状态
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

// 公开路由（已登录则跳转首页）
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

  // 处理移动端返回按钮
  useBackButton();

  // 处理通知点击 - 跳转到计划页面
  useEffect(() => {
    let listenerHandle = null;

    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        console.log('Notification action performed:', notification);
        // 点击通知后跳转到计划页面
        const route = notification.notification?.extra?.route;
        if (route) {
          navigate(route);
        }
      }
    ).then(handle => {
      listenerHandle = handle;
    }).catch(() => {
      // Web 环境下 Capacitor 插件不可用
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
        {/* 需要登录的页面（带底部导航） */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/plan/create" element={<CreatePlan />} />
          <Route path="/plan/summary" element={<PlanSummary />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 需要登录的页面（无底部导航） */}
        <Route path="/onboarding/step1" element={<ProtectedRoute><OnboardingName /></ProtectedRoute>} />
        <Route path="/onboarding/step2" element={<ProtectedRoute><OnboardingBasic /></ProtectedRoute>} />
        <Route path="/onboarding/step3" element={<ProtectedRoute><OnboardingHealth /></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute><Loading /></ProtectedRoute>} />
        <Route path="/plan/details" element={<ProtectedRoute><PlanDetails /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/pet/edit/:id" element={<ProtectedRoute><PetEdit /></ProtectedRoute>} />

        {/* 公开页面（未登录可访问） */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      </Routes>
    </AnimatePresence>
  );
}


function App() {
  return (
    <Router>
      <UserProvider>
        <PetProvider>
          <PlanGenerationProvider>
            <AnimatedRoutes />
          </PlanGenerationProvider>
        </PetProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
