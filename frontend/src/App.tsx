import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// ================= Portal Selector Landing Page =================
import PortalSelector from './apps/PortalSelector';

// ================= DESIGNER PORTAL APP =================
import { AuthProvider as DesignerAuthProvider } from './apps/designer/contexts/AuthContext';
import ProtectedRouteDesigner from './apps/designer/components/ProtectedRoute';
import DashboardLayoutDesigner from './apps/designer/components/DashboardLayout';
import DesignerLogin from './apps/designer/pages/Login';
import Register from './apps/designer/pages/Register';
import RoleRedirect from './apps/designer/pages/RoleRedirect';
import Users from './apps/designer/pages/Users';
import Roles from './apps/designer/pages/Roles';
import AuditLogs from './apps/designer/pages/AuditLogs';
import Settings from './apps/designer/pages/Settings';
import ModuleDesigner from './apps/designer/pages/ModuleDesigner';
import FieldDesigner from './apps/designer/pages/FieldDesigner';
import ColumnDesigner from './apps/designer/pages/ColumnDesigner';
import FormLayoutDesigner from './apps/designer/pages/FormLayoutDesigner';
import FormPreview from './apps/designer/pages/FormPreview';
import RecordViewer from './apps/designer/pages/RecordViewer';

// ================= ERP PORTAL APP =================
import { AuthProvider as ERPAuthProvider } from './apps/erp/contexts/AuthContext';
import ProtectedRouteERP from './apps/erp/components/ProtectedRoute';
import DashboardLayoutERP from './apps/erp/components/DashboardLayout';
import ERPLogin from './apps/erp/pages/Login';
import AdmissionRegister from './apps/erp/pages/Register';
import ERPUsers from './apps/erp/pages/admin/Users';
import ModuleRecordManager from './apps/erp/pages/admin/ModuleRecordManager';
import StudentDashboard from './apps/erp/pages/student/StudentDashboard';
import CounsellorDashboard from './apps/erp/pages/counsellor/CounsellorDashboard';
import FinanceDashboard from './apps/erp/pages/finance/FinanceDashboard';
import OfficerDashboard from './apps/erp/pages/officer/OfficerDashboard';
import RegistrarDashboard from './apps/erp/pages/registrar/RegistrarDashboard';
import CollegeDashboard from './apps/erp/pages/college/CollegeDashboard';

// ================= THEMES =================
const designerTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Sleek Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e', // Rose
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
});

const erpTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#650C08', // Deep Red (University Branding)
      light: '#b77a6f',
      dark: '#450805',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4', // Cyan
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
});

function App() {
  return (
    <Router>
      <Routes>
        {/* ================= PORTAL SELECTOR (LANDING) ================= */}
        <Route path="/" element={<PortalSelector />} />

        {/* ================= ERP CLIENT APP ROUTES ================= */}
        <Route
          path="/*"
          element={
            <ERPAuthProvider>
              <ThemeProvider theme={erpTheme}>
                <CssBaseline />
                <Routes>
                  <Route path="login" element={<ERPLogin />} />
                  <Route path="register" element={<AdmissionRegister />} />
                  <Route
                    path="student/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<StudentDashboard />} />
                  </Route>
                  <Route
                    path="counsellor/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<CounsellorDashboard />} />
                  </Route>
                  <Route
                    path="finance/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<FinanceDashboard />} />
                  </Route>
                  <Route
                    path="officer/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<OfficerDashboard />} />
                  </Route>
                  <Route
                    path="registrar/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<RegistrarDashboard />} />
                  </Route>
                  <Route
                    path="college/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<CollegeDashboard />} />
                  </Route>
                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRouteERP>
                        <DashboardLayoutERP />
                      </ProtectedRouteERP>
                    }
                  >
                    <Route index element={<div className="p-6 text-xl font-semibold text-[#650C08]">Welcome to the University ERP Admissions Funnel.</div>} />
                    <Route path="users" element={<ERPUsers />} />
                    <Route path="modules/:moduleKey" element={<ModuleRecordManager />} />
                  </Route>
                  {/* Default fallback for ERP */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </ThemeProvider>
            </ERPAuthProvider>
          }
        />

        {/* ================= ERP STUDIO DESIGNER ROUTES ================= */}
        <Route
          path="/designer/*"
          element={
            <DesignerAuthProvider>
              <ThemeProvider theme={designerTheme}>
                <CssBaseline />
                <Routes>
                  <Route path="login" element={<DesignerLogin />} />
                  <Route path="register" element={<Register />} />
                  <Route path="*" element={<Navigate to="/designer/login" replace />} />
                </Routes>
              </ThemeProvider>
            </DesignerAuthProvider>
          }
        />

        {/* Designer Dashboard Routes mounted at /dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <DesignerAuthProvider>
              <ThemeProvider theme={designerTheme}>
                <CssBaseline />
                <Routes>
                  <Route
                    path=""
                    element={
                      <ProtectedRouteDesigner>
                        <DashboardLayoutDesigner />
                      </ProtectedRouteDesigner>
                    }
                  >
                    <Route index element={<RoleRedirect />} />
                    <Route path="users" element={<Users />} />
                    <Route path="roles" element={<Roles />} />
                    <Route path="audit" element={<AuditLogs />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="designer/modules" element={<ModuleDesigner />} />
                    <Route path="designer/fields" element={<FieldDesigner />} />
                    <Route path="designer/columns" element={<ColumnDesigner />} />
                    <Route path="designer/layout" element={<FormLayoutDesigner />} />
                    <Route path="designer/preview" element={<FormPreview />} />
                    <Route path="designer/records" element={<RecordViewer />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/designer/login" replace />} />
                </Routes>
              </ThemeProvider>
            </DesignerAuthProvider>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;