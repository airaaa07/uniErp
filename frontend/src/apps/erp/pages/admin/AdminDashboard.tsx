import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Handshake as HandshakeIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI, userAPI } from "../../services/api";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    colleges: 0,
    arrangements: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const [instRes, arrRes, usersRes] = await Promise.all([
        erpRecordAPI.getRecordsByModule("institute_master"),
        erpRecordAPI.getRecordsByModule("counsellor_arrangement"),
        userAPI.getAll(),
      ]);

      setCounts({
        colleges: instRes.data?.length || 0,
        arrangements: arrRes.data?.length || 0,
        users: usersRes.data?.length || 0,
      });
    } catch (err) {
      console.error("Failed to load admin counts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress size={40} sx={{ color: "#650C08" }} />
      </Box>
    );
  }

  const sections = [
    {
      title: "Colleges & Institutes",
      count: counts.colleges,
      icon: <BusinessIcon sx={{ fontSize: 40, color: "#650C08" }} />,
      path: "/admin/dashboard/modules/institute_master",
      description: "Manage university campuses, location details, contact info, and closure dates.",
      btnText: "Manage Colleges",
    },
    {
      title: "Counsellor Allocations",
      count: counts.arrangements,
      icon: <HandshakeIcon sx={{ fontSize: 40, color: "#650C08" }} />,
      path: "/admin/dashboard/modules/counsellor_arrangement",
      description: "Oversee counselor fee sharing arrangements and stream allocations.",
      btnText: "Manage Allocations",
    },
    {
      title: "User Administration",
      count: counts.users,
      icon: <PeopleIcon sx={{ fontSize: 40, color: "#650C08" }} />,
      path: "/admin/dashboard/users",
      description: "Perform system user management, update credentials, and assign roles.",
      btnText: "Manage Users",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            University Administration Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Welcome, {user?.first_name || user?.username}! Perform system configuration, create colleges/institutes, manage counsellor arrangements, and administer roles and users.
          </Typography>
        </Box>
        <BusinessIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Grid of Sections */}
      <Grid container spacing={4}>
        {sections.map((section, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card sx={{ borderRadius: 4, height: "100%", display: "flex", flexDirection: "column", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
              <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    {section.icon}
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#650C08" }}>
                      {section.count}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    {section.description}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(section.path)}
                  sx={{
                    mt: "auto",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#650C08",
                    borderColor: "#650C08",
                    "&:hover": { bgcolor: "rgba(101,12,8,0.02)", borderColor: "#7a1d16" },
                  }}
                >
                  {section.btnText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
