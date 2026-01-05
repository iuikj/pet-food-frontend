import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import OnboardingName from './pages/OnboardingName';
import OnboardingBasic from './pages/OnboardingBasic';
import OnboardingHealth from './pages/OnboardingHealth';
import Loading from './pages/Loading';
import PlanSummary from './pages/PlanSummary';
import PlanDetails from './pages/PlanDetails';
import DashboardWeekly from './pages/DashboardWeekly';
import DashboardDaily from './pages/DashboardDaily';
import CalendarPage from './pages/CalendarPage';
import AnalysisPage from './pages/AnalysisPage';
import Profile from './pages/Profile';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardWeekly />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/plan/create" element={<Home />} />
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
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
