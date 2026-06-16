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
  School as SchoolIcon,
  Class as ClassIcon,
  Book as BookIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI } from "../../services/api";

const CollegeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    colleges: 0,
    courses: 0,
    streams: 0,
    subjects: 0,
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
      const [instRes, courseRes, streamsRes, subRes] = await Promise.all([
        erpRecordAPI.getRecordsByModule("institute_master"),
        erpRecordAPI.getRecordsByModule("course_master"),
        erpRecordAPI.getRecordsByModule("streams_master"),
        erpRecordAPI.getRecordsByModule("subject_master"),
      ]);

      setCounts({
        colleges: instRes.data?.length || 0,
        courses: courseRes.data?.length || 0,
        streams: streamsRes.data?.length || 0,
        subjects: subRes.data?.length || 0,
      });
    } catch (err) {
      console.error("Failed to load counts:", err);
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
      moduleKey: "institute_master",
      description: "Manage university campuses, location details, contact info, and start dates.",
    },
    {
      title: "Courses Catalogue",
      count: counts.courses,
      icon: <SchoolIcon sx={{ fontSize: 40, color: "#650C08" }} />,
      moduleKey: "course_master",
      description: "Define major degree programs offered at the university, including enrollment windows.",
    },
    {
      title: "Streams catalog",
      count: counts.streams,
      icon: <ClassIcon sx={{ fontSize: 40, color: "#650C08" }} />,
      moduleKey: "streams_master",
      description: "Specify branch options under courses, program duration, and academic format.",
    },
    {
      title: "Subjects list",
      count: counts.subjects,
      icon: <BookIcon sx={{ fontSize: 40, color: "#650C08" }} />,
      moduleKey: "subject_master",
      description: "Track course subjects, textbook lists, syllabus outlines, and textbooks.",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            College Administration Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Welcome, {user?.first_name || user?.username}! Manage campuses, set up new academic programs, edit stream durations, and define syllabus subjects.
          </Typography>
        </Box>
        <BusinessIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Grid of Sections */}
      <Grid container spacing={4}>
        {sections.map((section, index) => (
          <Grid size={{ xs: 12, sm: 6 }} key={index}>
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
                  onClick={() => navigate(`/admin/dashboard/modules/${section.moduleKey}`)}
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
                  Manage {section.title.split(" ")[0]}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default CollegeDashboard;
