import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  AssignmentTurnedIn as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI } from "../../services/api";
import { fetchReferenceOptions } from "../../utils/referenceLoader";
import type { DesignerRecord as DbRecord } from "../../types";

const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<DbRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [institutesMap, setInstitutesMap] = useState<Record<string, string>>({});
  const [streamsMap, setStreamsMap] = useState<Record<string, string>>({});

  // Dialog States
  const [selectedReg, setSelectedReg] = useState<DbRecord | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [scholarshipDiscount, setScholarshipDiscount] = useState<number | string>("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch registrations
      const res = await erpRecordAPI.getRecordsByModule("registration");
      const list = res.data || [];
      // Filter to show only records relevant to the Officer (Fee Paid, Approved, Rejected, or Enrolled)
      const relevant = list.filter(r => 
        r.data?.approval_status === "Fee Paid" || 
        r.data?.approval_status === "Approved" || 
        r.data?.approval_status === "Rejected" ||
        r.data?.approval_status === "Enrolled"
      );
      setRegistrations(relevant);

      // Load reference Options for translation
      const modulesRes = await erpRecordAPI.getAllModules();
      const mods = modulesRes.data || [];

      const instOpts = await fetchReferenceOptions("reg_institute_id", mods, true);
      if (instOpts) {
        const iMap: Record<string, string> = {};
        instOpts.forEach(o => { iMap[o.value] = o.label; });
        setInstitutesMap(iMap);
      }

      const streamOpts = await fetchReferenceOptions("reg_stream_id", mods, true);
      if (streamOpts) {
        const sMap: Record<string, string> = {};
        streamOpts.forEach(o => { sMap[o.value] = o.label; });
        setStreamsMap(sMap);
      }

    } catch (err) {
      console.error("Failed to load officer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (reg: DbRecord) => {
    setSelectedReg(reg);
    setOpenDetails(true);
  };

  const handleOpenApprove = (reg: DbRecord) => {
    setSelectedReg(reg);
    setComments("");
    setScholarshipDiscount("");
    setOpenApproveDialog(true);
  };

  const handleApproveConfirm = async (status: "Approved" | "Rejected") => {
    if (!selectedReg) return;
    try {
      // Update registration details with approval status, comments and approved discount
      const updatedData = {
        ...selectedReg.data,
        approval_status: status,
        approver_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username,
        approver_comments: comments,
        approved_discount: Number(scholarshipDiscount) || 0,
        action_date: new Date().toISOString().split("T")[0],
      };
      await erpRecordAPI.updateRecord(selectedReg.record_id, { data: updatedData });
      
      // Update student inquiry status
      if (selectedReg.data?.reg_inquiry_student_id) {
        try {
          const inquiryRes = await erpRecordAPI.getRecord(selectedReg.data.reg_inquiry_student_id);
          if (inquiryRes.data) {
            const updatedInq = { ...inquiryRes.data.data, inquiry_status: status };
            await erpRecordAPI.updateRecord(selectedReg.data.reg_inquiry_student_id, { data: updatedInq });
          }
        } catch (inqErr) {
          console.error("Failed to update student inquiry status:", inqErr);
        }
      }
      
      setOpenApproveDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to approve candidate registration:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress size={40} sx={{ color: "#650C08" }} />
      </Box>
    );
  }

  // Calculate statistics
  const pendingApprovalsCount = registrations.filter(r => r.data?.approval_status === "Fee Paid").length;
  const evaluatedCount = registrations.filter(r => r.data?.approval_status === "Approved" || r.data?.approval_status === "Rejected" || r.data?.approval_status === "Enrolled").length;

  const displayedRegs = registrations.filter(r => {
    const status = r.data?.approval_status;
    if (tabValue === 0) {
      return status === "Fee Paid";
    } else {
      return status === "Approved" || status === "Rejected" || status === "Enrolled";
    }
  });

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            Admission Officer Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Welcome, {user?.first_name || user?.username}! Review candidate credentials, class percentages, and entry status. Authorize official registrations.
          </Typography>
        </Box>
        <AssignmentIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(245, 158, 11, 0.08)", color: "#d97706" }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>AWAITING EVALUATION</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{pendingApprovalsCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>EVALUATED HISTORY</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{evaluatedCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main registrations table */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
        Academic Evaluation Directory
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} textColor="primary" indicatorColor="primary">
          <Tab label={`Pending Evaluation (${pendingApprovalsCount})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Evaluation History (${evaluatedCount})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.01)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Candidate Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Academic Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Entrance Exam Score</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Review Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRegs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {tabValue === 0 ? "No registrations currently awaiting academic verification." : "No evaluation history found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedRegs.map((reg) => {
                const isPending = reg.data?.approval_status === "Fee Paid";
                return (
                  <TableRow key={reg.record_id} sx={{ "&:hover": { bgcolor: "rgba(101,12,8,0.01)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {reg.data?.student_fname} {reg.data?.student_lname}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">10th: {reg.data?.reg_class_10_percent}%</Typography>
                      <Typography variant="caption" color="text.secondary">12th: {reg.data?.reg_class_12_percent}%</Typography>
                    </TableCell>
                    <TableCell>
                      {reg.data?.entrance_exam_name ? (
                        <>
                          <Typography variant="body2">{reg.data.entrance_exam_name}</Typography>
                          <Typography variant="caption" color="text.secondary">Score/Rank: {reg.data.entrance_rank_score}</Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Direct Entry</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={reg.data?.approval_status || "Fee Paid"} 
                        size="small" 
                        sx={{ 
                          fontWeight: 600, 
                          bgcolor: reg.data?.approval_status === "Fee Paid" ? "rgba(16, 185, 129, 0.08)" : reg.data?.approval_status === "Rejected" ? "rgba(239, 68, 68, 0.08)" : "rgba(6, 182, 212, 0.08)", 
                          color: reg.data?.approval_status === "Fee Paid" ? "#10b981" : reg.data?.approval_status === "Rejected" ? "#ef4444" : "#0891b2", 
                          borderRadius: 1.5 
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <IconButton
                          onClick={() => handleOpenDetails(reg)}
                          size="small"
                          sx={{ color: "#650C08", bgcolor: "rgba(101,12,8,0.04)" }}
                          title="View Marks & Profile"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {isPending && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenApprove(reg)}
                            startIcon={<CheckCircleIcon />}
                            sx={{
                              borderRadius: 2,
                              bgcolor: "#650C08",
                              textTransform: "none",
                              fontWeight: 600,
                              "&:hover": { bgcolor: "#7a1d16" },
                            }}
                          >
                            Evaluate Lead
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Student Academic Profile</DialogTitle>
        <DialogContent>
          {selectedReg && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>STUDENT NAME</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.student_fname} {selectedReg.data?.student_lname}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>COLLEGE</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{institutesMap[selectedReg.data?.reg_institute_id] || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>STREAM</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{streamsMap[selectedReg.data?.reg_stream_id] || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>10TH GRADE SCORES</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.reg_class_10_percent}%</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>12TH GRADE SCORES</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.reg_class_12_percent}%</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>ENTRANCE DETAILS</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedReg.data?.entrance_exam_name ? `${selectedReg.data.entrance_exam_name} (${selectedReg.data.entrance_rank_score})` : "N/A"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1.5 }}>
                    UPLOADED CREDENTIALS & MARK SHEETS
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Class 10th Marksheet:</Typography>
                      <Button size="small" variant="text" sx={{ color: "#650C08", textTransform: "none", fontWeight: 700 }} onClick={() => alert(`Opening Document: ${selectedReg.data?.class_10_marksheet || "class_10_marksheet.pdf"}`)}>
                        View Document
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Class 12th Marksheet:</Typography>
                      <Button size="small" variant="text" sx={{ color: "#650C08", textTransform: "none", fontWeight: 700 }} onClick={() => alert(`Opening Document: ${selectedReg.data?.class_12_marksheet || "class_12_marksheet.pdf"}`)}>
                        View Document
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Photograph File:</Typography>
                      <Button size="small" variant="text" sx={{ color: "#650C08", textTransform: "none", fontWeight: 700 }} onClick={() => alert(`Opening Image: ${selectedReg.data?.photograph || "photo.jpg"}`)}>
                        View Photo
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Signatures File:</Typography>
                      <Button size="small" variant="text" sx={{ color: "#650C08", textTransform: "none", fontWeight: 700 }} onClick={() => alert(`Opening Image: ${selectedReg.data?.signatures || "signature.jpg"}`)}>
                        View Signature
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Academic Evaluation Decision</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You are evaluating the registration for <strong>{selectedReg?.data?.student_fname} {selectedReg?.data?.student_lname}</strong>. Verify document completeness and enter scholarship criteria.
            </Typography>
            <TextField
              fullWidth
              label="Approved Scholarship/Discount (%)"
              type="number"
              placeholder="e.g. 15 for 15% discount"
              value={scholarshipDiscount}
              onChange={(e) => setScholarshipDiscount(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Evaluation Comments"
              placeholder="Enter details on eligibility check, qualifying score validation, etc."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenApproveDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleApproveConfirm("Rejected")}
            variant="outlined"
            startIcon={<CancelIcon />}
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Reject Application
          </Button>
          <Button
            onClick={() => handleApproveConfirm("Approved")}
            variant="contained"
            startIcon={<CheckCircleIcon />}
            sx={{ borderRadius: 2, bgcolor: "#650C08", "&:hover": { bgcolor: "#7a1d16" } }}
          >
            Approve Admission
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OfficerDashboard;
