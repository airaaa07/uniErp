import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleRedirect from './pages/RoleRedirect';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import ModuleDesigner from './pages/designer/ModuleDesigner';
import FieldDesigner from './pages/designer/FieldDesigner';
import ColumnDesigner from './pages/designer/ColumnDesigner';
import FormLayoutDesigner from './pages/designer/FormLayoutDesigner';
import FormPreview from './pages/designer/FormPreview';
import RecordViewer from './pages/designer/RecordViewer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
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
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;