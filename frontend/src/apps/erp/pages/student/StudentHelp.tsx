import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Help as HelpIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  SupportAgent as SupportAgentIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI, userAPI } from "../../services/api";

const StudentHelp: React.FC = () => {
  const { user } = useAuth();
  const [counsellor, setCounsellor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCounsellor();
  }, [user]);

  const fetchCounsellor = async () => {
    try {
      setLoading(true);
      const inquiryRes = await erpRecordAPI.getRecordsByModule("inquiry_master");
      const all = inquiryRes.data || [];
      const mine = all.filter((i: any) => String(i.created_by) === String(user?.user_id));
      const counsellorId = mine[0]?.data?.counsellor_id;

      if (counsellorId) {
        const usersRes = await userAPI.getAll();
        const found = (usersRes.data || []).find((u: any) => String(u.user_id) === String(counsellorId));
        if (found) setCounsellor(found);
      }
    } catch (err) {
      console.error("Failed to load help data:", err);
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

  return (
    <Container maxWidth="md" sx={{ py: 1 }}>
      {/* Banner */}
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
            Help & Contact
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Reach out to your assigned counsellor or the university helpdesk for admission queries.
          </Typography>
        </Box>
        <HelpIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.06 }} />
      </Box>

      {/* Assigned Counsellor */}
      <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none", mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <SupportAgentIcon /> Your Assigned Counsellor
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {counsellor ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "rgba(101,12,8,0.1)",
                  color: "#650C08",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                }}
              >
                {counsellor.first_name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {counsellor.first_name} {counsellor.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Admissions Counsellor
                </Typography>
                {counsellor.email && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <EmailIcon fontSize="small" sx={{ color: "#650C08" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{counsellor.email}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <SupportAgentIcon sx={{ fontSize: 48, color: "rgba(101,12,8,0.2)", mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                No counsellor has been assigned to your application yet. Please check back after your inquiry is reviewed.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* University Helpdesk */}
      <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none", mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <PhoneIcon /> University Admissions Helpdesk
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { icon: <PhoneIcon fontSize="small" />, label: "Helpline", value: "+91 98765 43210" },
              { icon: <EmailIcon fontSize="small" />, label: "Email", value: "admissions@university.edu.in" },
              { icon: <ScheduleIcon fontSize="small" />, label: "Office Hours", value: "Mon – Sat, 9:00 AM – 5:00 PM" },
            ].map(({ icon, label, value }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ color: "#650C08", display: "flex" }}>{icon}</Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>{value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* FAQ section */}
      <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
            Frequently Asked Questions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {[
            { q: "When will I receive my enrollment ID?", a: "After the Registrar processes your application following fee verification and academic approval. You will see it in 'My Application'." },
            { q: "My payment was made but status is still 'Payment Pending'?", a: "The Finance team verifies payment references within 1–2 working days. Contact the helpdesk if it has been longer." },
            { q: "Can I change my course or college after submitting?", a: "Contact your assigned counsellor before the counselling step. After approval, changes cannot be made." },
            { q: "How do I reset my password?", a: "Use the profile avatar (top right) and the 'Change Password' option in your account menu." },
          ].map(({ q, a }, idx) => (
            <Box key={idx} sx={{ mb: idx < 3 ? 2.5 : 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
                Q: {q}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {a}
              </Typography>
              {idx < 3 && <Divider sx={{ mt: 2.5 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentHelp;
