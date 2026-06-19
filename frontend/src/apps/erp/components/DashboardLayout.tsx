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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Badge as BadgeIcon,
  SupportAgent as SupportAgentIcon,
  Handshake as HandshakeIcon,
  AppRegistration as AppRegistrationIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Class as ClassIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const DRAWER_WIDTH = 260;

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout, fetchCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    try {
      setPwdLoading(true);
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      await fetchCurrentUser();
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Failed to update password. Please check your credentials.');
    } finally {
      setPwdLoading(false);
    }
  };

  const isStudent = user?.roles?.some((role: any) => {
    if (typeof role === 'string') {
      return role.toLowerCase() === 'student';
    }
    return role.role_name?.toLowerCase() === 'student';
  }) || false;



  const isCounsellor = user?.roles?.some((role: any) => {
    const name = typeof role === 'string' ? role : role.role_name;
    return name?.toLowerCase() === 'counsellor';
  }) || false;

  const isFinance = user?.roles?.some((role: any) => {
    const name = typeof role === 'string' ? role : role.role_name;
    return name?.toLowerCase() === 'finance controller';
  }) || false;

  const isOfficer = user?.roles?.some((role: any) => {
    const name = typeof role === 'string' ? role : role.role_name;
    return name?.toLowerCase() === 'admission officer';
  }) || false;

  const isRegistrar = user?.roles?.some((role: any) => {
    const name = typeof role === 'string' ? role : role.role_name;
    return name?.toLowerCase() === 'registrar';
  }) || false;

  const isCollegeAdmin = user?.roles?.some((role: any) => {
    const name = typeof role === 'string' ? role : role.role_name;
    return name?.toLowerCase() === 'college admin';
  }) || false;


  // Section header type — rendered as a non-clickable label in drawer
  type SectionHeader = { type: 'header'; text: string };
  type MenuItem = { text: string; icon: React.ReactNode; path: string; type?: never };
  type NavItem = MenuItem | SectionHeader;

  const menuItems: NavItem[] = isStudent
    ? [
      { text: 'My Application', icon: <DashboardIcon />, path: '/student/dashboard' },
      { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile' },
      { text: 'Help & Contact', icon: <HelpIcon />, path: '/student/help' },
    ]
    : isCounsellor
      ? [
        { text: 'Counsellor Dashboard', icon: <DashboardIcon />, path: '/counsellor/dashboard' },
      ]
      : isFinance
        ? [
          { text: 'Finance Dashboard', icon: <DashboardIcon />, path: '/finance/dashboard' },
        ]
        : isOfficer
          ? [
            { text: 'Admission Officer Dashboard', icon: <DashboardIcon />, path: '/officer/dashboard' },
          ]
          : isRegistrar
            ? [
              { text: 'Registrar Dashboard', icon: <DashboardIcon />, path: '/registrar/dashboard' },
            ]
            : isCollegeAdmin
              ? [
                { text: 'College Dashboard', icon: <DashboardIcon />, path: '/college/dashboard' },
                { type: 'header', text: 'ACADEMICS' } as SectionHeader,
                { text: 'Courses Catalogue', icon: <SchoolIcon />, path: '/admin/dashboard/modules/course_master' },
                { text: 'Streams / Branches', icon: <ClassIcon />, path: '/admin/dashboard/modules/streams_master' },
                { text: 'Subjects & Syllabus', icon: <BookIcon />, path: '/admin/dashboard/modules/subject_master' },
                { type: 'header', text: 'ADMISSIONS' } as SectionHeader,
                { text: 'Student Inquiries', icon: <AssignmentIcon />, path: '/admin/dashboard/modules/inquiry_master' },
                { text: 'Student Registrations', icon: <AppRegistrationIcon />, path: '/admin/dashboard/modules/registration' },
                { text: 'Student Enrollments', icon: <BadgeIcon />, path: '/admin/dashboard/modules/enrollment_master' },
                { type: 'header', text: 'FINANCE' } as SectionHeader,
                { text: 'Fee Structures', icon: <AttachMoneyIcon />, path: '/admin/dashboard/modules/fee_master' },
                { type: 'header', text: 'PEOPLE' } as SectionHeader,
                { text: 'College Staff / Users', icon: <PeopleIcon />, path: '/college/users' },
              ]
              : [
                // University Admin / Super Admin — organized sections
                { text: 'Admin Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
                { type: 'header', text: 'ORGANISATION' } as SectionHeader,
                { text: 'Colleges & Institutes', icon: <BusinessIcon />, path: '/admin/dashboard/modules/institute_master' },
                { text: 'Counsellor Allocations', icon: <HandshakeIcon />, path: '/admin/dashboard/modules/counsellor_arrangement' },
                { text: 'Counsellors Directory', icon: <SupportAgentIcon />, path: '/admin/dashboard/modules/counsellor_master' },
                { type: 'header', text: 'ACADEMICS' } as SectionHeader,
                { text: 'Courses Catalog', icon: <SchoolIcon />, path: '/admin/dashboard/modules/course_master' },
                { text: 'Streams Catalog', icon: <ClassIcon />, path: '/admin/dashboard/modules/streams_master' },
                { text: 'Fee Structures', icon: <AttachMoneyIcon />, path: '/admin/dashboard/modules/fee_master' },
                { type: 'header', text: 'ADMISSIONS' } as SectionHeader,
                { text: 'Admissions & Inquiries', icon: <AssignmentIcon />, path: '/admin/dashboard/modules/inquiry_master' },
                { text: 'Student Registrations', icon: <AppRegistrationIcon />, path: '/admin/dashboard/modules/registration' },
                { text: 'Student Enrollments', icon: <BadgeIcon />, path: '/admin/dashboard/modules/enrollment_master' },
                { type: 'header', text: 'PEOPLE' } as SectionHeader,
                { text: 'User Administration', icon: <PeopleIcon />, path: '/admin/dashboard/users' },
              ];

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
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(255, 255, 255, 0.8)' }}>
      <Toolbar sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #650C08 0%, #450805 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(101, 12, 8, 0.2)',
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
            background: 'linear-gradient(135deg, #650C08 0%, #000000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          University ERP
        </Typography>
      </Toolbar>

      <List sx={{ px: 2, flexGrow: 1, overflowY: 'auto' }}>
        {menuItems.map((item, idx) => {
          // Section header — render as a non-clickable label
          if (item.type === 'header') {
            return (
              <Box key={`header-${idx}`} sx={{ px: 1, pt: idx === 0 ? 0.5 : 2, pb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    color: 'text.disabled',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            );
          }

          const navItem = item as { text: string; icon: React.ReactNode; path: string };
          const isSelected = location.pathname === navItem.path;
          return (
            <ListItem key={navItem.text} disablePadding sx={{ mb: 0.5, position: 'relative' }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(navItem.path);
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
                  {navItem.icon}
                </ListItemIcon>
                <ListItemText
                  primary={navItem.text}
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
                      background: 'linear-gradient(180deg, #b77a6f 0%, #650C08 100%)',
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
                      backgroundColor: 'rgba(101, 12, 8, 0.06)',
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
              {user?.roles
                ? user.roles.map((role: any) => typeof role === 'string' ? role : role.role_name).join(', ')
                : 'User'}
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
              {(menuItems.find((item) => item.type !== 'header' && (item as any).path === location.pathname) as any)?.text || 'Dashboard'}
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

      {/* Force Change Password Dialog */}
      <Dialog
        open={!!user?.force_password_change}
        onClose={(_, reason) => {
          // Prevent closing via backdrop click or escape key
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            // no-op
          }
        }}
        slotProps={{
          backdrop: {
            onClick: (e) => e.stopPropagation(),
          },
          paper: {
            sx: { borderRadius: 4, p: 2 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#650C08', textAlign: 'center', pb: 1 }}>
          Action Required: Change Password
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            For security reasons, you must change your default password before accessing your student portal.
          </Typography>
          {pwdError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {pwdError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleForcePasswordChange} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="e.g. your DOB (DDMMYYYY)"
              required
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={pwdLoading}
              sx={{
                bgcolor: '#650C08',
                color: 'white',
                py: 1.25,
                fontWeight: 700,
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': { bgcolor: '#7a1d16' }
              }}
            >
              {pwdLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Update Password & Access Portal'}
            </Button>
            <Button
              variant="text"
              color="error"
              fullWidth
              onClick={handleLogout}
              sx={{ textTransform: 'none', mt: -1 }}
            >
              Cancel & Logout
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DashboardLayout;
