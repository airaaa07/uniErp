import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as RoleIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ViewModule as ModuleIcon,
  Tune as FieldIcon,
  ViewColumn as ColumnIcon,
  ViewQuilt as LayoutIcon,
  Visibility as PreviewIcon,
  TableChart as RecordIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DRAWER_WIDTH = 260;

const adminMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Users', icon: <PeopleIcon />, path: '/dashboard/users' },
  { text: 'Roles', icon: <RoleIcon />, path: '/dashboard/roles' },
  { text: 'Audit Logs', icon: <AuditIcon />, path: '/dashboard/audit' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
];

const designerMenuItems = [
  { text: 'Module Designer', icon: <ModuleIcon />, path: '/dashboard/designer/modules' },
  { text: 'Column Designer', icon: <ColumnIcon />, path: '/dashboard/designer/columns' },
  { text: 'Field Designer', icon: <FieldIcon />, path: '/dashboard/designer/fields' },
  { text: 'Form Layout', icon: <LayoutIcon />, path: '/dashboard/designer/layout' },
  { text: 'Form Preview', icon: <PreviewIcon />, path: '/dashboard/designer/preview' },
  { text: 'Record Viewer', icon: <RecordIcon />, path: '/dashboard/designer/records' },
];

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine menu items based on user role
  const isDesigner = user?.roles?.some((role: any) => {
    if (typeof role === 'string') {
      return role.toLowerCase() === 'designer';
    }
    return role.role_name?.toLowerCase() === 'designer';
  }) || false;
  const menuItems = isDesigner ? designerMenuItems : adminMenuItems;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/designer/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(255, 255, 255, 0.8)' }}>
      <Toolbar sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800 }}>
            U
          </Typography>
        </Box>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          {isDesigner ? 'Designer Studio' : 'University ERP'}
        </Typography>
      </Toolbar>
      
      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5, position: 'relative' }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: 'transparent !important',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? 'primary.main' : 'text.secondary',
                      }
                    }
                  }}
                />
                
                {isSelected && (
                  <Box
                    component={motion.div}
                    layoutId="activeIndicator"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: '15%',
                      width: 4,
                      height: '70%',
                      borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                    }}
                  />
                )}
                
                {isSelected && (
                  <Box
                    component={motion.div}
                    layoutId="activeBg"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: -1,
                      borderRadius: 2,
                      backgroundColor: 'rgba(79, 70, 229, 0.06)',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ p: 2, borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user?.username?.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {isDesigner ? 'Designer' : 'Administrator'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                color: 'slate.900',
              }}
            >
              {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          <Box>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              sx={{ p: 0.5, border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '50%' }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {user?.username?.substring(0, 2).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1.5,
                    minWidth: 160,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: 2,
                  },
                }
              }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important', pb: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {user?.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || 'Active Session'}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(15, 23, 42, 0.06)',
              bgcolor: 'transparent',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            <Box
              key={location.pathname}
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Outlet />
            </Box>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
