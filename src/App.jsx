import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Activities from './pages/Activities';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Manual from './pages/Manual';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <DashboardLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="kanban" element={<Kanban />} />
                <Route path="activities" element={<Activities />} />
                <Route path="team" element={<Team />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="users" element={<Users />} />
                <Route path="manual" element={<Manual />} />
            </Route>
        </Routes>
    );
}

import { ActivitiesProvider } from './contexts/ActivitiesContext';
import { TeamProvider } from './contexts/TeamContext';

function App() {
    return (
        <TeamProvider>
            <AuthProvider>
                <ActivitiesProvider>
                    <Router>
                        <AppRoutes />
                    </Router>
                </ActivitiesProvider>
            </AuthProvider>
        </TeamProvider>
    )
}

export default App
