import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const userRoles = (user.roles || []).map((role: any) => {
      const name = typeof role === 'string' ? role : role.role_name;
      return name?.toLowerCase();
    });

    const hasAllowedRole = allowedRoles.some((role) =>
      userRoles.includes(role.toLowerCase())
    );

    if (!hasAllowedRole) {
      let redirectPath = "/login";
      if (userRoles.includes('student')) {
        redirectPath = "/student/dashboard";
      } else if (userRoles.includes('counsellor')) {
        redirectPath = "/counsellor/dashboard";
      } else if (userRoles.includes('finance controller')) {
        redirectPath = "/finance/dashboard";
      } else if (userRoles.includes('admission officer')) {
        redirectPath = "/officer/dashboard";
      } else if (userRoles.includes('registrar')) {
        redirectPath = "/registrar/dashboard";
      } else if (userRoles.includes('college admin')) {
        redirectPath = "/college/dashboard";
      } else if (
        userRoles.includes('super admin') ||
        userRoles.includes('university admin') ||
        userRoles.includes('admin')
      ) {
        redirectPath = "/admin/dashboard";
      }
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
