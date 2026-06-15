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
    mode: 'light',
    primary: {
      main: '#4f46e5', // Indigo 600
      light: '#818cf8', // Indigo 400
      dark: '#3730a3', // Indigo 800
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4', // Cyan 500
      light: '#67e8f9',
      dark: '#0e7490',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569', // Slate 600
      disabled: '#94a3b8',
    },
    divider: 'rgba(15, 23, 42, 0.06)',
  },
  typography: {
    fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    body1: { letterSpacing: '0.01em' },
    body2: { letterSpacing: '0.01em' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          padding: '8px 16px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
          },
        },
        outlined: {
          borderColor: 'rgba(79, 70, 229, 0.4)',
          '&:hover': {
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05), 0 4px 20px -2px rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 10px 40px -10px rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(15, 23, 42, 0.05)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(15, 23, 42, 0.12)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(15, 23, 42, 0.24)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4f46e5',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 12px',
          transition: 'all 0.2s',
          '&.Mui-selected': {
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            color: '#4f46e5',
            fontWeight: 600,
            '& .MuiListItemIcon-root': {
              color: '#4f46e5',
            },
            '&:hover': {
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          color: '#475569',
          backgroundColor: '#f8fafc',
          padding: '12px 16px',
        },
      },
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