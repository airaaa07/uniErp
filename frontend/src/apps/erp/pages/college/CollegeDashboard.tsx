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
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider as _Divider,
} from "@mui/material";
import {
  Business as _BusinessIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Book as BookIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  AttachMoney as FeeIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
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
  btnText?: string;
}> = ({ title, value, icon, color, bgColor, path, navigate, btnText }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "none",
      height: "100%",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.07)" },
    }}
  >
    <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: bgColor }}>
            <Box sx={{ color, display: "flex" }}>{icon}</Box>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>
          {title}
        </Typography>
      </Box>
      <Button
        size="small"
        variant="text"
        endIcon={<ArrowForwardIcon />}
        onClick={() => navigate(path)}
        sx={{ textTransform: "none", fontSize: "0.75rem", color, fontWeight: 600, p: 0, mt: 1.5, justifyContent: "flex-start" }}
      >
        {btnText || "View Details"}
      </Button>
    </CardContent>
  </Card>
);

const CollegeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    courses: 0,
    streams: 0,
    subjects: 0,
    users: 0,
    inquiries: 0,
    feeStructures: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, streamsRes, subRes, usersRes, inquiryRes, feeRes] = await Promise.all([
        erpRecordAPI.getRecordsByModule("course_master"),
        erpRecordAPI.getRecordsByModule("streams_master"),
        erpRecordAPI.getRecordsByModule("subject_master"),
        userAPI.getCollegeUsers(),
        erpRecordAPI.getRecordsByModule("inquiry_master"),
        erpRecordAPI.getRecordsByModule("fee_master"),
      ]);

      const inquiries = inquiryRes.data || [];
      const sorted = [...inquiries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setStats({
        courses: courseRes.data?.length || 0,
        streams: streamsRes.data?.length || 0,
        subjects: subRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        inquiries: inquiries.length,
        feeStructures: feeRes.data?.length || 0,
      });
      setRecentInquiries(sorted.slice(0, 5));
    } catch (err) {
      console.error("Failed to load college dashboard:", err);
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
      title: "Courses Catalogue",
      value: stats.courses,
      icon: <SchoolIcon fontSize="small" />,
      color: "#650C08",
      bgColor: "rgba(101,12,8,0.08)",
      path: "/admin/dashboard/modules/course_master",
      btnText: "Manage Courses",
    },
    {
      title: "Streams / Branches",
      value: stats.streams,
      icon: <ClassIcon fontSize="small" />,
      color: "#7c3aed",
      bgColor: "rgba(124,58,237,0.08)",
      path: "/admin/dashboard/modules/streams_master",
      btnText: "Manage Streams",
    },
    {
      title: "Subjects / Syllabus",
      value: stats.subjects,
      icon: <BookIcon fontSize="small" />,
      color: "#0891b2",
      bgColor: "rgba(6,182,212,0.08)",
      path: "/admin/dashboard/modules/subject_master",
      btnText: "Manage Subjects",
    },
    {
      title: "Fee Structures",
      value: stats.feeStructures,
      icon: <FeeIcon fontSize="small" />,
      color: "#d97706",
      bgColor: "rgba(245,158,11,0.08)",
      path: "/admin/dashboard/modules/fee_master",
      btnText: "View Fee Structures",
    },
    {
      title: "Student Inquiries",
      value: stats.inquiries,
      icon: <AssignmentIcon fontSize="small" />,
      color: "#3b82f6",
      bgColor: "rgba(59,130,246,0.08)",
      path: "/admin/dashboard/modules/inquiry_master",
      btnText: "View All Inquiries",
    },
    {
      title: "College Staff / Users",
      value: stats.users,
      icon: <PeopleIcon fontSize="small" />,
      color: "#10b981",
      bgColor: "rgba(16,185,129,0.08)",
      path: "/college/users",
      btnText: "Manage Users",
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
            College Administration Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600, mb: 3 }}>
            Welcome, {user?.first_name || user?.username}! Manage your college's academic programs, student inquiries, fee structures, and staff.
          </Typography>

          {/* Quick Action Buttons */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/dashboard/modules/course_master")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              Add Course
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/dashboard/modules/streams_master")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              Add Stream
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PeopleIcon />}
              onClick={() => navigate("/college/users")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              Manage Staff
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate("/admin/dashboard/modules/inquiry_master")}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
            >
              View Inquiries
            </Button>
          </Box>
        </Box>
        <TrendingUpIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 200, opacity: 0.06 }} />
      </Box>

      {/* Stat Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
            <StatCard {...card} navigate={navigate} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Student Inquiries */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon sx={{ color: "#650C08" }} /> Recent Student Inquiries
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
            <Typography color="text.secondary">No student inquiries received yet.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none", overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(101,12,8,0.04)" }}>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Applicant Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Mobile</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Applied On</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInquiries.map((inq, idx) => {
                  const colors = getStatusColor(inq.data?.inquiry_status || "Open");
                  const fullName = `${inq.data?.inq_fname || ""} ${inq.data?.inq_lname || ""}`.trim() || "—";
                  return (
                    <TableRow
                      key={inq.record_id}
                      sx={{ "&:hover": { bgcolor: "rgba(101,12,8,0.02)" }, borderBottom: idx < recentInquiries.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                    >
                      <TableCell sx={{ py: 1.5, fontWeight: 600 }}>{fullName}</TableCell>
                      <TableCell sx={{ py: 1.5, color: "text.secondary", fontFamily: "monospace", fontSize: "0.8rem" }}>{inq.data?.mobile_no || "—"}</TableCell>
                      <TableCell sx={{ py: 1.5, color: "text.secondary", fontSize: "0.8rem" }}>
                        {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip label={inq.data?.inquiry_status || "Open"} size="small" sx={{ fontWeight: 600, bgcolor: colors.bg, color: colors.text, borderRadius: 1.5, fontSize: "0.7rem" }} />
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

export default CollegeDashboard;
