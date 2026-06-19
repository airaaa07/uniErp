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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from "@mui/material";
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Handshake as HandshakeIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as FeeIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI, userAPI } from "../../services/api";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Enrolled": return { bg: "rgba(16,185,129,0.1)", text: "#10b981" };
    case "Approved": return { bg: "rgba(6,182,212,0.1)", text: "#0891b2" };
    case "Fee Paid": return { bg: "rgba(16,185,129,0.08)", text: "#059669" };
    case "Submitted": return { bg: "rgba(168,85,247,0.1)", text: "#a855f7" };
    case "Payment Pending": return { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" };
    case "Assigned": return { bg: "rgba(245,158,11,0.1)", text: "#d97706" };
    default: return { bg: "rgba(101,12,8,0.08)", text: "#650C08" };
  }
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  path: string;
  navigate: (p: string) => void;
}> = ({ title, value, icon, color, bgColor, path, navigate }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "none",
      cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.07)" },
    }}
    onClick={() => navigate(path)}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: bgColor }}>
          <Box sx={{ color, display: "flex" }}>{icon}</Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
        {title}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    colleges: 0,
    totalInquiries: 0,
    openInquiries: 0,
    courses: 0,
    pendingFee: 0,
    enrolled: 0,
    users: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [instRes, courseRes, inquiryRes, usersRes] = await Promise.all([
        erpRecordAPI.getRecordsByModule("institute_master"),
        erpRecordAPI.getRecordsByModule("course_master"),
        erpRecordAPI.getRecordsByModule("inquiry_master"),
        userAPI.getAll(),
      ]);

      const inquiries = inquiryRes.data || [];
      setStats({
        colleges: instRes.data?.length || 0,
        courses: courseRes.data?.length || 0,
        totalInquiries: inquiries.length,
        openInquiries: inquiries.filter((i: any) => i.data?.inquiry_status === "Open").length,
        pendingFee: inquiries.filter((i: any) => ["Payment Pending", "Submitted"].includes(i.data?.inquiry_status)).length,
        enrolled: inquiries.filter((i: any) => i.data?.inquiry_status === "Enrolled").length,
        users: usersRes.data?.length || 0,
      });

      // Sort and pick last 5 inquiries
      const sorted = [...inquiries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentInquiries(sorted.slice(0, 8));
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
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

  const statCards = [
    {
      title: "Colleges & Institutes",
      value: stats.colleges,
      icon: <BusinessIcon fontSize="small" />,
      color: "#650C08",
      bgColor: "rgba(101,12,8,0.08)",
      path: "/admin/dashboard/modules/institute_master",
    },
    {
      title: "Total Student Inquiries",
      value: stats.totalInquiries,
      icon: <AssignmentIcon fontSize="small" />,
      color: "#7c3aed",
      bgColor: "rgba(124,58,237,0.08)",
      path: "/admin/dashboard/modules/inquiry_master",
    },
    {
      title: "Open / New Applications",
      value: stats.openInquiries,
      icon: <PendingIcon fontSize="small" />,
      color: "#d97706",
      bgColor: "rgba(245,158,11,0.08)",
      path: "/admin/dashboard/modules/inquiry_master",
    },
    {
      title: "Courses Offered",
      value: stats.courses,
      icon: <SchoolIcon fontSize="small" />,
      color: "#0891b2",
      bgColor: "rgba(6,182,212,0.08)",
      path: "/admin/dashboard/modules/course_master",
    },
    {
      title: "Pending Fee / Docs",
      value: stats.pendingFee,
      icon: <FeeIcon fontSize="small" />,
      color: "#3b82f6",
      bgColor: "rgba(59,130,246,0.08)",
      path: "/admin/dashboard/modules/inquiry_master",
    },
    {
      title: "Successfully Enrolled",
      value: stats.enrolled,
      icon: <CheckIcon fontSize="small" />,
      color: "#10b981",
      bgColor: "rgba(16,185,129,0.08)",
      path: "/admin/dashboard/modules/enrollment_master",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: "linear-gradient(135deg, #650C08 0%, #3d0704 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(101,12,8,0.2)",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            University Administration Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600, mb: 3 }}>
            Welcome back, {user?.first_name || user?.username}! Here's a real-time snapshot of your university's admission pipeline.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate("/admin/dashboard/modules/inquiry_master")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              All Inquiries
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PeopleIcon />}
              onClick={() => navigate("/admin/dashboard/users")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              Manage Users
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<HandshakeIcon />}
              onClick={() => navigate("/admin/dashboard/modules/counsellor_arrangement")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              Counsellor Allocations
            </Button>
          </Box>
        </Box>
        <TrendingUpIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 200, opacity: 0.06 }} />
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
            <StatCard {...card} navigate={navigate} />
          </Grid>
        ))}
      </Grid>

      {/* System Users row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2.5,
          mb: 4,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(101,12,8,0.02)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(101,12,8,0.08)", color: "#650C08", display: "flex" }}>
            <PeopleIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total System Users</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", lineHeight: 1.2 }}>{stats.users} Users</Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate("/admin/dashboard/users")}
          sx={{ textTransform: "none", fontWeight: 600, color: "#650C08", borderColor: "#650C08", borderRadius: 2, "&:hover": { bgcolor: "rgba(101,12,8,0.04)" } }}
        >
          Manage Users
        </Button>
      </Box>

      {/* Recent Admissions Table */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon sx={{ color: "#650C08" }} /> Recent Admissions
          </Typography>
          <Button
            variant="text"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate("/admin/dashboard/modules/inquiry_master")}
            sx={{ textTransform: "none", fontWeight: 600, color: "#650C08" }}
          >
            View All
          </Button>
        </Box>

        {recentInquiries.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, border: "1px dashed rgba(0,0,0,0.12)" }}>
            <Typography color="text.secondary">No inquiries submitted yet.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none", overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(101,12,8,0.04)" }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, color: "#0f172a" }}>Applicant Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, color: "#0f172a" }}>Mobile</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, color: "#0f172a" }}>Applied On</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, color: "#0f172a" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, color: "#0f172a" }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInquiries.map((inq, idx) => {
                  const colors = getStatusColor(inq.data?.inquiry_status || "Open");
                  const fullName = `${inq.data?.inq_fname || ""} ${inq.data?.inq_lname || ""}`.trim() || "—";
                  return (
                    <TableRow
                      key={inq.record_id}
                      sx={{
                        "&:hover": { bgcolor: "rgba(101,12,8,0.02)" },
                        borderBottom: idx < recentInquiries.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                      }}
                    >
                      <TableCell sx={{ py: 1.5, fontWeight: 600, color: "#0f172a" }}>{fullName}</TableCell>
                      <TableCell sx={{ py: 1.5, color: "text.secondary", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {inq.data?.mobile_no || "—"}
                      </TableCell>
                      <TableCell sx={{ py: 1.5, color: "text.secondary", fontSize: "0.8rem" }}>
                        {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={inq.data?.inquiry_status || "Open"}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: colors.bg, color: colors.text, borderRadius: 1.5, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }} align="right">
                        <Button
                          size="small"
                          variant="text"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate("/admin/dashboard/modules/inquiry_master")}
                          sx={{ textTransform: "none", fontSize: "0.75rem", color: "#650C08", fontWeight: 600 }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default AdminDashboard;
