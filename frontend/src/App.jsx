import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/common/Layout";
import Dashboard from "./pages/Dashboard";
import UploadFragments from "./pages/UploadFragments";
import FragmentMatching from "./pages/FragmentMatching";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForensicReports from "./pages/ForensicReports";
import OCRReview from "./pages/OCRReview";
import Settings from "./pages/Settings";
import AuditLog from "./pages/AuditLog";
import CaseDetail from "./pages/CaseDetail";
import NotFound from "./pages/NotFound";
import Timeline from "./pages/Timeline";
import Analytics from "./pages/Analytics";
import Search from "./pages/Search";
import ExportCenter from "./pages/ExportCenter";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<UploadFragments />} />
        <Route path="matching" element={<FragmentMatching />} />
        <Route path="ocr" element={<OCRReview />} />
        <Route path="reports" element={<ForensicReports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="search" element={<Search />} />
        <Route path="export" element={<ExportCenter />} />
        <Route path="case/:caseId" element={<CaseDetail />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
