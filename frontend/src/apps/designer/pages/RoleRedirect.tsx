import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.roles) {
      // Handle both string array and object array formats
      const isDesigner = user.roles.some((role: any) => {
        if (typeof role === 'string') {
          return role.toLowerCase() === 'designer';
        }
        return role.role_name?.toLowerCase() === 'designer';
      });
      
      if (isDesigner) {
        navigate('/dashboard/designer/modules', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  return null;
};

export default RoleRedirect;
