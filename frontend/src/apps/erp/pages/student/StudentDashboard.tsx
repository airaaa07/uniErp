import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  Alert,
} from "@mui/material";
import {
  School as SchoolIcon,
  SupportAgent as SupportAgentIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI, userAPI } from "../../services/api";
import { fetchReferenceOptions } from "../../utils/referenceLoader";
import type { DesignerRecord as DbRecord } from "../../types";
import toast from "react-hot-toast";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [inquiries, setInquiries] = useState<DbRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [counsellors, setCounsellors] = useState<Record<string, any>>({});
  const [coursesMap, setCoursesMap] = useState<Record<string, string>>({});
  
  // Registration and options state
  const [activeReg, setActiveReg] = useState<DbRecord | null>(null);
  const [institutesMap, setInstitutesMap] = useState<Record<string, string>>({});
  const [streamsMap, setStreamsMap] = useState<Record<string, string>>({});

  // Payment Form States
  const [paymentMode, setPaymentMode] = useState<"online" | "offline">("online");
  const [offlineTxRef, setOfflineTxRef] = useState("");
  const [class10Percent, setClass10Percent] = useState<number | string>("");
  const [class12Percent, setClass12Percent] = useState<number | string>("");
  const [entranceExam, setEntranceExam] = useState("");
  const [entranceRank, setEntranceRank] = useState<number | string>("");

  // Simulated File states
  const [fileClass10, setFileClass10] = useState<string>("");
  const [fileClass10Name, setFileClass10Name] = useState<string>("");
  const [fileClass12, setFileClass12] = useState<string>("");
  const [fileClass12Name, setFileClass12Name] = useState<string>("");
  const [filePhoto, setFilePhoto] = useState<string>("");
  const [filePhotoName, setFilePhotoName] = useState<string>("");
  const [fileSig, setFileSig] = useState<string>("");
  const [fileSigName, setFileSigName] = useState<string>("");

  // Online Razorpay Modal State
  const [openRzpModal, setOpenRzpModal] = useState(false);
  const [rzpProcessing, setRzpProcessing] = useState(false);
  const [rzpTxRef, setRzpTxRef] = useState("");
  const [submittingReg, setSubmittingReg] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch inquiries
      const inquiriesRes = await erpRecordAPI.getRecordsByModule("inquiry_master");
      const allInquiries = inquiriesRes.data || [];
      
      // Filter for inquiries created by this student user
      const studentInqs = allInquiries.filter((inq) => String(inq.created_by) === String(user?.user_id));
      setInquiries(studentInqs);

      const activeInq = studentInqs[0];

      // Load reference Courses options to translate course IDs into names
      const modulesRes = await erpRecordAPI.getAllModules();
      const modulesList = modulesRes.data || [];
      
      const courseOpts = await fetchReferenceOptions("course_id", modulesList, true);
      if (courseOpts) {
        const cMap: Record<string, string> = {};
        courseOpts.forEach(o => { cMap[o.value] = o.label; });
        setCoursesMap(cMap);
      }

      // Fetch counsellors list
      // const usersRes = await userAPI.getAll();
      // const list = usersRes.data || [];
      // const cMap: Record<string, any> = {};
      // list.forEach((u: any) => {
      //   cMap[String(u.user_id)] = u;
      // });
      // setCounsellors(cMap);

      // Fetch registrations
      if (activeInq) {
        const regRes = await erpRecordAPI.getRecordsByModule("registration");
        const registrations = regRes.data || [];
        const matchReg = registrations.find(r => String(r.data?.reg_inquiry_student_id) === String(activeInq.record_id));
        if (matchReg) {
          setActiveReg(matchReg);
          setClass10Percent(matchReg.data?.reg_class_10_percent ?? activeInq.data?.class_10_percent ?? "");
          setClass12Percent(matchReg.data?.reg_class_12_percent ?? activeInq.data?.class_12_percent ?? "");
          setEntranceExam(matchReg.data?.entrance_exam_name ?? "");
          setEntranceRank(matchReg.data?.entrance_rank_score ?? "");
        }
      }

      // Fetch Institutes
      const instOpts = await fetchReferenceOptions("reg_institute_id", modulesList, true);
      if (instOpts) {
        const iMap: Record<string, string> = {};
        instOpts.forEach(o => { iMap[o.value] = o.label; });
        setInstitutesMap(iMap);
      }

      // Fetch Streams
      const streamOpts = await fetchReferenceOptions("reg_stream_id", modulesList, true);
      if (streamOpts) {
        const sMap: Record<string, string> = {};
        streamOpts.forEach(o => { sMap[o.value] = o.label; });
        setStreamsMap(sMap);
      }

    } catch (err) {
      console.error("Failed to load student dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: "10th" | "12th" | "photo" | "sig") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (fileType === "10th") {
        setFileClass10(base64String);
        setFileClass10Name(file.name);
      } else if (fileType === "12th") {
        setFileClass12(base64String);
        setFileClass12Name(file.name);
      } else if (fileType === "photo") {
        setFilePhoto(base64String);
        setFilePhotoName(file.name);
      } else if (fileType === "sig") {
        setFileSig(base64String);
        setFileSigName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOpenRazorpay = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    const feeAmount = activeReg?.data?.regn_fee || 1500;
    const options = {
      key: "rzp_test_RvORW1HCWwBwoy",
      amount: feeAmount * 100, // in paise
      currency: "INR",
      name: "University ERP",
      description: "Admission Registration Fee",
      handler: function (response: any) {
        const paymentId = response.razorpay_payment_id;
        setRzpTxRef(paymentId);
        toast.success("Payment successful via Razorpay!");
      },
      prefill: {
        name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Student",
        email: user?.email || "",
      },
      theme: {
        color: "#650C08",
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  const handleRazorpaySimulate = () => {
    setRzpProcessing(true);
    setTimeout(() => {
      const generatedRef = `PAY_RZP_${Math.floor(10000000 + Math.random() * 90000000)}`;
      setRzpTxRef(generatedRef);
      setRzpProcessing(false);
    }, 2000);
  };

  const handleSubmitRegistration = async () => {
    if (!activeReg || !activeInquiry) return;
    
    const ref = paymentMode === "online" ? rzpTxRef : offlineTxRef;
    if (!ref) {
      alert("Payment reference is required!");
      return;
    }
    if (!fileClass10 || !fileClass12 || !filePhoto || !fileSig) {
      alert("Please upload all required documents (10th, 12th marksheets, photo, and signature).");
      return;
    }

    try {
      setSubmittingReg(true);
      // Update registration record
      const updatedRegData = {
        ...activeReg.data,
        regn_pmt_ref: ref,
        reg_class_10_percent: Number(class10Percent),
        reg_class_12_percent: Number(class12Percent),
        class_10_marksheet: fileClass10Name || "class_10_marksheet.pdf",
        class_12_marksheet: fileClass12Name || "class_12_marksheet.pdf",
        photograph: filePhotoName || "photo.jpg",
        signatures: fileSigName || "signature.jpg",
        entrance_exam_name: entranceExam || null,
        entrance_rank_score: entranceRank ? Number(entranceRank) : null,
        approval_status: "Submitted",
      };

      await erpRecordAPI.updateRecord(activeReg.record_id, { data: updatedRegData });

      // Update Inquiry status to Submitted
      const updatedInquiry = {
        ...activeInquiry.data,
        inquiry_status: "Submitted",
      };
      await erpRecordAPI.updateRecord(activeInquiry.record_id, { data: updatedInquiry });

      // Reset states and refresh
      setRzpTxRef("");
      setOfflineTxRef("");
      setOpenRzpModal(false);
      await fetchStudentData();
    } catch (err) {
      console.error("Failed to submit student registration:", err);
      alert("An error occurred during submission. Please try again.");
    } finally {
      setSubmittingReg(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Enrolled":
        return { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" };
      case "Registered":
      case "Approved":
        return { bg: "rgba(6, 182, 212, 0.08)", text: "#0891b2" };
      case "Payment Pending":
        return { bg: "rgba(59, 130, 246, 0.08)", text: "#3b82f6" };
      case "Submitted":
        return { bg: "rgba(168, 85, 247, 0.08)", text: "#a855f7" };
      case "Fee Paid":
        return { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" };
      case "Assigned":
        return { bg: "rgba(245, 158, 11, 0.08)", text: "#d97706" };
      default:
        return { bg: "rgba(101, 12, 8, 0.08)", text: "#650C08" };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress size={40} sx={{ color: "#650C08" }} />
      </Box>
    );
  }

  // Find active application
  const activeInquiry = inquiries[0];
  const activeCounsellor = activeInquiry?.data?.counsellor_id 
    ? counsellors[String(activeInquiry.data.counsellor_id)] 
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Message */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            Welcome, {user?.first_name || user?.username}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Track your admissions, view course details, and coordinate with your assigned counsellors in real time.
          </Typography>
        </Box>
        <SchoolIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Enrollment ID Banner — shown when fully enrolled */}
      {activeInquiry?.data?.inquiry_status === "Enrolled" && (
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 4,
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 3,
            boxShadow: "0 6px 24px rgba(6,78,59,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              🎓 Enrollment Confirmed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em", mt: 0.5 }}>
              {activeInquiry.data?.enrollment_id || "Enrollment Processing"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              {institutesMap[activeReg?.data?.reg_institute_id || ""] && `${institutesMap[activeReg?.data?.reg_institute_id || ""]} · `}
              {streamsMap[activeReg?.data?.reg_stream_id || ""] || "Course Allocated"}
            </Typography>
          </Box>
          <Box
            sx={{
              px: 3,
              py: 2,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              textAlign: "center",
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, display: "block" }}>STATUS</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#6ee7b7" }}>✅ Enrolled</Typography>
          </Box>
          <SchoolIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 200, opacity: 0.06 }} />
        </Box>
      )}

      {inquiries.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 4, border: "1px dashed rgba(0,0,0,0.15)" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}>
            No Active Inquiries
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 460, mx: "auto" }}>
            You haven't submitted any admission inquiries yet. Submit your dynamic admission inquiry form to begin your application process.
          </Typography>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate("/register")}
            sx={{ bgcolor: "#650C08", px: 4, py: 1.2, borderRadius: 2.5, "&:hover": { bgcolor: "#7a1d16" } }}
          >
            Start Inquiry Form
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {/* Active Application Status Tracker */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <TimelineIcon /> Application Status Tracker
                </Typography>

                <Box sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 3, mb: 4, border: "1px solid #e2e8f0" }}>
                  <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Grid>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                        PROGRAM OF INTEREST
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {coursesMap[activeInquiry.data.course_id] || activeInquiry.data.course_id || "Under Review"}
                      </Typography>
                    </Grid>
                    <Grid>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.5, textAlign: { sm: "right" } }}>
                        APPLICATION ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a", textAlign: { sm: "right" } }}>
                        {activeInquiry.record_id.slice(0, 12).toUpperCase()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Admission Timeline Steps */}
                <Box sx={{ position: "relative", pl: 4, borderLeft: "2px solid #e2e8f0", ml: 2, py: 1 }}>
                  {[
                    { title: "Inquiry Submitted", desc: "Your dynamic inquiry form was registered.", step: "Open", active: true },
                    { title: "Counsellor Assigned", desc: "A counselor has been allocated to review your file.", step: "Assigned", active: ["Assigned", "Payment Pending", "Submitted", "Fee Paid", "Approved", "Enrolled"].includes(activeInquiry.data.inquiry_status) },
                    { title: "Counseling Completed", desc: "Recommended college and stream allocated.", step: "Payment Pending", active: ["Payment Pending", "Submitted", "Fee Paid", "Approved", "Enrolled"].includes(activeInquiry.data.inquiry_status) },
                    { title: "Registration Payment", desc: "Pay fee (online/offline) and upload marksheets/photographs.", step: "Submitted", active: ["Submitted", "Fee Paid", "Approved", "Enrolled"].includes(activeInquiry.data.inquiry_status) },
                    { title: "Credentials Verified", desc: "Credentials and payment details verified by official desk.", step: "Approved", active: ["Approved", "Enrolled"].includes(activeInquiry.data.inquiry_status) },
                    { title: "Enrolled & Matriculated", desc: "Official enrollment number issued.", step: "Enrolled", active: activeInquiry.data.inquiry_status === "Enrolled" }
                  ].map((s, idx) => (
                    <Box key={idx} sx={{ mb: 4, position: "relative" }}>
                      {/* Timeline dot */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: -42,
                          top: 4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2.5px solid ${s.active ? "#650C08" : "#cbd5e1"}`,
                          bgcolor: s.active ? "#650C08" : "white",
                          boxShadow: s.active ? "0 0 8px rgba(101, 12, 8, 0.4)" : "none",
                          transition: "all 0.2s"
                        }}
                      />
                      <Typography variant="body1" sx={{ fontWeight: 700, color: s.active ? "#0f172a" : "text.secondary" }}>
                        {s.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* self-service payment form */}
                {activeInquiry.data?.inquiry_status === "Payment Pending" && activeReg && (
                  <Box sx={{ mt: 4, p: 3, border: "1px solid rgba(101,12,8,0.1)", borderRadius: 3, bgcolor: "rgba(101,12,8,0.01)" }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
                      Complete Your Registration Payment & Credentials
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Your counselor has recommended you for admission to <strong>{institutesMap[activeReg.data?.reg_institute_id] || activeReg.data?.reg_institute_id}</strong> in the stream <strong>{streamsMap[activeReg.data?.reg_stream_id] || activeReg.data?.reg_stream_id}</strong>.
                      Please complete the payment of <strong>₹{activeReg.data?.regn_fee || 1500}</strong> and upload the required certificates below.
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Step 1: Academic Data */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5 }}>
                          1. Verify Academic Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              fullWidth
                              label="Class 10th Percentage"
                              type="number"
                              value={class10Percent}
                              onChange={(e) => setClass10Percent(e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              fullWidth
                              label="Class 12th Percentage"
                              type="number"
                              value={class12Percent}
                              onChange={(e) => setClass12Percent(e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              fullWidth
                              label="Entrance Exam (Optional)"
                              value={entranceExam}
                              onChange={(e) => setEntranceExam(e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              fullWidth
                              label="Entrance Score / Rank (Optional)"
                              type="number"
                              value={entranceRank}
                              onChange={(e) => setEntranceRank(e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Step 2: Document Uploads */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5 }}>
                          2. Upload Scanned Documents (PDF/JPG, Max 100KB)
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} sx={{ textTransform: "none", color: "#650C08", borderColor: "#650C08", borderRadius: 2 }}>
                              Upload Class 10 Marksheet *
                              <input type="file" hidden accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "10th")} />
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, pl: 1 }}>
                              {fileClass10Name || "No file chosen"}
                            </Typography>
                          </Grid>

                          <Grid size={{ xs: 6 }}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} sx={{ textTransform: "none", color: "#650C08", borderColor: "#650C08", borderRadius: 2 }}>
                              Upload Class 12 Marksheet *
                              <input type="file" hidden accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "12th")} />
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, pl: 1 }}>
                              {fileClass12Name || "No file chosen"}
                            </Typography>
                          </Grid>

                          <Grid size={{ xs: 6 }}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} sx={{ textTransform: "none", color: "#650C08", borderColor: "#650C08", borderRadius: 2 }}>
                              Upload Photograph *
                              <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "photo")} />
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, pl: 1 }}>
                              {filePhotoName || "No file chosen"}
                            </Typography>
                          </Grid>

                          <Grid size={{ xs: 6 }}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} sx={{ textTransform: "none", color: "#650C08", borderColor: "#650C08", borderRadius: 2 }}>
                              Upload Signatures *
                              <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "sig")} />
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, pl: 1 }}>
                              {fileSigName || "No file chosen"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Step 3: Payment */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
                          3. Choose Fee Payment Option (₹{activeReg.data?.regn_fee || 1500})
                        </Typography>
                        
                        <FormControl component="fieldset">
                          <RadioGroup row value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)}>
                            <FormControlLabel value="online" control={<Radio sx={{ color: "#650C08", "&.Mui-checked": { color: "#650C08" } }} />} label="Online via Razorpay" />
                            <FormControlLabel value="offline" control={<Radio sx={{ color: "#650C08", "&.Mui-checked": { color: "#650C08" } }} />} label="Offline Bank Deposit" />
                          </RadioGroup>
                        </FormControl>

                        {paymentMode === "online" ? (
                          <Box sx={{ mt: 2, p: 2.5, border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 2, bgcolor: "rgba(0,0,0,0.01)" }}>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Pay securely online using Credit/Debit Cards, UPI, Netbanking, or Wallets via Razorpay.
                            </Typography>
                            {rzpTxRef ? (
                              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                                Online Payment Successful! Txn ID: <strong>{rzpTxRef}</strong>
                              </Alert>
                            ) : (
                              <Button variant="contained" startIcon={<CreditCardIcon />} onClick={handleOpenRazorpay} sx={{ bgcolor: "#650C08", "&:hover": { bgcolor: "#7a1d16" }, textTransform: "none", borderRadius: 2 }}>
                                Pay Online via Razorpay
                              </Button>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ mt: 2, p: 2.5, border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 2, bgcolor: "rgba(0,0,0,0.01)" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                              <AccountBalanceIcon sx={{ color: "#650C08" }} /> Bank Deposit Instructions:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-line" }}>
                              <strong>Bank Name:</strong> State Bank of India
                              <strong>Account Number:</strong> 998877665544
                              <strong>IFSC Code:</strong> SBIN0004567
                              <strong>Branch:</strong> University Campus Branch
                              Please deposit ₹{activeReg.data?.regn_fee || 1500} and enter the transaction reference number below.
                            </Typography>
                            <TextField
                              fullWidth
                              label="Bank Transaction Reference / UTR Number"
                              value={offlineTxRef}
                              onChange={(e) => setOfflineTxRef(e.target.value)}
                              placeholder="e.g. UTR1234567890"
                              required
                            />
                          </Box>
                        )}
                      </Grid>

                      {/* Submission Action */}
                      <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleSubmitRegistration}
                          disabled={submittingReg || (!rzpTxRef && !offlineTxRef) || !fileClass10 || !fileClass12 || !filePhoto || !fileSig || !class10Percent || !class12Percent}
                          sx={{
                            bgcolor: "#10b981",
                            "&:hover": { bgcolor: "#059669" },
                            borderRadius: 2.5,
                            py: 1.5,
                            fontWeight: 700,
                            textTransform: "none"
                          }}
                        >
                          {submittingReg ? "Submitting Application..." : "Submit Completed Application"}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Counsellor Info Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <SupportAgentIcon /> Assigned Counsellor
                </Typography>

                {activeCounsellor ? (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        bgcolor: "rgba(101, 12, 8, 0.08)",
                        color: "#650C08",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        fontSize: "1.75rem",
                        fontWeight: 800
                      }}
                    >
                      {activeCounsellor.first_name?.[0].toUpperCase()}
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {activeCounsellor.first_name} {activeCounsellor.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Admissions counsellor
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      Email: {activeCounsellor.email}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                    <SupportAgentIcon sx={{ fontSize: 48, opacity: 0.4, mb: 1.5 }} />
                    <Typography variant="body2">
                      Your counselor allocation is under process. A counselor will reach out shortly.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
                  Portal Quick Actions
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate("/register")}
                  sx={{ borderRadius: 2, mb: 1.5, textTransform: "none", color: "#650C08", borderColor: "#650C08", "&:hover": { borderColor: "#7a1d16", bgcolor: "rgba(101,12,8,0.02)" } }}
                >
                  Submit Another Admission Form
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* History of submissions */}
      {inquiries.length > 1 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon /> Inquiry History
          </Typography>
          <Paper sx={{ borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <List disablePadding>
              {inquiries.map((inq, idx) => {
                const colors = getStatusColor(inq.data.inquiry_status || "Open");
                return (
                  <React.Fragment key={inq.record_id}>
                    <ListItem sx={{ py: 2.5, px: 3, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                      <ListItemText
                        primary={coursesMap[inq.data.course_id] || inq.data.course_id || "Course Details"}
                        secondary={`Submitted on: ${new Date(inq.created_at).toLocaleDateString()} · ID: ${inq.record_id.slice(0, 12)}`}
                        slotProps={{
                          primary: { sx: { fontWeight: 700, color: "#0f172a" } }
                        }}
                      />
                      <Chip label={inq.data.inquiry_status || "Open"} size="small" sx={{ fontWeight: 600, bgcolor: colors.bg, color: colors.text, borderRadius: 1.5 }} />
                    </ListItem>
                    {idx < inquiries.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Box>
      )}
      {/* Razorpay Simulated Modal */}
      <Dialog open={openRzpModal} onClose={() => setOpenRzpModal(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: "hidden" } } }}>
        <DialogTitle sx={{ bgcolor: "#111827", color: "white", display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <CreditCardIcon sx={{ color: "#3b82f6" }} /> Razorpay Secure Payment
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "#1f2937", color: "white" }}>
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "#3b82f6" }}>
              ₹{activeReg?.data?.regn_fee || 1500}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 4 }}>
              Payment to {institutesMap[activeReg?.data?.reg_institute_id || ""] || "University Group"}
            </Typography>

            {rzpProcessing ? (
              <Box sx={{ py: 4 }}>
                <CircularProgress size={40} sx={{ color: "#3b82f6", mb: 2 }} />
                <Typography variant="body2">Simulating secure gateway payment...</Typography>
              </Box>
            ) : rzpTxRef ? (
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" sx={{ color: "#10b981", fontWeight: 700, mb: 1 }}>
                  Success!
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, wordBreak: "break-all" }}>
                  Txn ID: {rzpTxRef}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This is a secure mock simulation of Razorpay payment portal. Clicking pay will simulate success and return a gateway transaction token.
                </Typography>
                <Button variant="contained" fullWidth onClick={handleRazorpaySimulate} sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, textTransform: "none", py: 1.2, fontWeight: 700, borderRadius: 2 }}>
                  Simulate Payment Success
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#111827" }}>
          <Button onClick={() => setOpenRzpModal(false)} sx={{ color: "white", opacity: 0.7 }}>
            Close Dialog
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDashboard;
