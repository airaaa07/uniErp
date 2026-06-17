import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
  Paper,
} from "@mui/material";
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI } from "../../services/api";

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
    <Box sx={{ color: "#650C08", display: "flex", minWidth: 24 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [institutesMap, setInstitutesMap] = useState<Record<string, string>>({});
  const [coursesMap, setCoursesMap] = useState<Record<string, string>>({});
  const [streamsMap, setStreamsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [inquiryRes, instRes, courseRes, streamRes] = await Promise.all([
        erpRecordAPI.getRecordsByModule("inquiry_master"),
        erpRecordAPI.getRecordsByModule("institute_master"),
        erpRecordAPI.getRecordsByModule("course_master"),
        erpRecordAPI.getRecordsByModule("streams_master"),
      ]);

      const all = inquiryRes.data || [];
      const mine = all.filter((i: any) => String(i.created_by) === String(user?.user_id));
      if (mine.length > 0) setInquiry(mine[0]);

      const iMap: Record<string, string> = {};
      (instRes.data || []).forEach((r: any) => {
        iMap[r.record_id] = r.data?.inst_name || r.data?.institute_name || r.record_id;
      });
      setInstitutesMap(iMap);

      const cMap: Record<string, string> = {};
      (courseRes.data || []).forEach((r: any) => {
        cMap[r.record_id] = r.data?.course_name || r.record_id;
      });
      setCoursesMap(cMap);

      const sMap: Record<string, string> = {};
      (streamRes.data || []).forEach((r: any) => {
        sMap[r.record_id] = r.data?.stream_name || r.record_id;
      });
      setStreamsMap(sMap);
    } catch (err) {
      console.error("Failed to load student profile:", err);
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

  const d = inquiry?.data || {};
  const fullName = `${d.inq_fname || user?.first_name || ""} ${d.inq_lname || user?.last_name || ""}`.trim() || user?.username || "Student";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isEnrolled = d.inquiry_status === "Enrolled";

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Header Banner */}
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
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            bgcolor: "rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "1.75rem",
            fontWeight: 800,
            border: "3px solid rgba(255,255,255,0.3)",
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: "-0.02em" }}>
            {fullName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Student Portal · @{user?.username}
          </Typography>
          {isEnrolled && (
            <Chip
              label={`Enrolled · ${d.enrollment_id || "ID Pending"}`}
              size="small"
              sx={{ mt: 1, bgcolor: "rgba(16,185,129,0.25)", color: "#a7f3d0", fontWeight: 700, fontFamily: "monospace" }}
            />
          )}
        </Box>
        <PersonIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.06 }} />
      </Box>

      <Grid container spacing={4}>
        {/* Personal Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InfoRow icon={<PersonIcon fontSize="small" />} label="Full Name" value={fullName} />
              <InfoRow icon={<PhoneIcon fontSize="small" />} label="Mobile Number" value={d.mobile_no || user?.username || ""} />
              <InfoRow icon={<EmailIcon fontSize="small" />} label="Email Address" value={d.email_id || user?.email || ""} />
              <InfoRow icon={<CakeIcon fontSize="small" />} label="Date of Birth" value={d.dob || ""} />
            </CardContent>
          </Card>
        </Grid>

        {/* Application Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
                Application Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InfoRow
                icon={<SchoolIcon fontSize="small" />}
                label="Programme / Course Applied"
                value={coursesMap[d.course_id] || d.course_id || "—"}
              />
              <InfoRow
                icon={<BusinessIcon fontSize="small" />}
                label="Preferred College / Institute"
                value={institutesMap[d.inq_college_id] || d.inq_college_id || "—"}
              />
              <InfoRow
                icon={<BadgeIcon fontSize="small" />}
                label="Application Status"
                value={d.inquiry_status || "Open"}
              />
              {d.enrollment_id && (
                <InfoRow
                  icon={<BadgeIcon fontSize="small" />}
                  label="Enrollment ID"
                  value={d.enrollment_id}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Login Credentials Info */}
        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
              border: "1px solid rgba(59,130,246,0.15)",
              bgcolor: "rgba(59,130,246,0.03)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1d4ed8", mb: 1 }}>
              🔐 Your Login Credentials
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your login username is your <strong>mobile number</strong>. Your initial password was your <strong>Date of Birth (DDMMYYYY)</strong>.
              If you have not changed it yet, please do so immediately from the header menu for security.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentProfile;
