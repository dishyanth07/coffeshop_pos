import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import CustomerHistory from './pages/CustomerHistory';
import Suppliers from './pages/Suppliers';
import RawMaterials from './pages/RawMaterials';
import PurchaseOrders from './pages/PurchaseOrders';
import BranchManagement from './pages/BranchManagement';
import StockTransfers from './pages/StockTransfers';
import CentralDashboard from './pages/CentralDashboard';
import TableManagement from './pages/TableManagement';
import PublicOrderPage from './pages/PublicOrderPage';
import SecurityDashboard from './pages/SecurityDashboard';
import EndShift from './pages/EndShift';
import ChangePassword from './pages/ChangePassword';
import StaffManagement from './pages/StaffManagement';
import LiveStream from './pages/LiveStream';
import SocialDashboard from './pages/SocialDashboard';
import MainLayout from './components/MainLayout';
import AssistantChat from './components/AssistantChat';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;

    // Force password change if required, unless already on the change-password page
    if (user.require_password_change && window.location.pathname !== '/change-password') {
        return <Navigate to="/change-password" />;
    }

    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
};

const AppContent = () => {
    const { user } = useAuth();

    return (
        <Router>
            <Toaster position="top-center" />
            <Routes>
                {/* Redirect logged-in users away from login page */}
                <Route
                    path="/login"
                    element={user ? <Navigate to="/pos" replace /> : <Login />}
                />

                <Route
                    path="/pos"
                    element={
                        <ProtectedRoute>
                            <POS />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute>
                            <Inventory />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/raw-materials"
                    element={
                        <ProtectedRoute>
                            <RawMaterials />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/suppliers"
                    element={
                        <ProtectedRoute>
                            <Suppliers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/purchase-orders"
                    element={
                        <ProtectedRoute>
                            <PurchaseOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute>
                            <CustomerHistory />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/branches"
                    element={
                        <ProtectedRoute>
                            <BranchManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/transfers"
                    element={
                        <ProtectedRoute>
                            <StockTransfers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <CentralDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tables"
                    element={
                        <ProtectedRoute>
                            <TableManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/security"
                    element={
                        <ProtectedRoute>
                            <SecurityDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/end-shift"
                    element={
                        <ProtectedRoute>
                            <EndShift />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/change-password"
                    element={
                        <ProtectedRoute>
                            <ChangePassword />
                        </ProtectedRoute>
                    }
                />
                <Route path="/staff" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
                <Route path="/live/:branchId?" element={<LiveStream />} />
                <Route
                    path="/social-dashboard"
                    element={
                        <ProtectedRoute>
                            <SocialDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/order/:branchId/:tableId" element={<PublicOrderPage />} />

                {/* Global entries */}
                <Route
                    path="/"
                    element={<Navigate to={user ? "/pos" : "/login"} replace />}
                />
            </Routes>
            {['owner', 'admin'].includes(user?.role?.toLowerCase()) && <AssistantChat />}
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <ChatProvider>
                <AppContent />
            </ChatProvider>
        </AuthProvider>
    );
}

export default App;
