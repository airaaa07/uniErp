import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    password: "",
  });

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.username || !formData.password) {
      setError("Please enter username and password");
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login({
        username: formData.username,
        password: formData.password,
      });
      toast.success(`Welcome back!`);
      
      const roles = loggedInUser?.roles || [];
      const roleNames = roles.map((r: any) => (typeof r === 'string' ? r : r.role_name).toLowerCase());

      if (roleNames.includes('student')) {
        navigate("/student/dashboard");
      } else if (roleNames.includes('counsellor')) {
        navigate("/counsellor/dashboard");
      } else if (roleNames.includes('finance controller')) {
        navigate("/finance/dashboard");
      } else if (roleNames.includes('admission officer')) {
        navigate("/officer/dashboard");
      } else if (roleNames.includes('registrar')) {
        navigate("/registrar/dashboard");
      } else if (roleNames.includes('college admin')) {
        navigate("/college/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Invalid username or password. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const rightPanelGradient = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal" as const,
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT PANEL - Logo & Welcome */}
        <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white bg-white flex items-center justify-center text-rose-800 font-bold text-4xl">
            U {/*Singhania University */}
          </div>

          <h1 className="mt-8 text-4xl font-bold text-gray-800 tracking-wide">
            University
          </h1>

          <p className="mt-4 text-sm text-gray-500">
           Pacheri Bari, Jhunjhunu - 333515
          </p>
          <p className="mt-4 text-sm text-gray-500">
           Rajasthan, India
          </p>

          <div className="mt-10 text-gray-600 font-medium">
            Welcome to the Portal
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div
          className="w-full lg:w-[65%] flex flex-col justify-center p-8 lg:p-12 text-white"
          style={rightPanelGradient}
        >
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-10">
              ERP LOGIN
            </h2>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-gray-900">
              <h3 className="text-xl font-bold mb-6">Welcome Back</h3>

              {/* Password Login Form */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm mb-5 font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your username"
                    className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-[#650C08] focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-[#650C08] focus:border-transparent outline-none transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-[#650C08] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#650C08] hover:bg-[#7a1d16] text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                New student?{" "}
                <Link to="/register" className="text-[#650C08] font-medium hover:underline">
                  Apply for Admission
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-sm opacity-90">
              <p>ERP • Powered by <span className="font-bold">SlashCurate Technologies Pvt Ltd</span></p>
              <p className="mt-2">© 2026 University. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
