import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthDrawer from '../components/auth/AuthDrawer';
import { useUser } from '../hooks/useUser';
import { registerBackButtonHandler } from '../hooks/useBackButton';
import AuthEntryContext from './AuthEntryContextValue';

const AUTH_HISTORY_MARKER = 'auth-drawer';

const AUTH_CONTEXT_LABELS = {
    calendar: '登录后查看喂养日程',
    recipes: '登录后管理饮食计划与食材库',
    plan: '登录后继续制定计划',
    summary: '登录后查看专属计划',
    profile: '登录后管理宠物档案',
    pet: '登录后添加宠物档案',
    default: '登录后继续当前操作',
};

function getLabel(context) {
    if (!context) return AUTH_CONTEXT_LABELS.default;
    return AUTH_CONTEXT_LABELS[context] || context;
}

function pushAuthHistory(view) {
    window.history.pushState(
        {
            ...(window.history.state || {}),
            authEntry: AUTH_HISTORY_MARKER,
            authView: view,
        },
        '',
    );
}

function isAuthHistoryState(state) {
    return state?.authEntry === AUTH_HISTORY_MARKER;
}

export function AuthEntryProvider({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useUser();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [authView, setAuthView] = useState('login');
    const [submitting, setSubmitting] = useState(false);
    const [entry, setEntry] = useState({ target: '/', context: 'default' });
    const drawerOpenRef = useRef(false);
    const authViewRef = useRef('login');
    const submittingRef = useRef(false);

    useEffect(() => {
        drawerOpenRef.current = drawerOpen;
    }, [drawerOpen]);

    useEffect(() => {
        authViewRef.current = authView;
    }, [authView]);

    useEffect(() => {
        submittingRef.current = submitting;
    }, [submitting]);

    const closeAuth = useCallback(({ fromHistory = false } = {}) => {
        if (submittingRef.current) return;
        setDrawerOpen(false);
        setAuthView('login');
        if (!fromHistory && isAuthHistoryState(window.history.state)) {
            window.history.back();
        }
    }, []);

    const requireAuth = useCallback((target, options = {}) => {
        if (isAuthenticated) {
            navigate(target);
            return true;
        }

        setEntry({
            target,
            context: options.context || 'default',
        });
        setAuthView('login');
        setDrawerOpen(true);
        pushAuthHistory('login');
        return false;
    }, [isAuthenticated, navigate]);

    const promptAuth = useCallback((options = {}) => {
        if (isAuthenticated) return true;
        const target = options.target || `${location.pathname}${location.search}${location.hash}`;
        setEntry({
            target,
            context: options.context || 'default',
        });
        setAuthView('login');
        setDrawerOpen(true);
        if (!isAuthHistoryState(window.history.state)) {
            pushAuthHistory('login');
        }
        return false;
    }, [isAuthenticated, location.hash, location.pathname, location.search]);

    const handleModeChange = useCallback((nextView) => {
        if (authViewRef.current === nextView) return;
        setAuthView(nextView);
        if (drawerOpenRef.current && !submittingRef.current) {
            pushAuthHistory(nextView);
        }
    }, []);

    const handleAuthSuccess = useCallback(() => {
        const target = entry.target || '/';
        setDrawerOpen(false);
        setAuthView('login');
        if (isAuthHistoryState(window.history.state)) {
            window.history.replaceState(
                {
                    ...(window.history.state || {}),
                    authEntry: undefined,
                    authView: undefined,
                },
                '',
            );
        }
        navigate(target, { replace: false });
    }, [entry.target, navigate]);

    useEffect(() => {
        const handlePopState = (event) => {
            if (!drawerOpenRef.current) return;
            if (submittingRef.current) {
                pushAuthHistory(authViewRef.current);
                return;
            }

            const nextView = event.state?.authView;
            if (isAuthHistoryState(event.state) && nextView) {
                setAuthView(nextView);
                return;
            }

            closeAuth({ fromHistory: true });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [closeAuth]);

    useEffect(() => registerBackButtonHandler(() => {
        if (!drawerOpenRef.current) return false;
        if (submittingRef.current) return true;
        window.history.back();
        return true;
    }), []);

    const value = useMemo(() => ({
        authDrawerOpen: drawerOpen,
        closeAuth,
        promptAuth,
        requireAuth,
    }), [closeAuth, drawerOpen, promptAuth, requireAuth]);

    return (
        <AuthEntryContext.Provider value={value}>
            {children}
            <AuthDrawer
                contextLabel={getLabel(entry.context)}
                onClose={() => closeAuth()}
                onModeChange={handleModeChange}
                onSubmittingChange={setSubmitting}
                onSuccess={handleAuthSuccess}
                open={drawerOpen}
                submitting={submitting}
                view={authView}
            />
        </AuthEntryContext.Provider>
    );
}

export default AuthEntryProvider;
