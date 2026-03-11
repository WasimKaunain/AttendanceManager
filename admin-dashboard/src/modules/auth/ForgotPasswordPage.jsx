import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft, Eye, EyeOff, MailCheck, KeyRound, CheckCircle2 } from "lucide-react";
import api from "../../core/api/axios";

// Steps: "email" → "otp" → "reset" → "done"

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: send OTP ────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep("otp");
    } catch (err) {
      // Surface the exact error from backend (404 / 403 / 500)
      const detail = err?.response?.data?.detail;
      setError(detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ──────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email: email.trim(), otp });
      setStep("reset");
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: reset password ──────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        otp,
        new_password: newPassword,
      });
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to reset password. Please restart.");
    } finally {
      setLoading(false);
    }
  };

  const stepMeta = {
    email: { icon: <MailCheck className="w-7 h-7 text-white" />, title: "Forgot Password", sub: "Enter your registered admin email" },
    otp:   { icon: <KeyRound  className="w-7 h-7 text-white" />, title: "Enter OTP",       sub: `Code sent to ${email}` },
    reset: { icon: <ShieldCheck className="w-7 h-7 text-white" />, title: "New Password",   sub: "Choose a strong password" },
    done:  { icon: <CheckCircle2 className="w-7 h-7 text-white" />, title: "All Done!",    sub: "Your password has been reset" },
  };

  const meta = stepMeta[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 px-8 py-7 flex flex-col items-center gap-2">
            <div className="bg-white/20 rounded-full p-3">{meta.icon}</div>
            <h1 className="text-white text-2xl font-bold tracking-wide">{meta.title}</h1>
            <p className="text-blue-100 text-sm text-center">{meta.sub}</p>
          </div>

          <div className="px-8 py-8 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* ── Step 1: Email ── */}
            {step === "email" && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-[0.5em] text-center font-mono text-lg"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Didn't receive it?{" "}
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                      className="text-blue-500 hover:underline"
                    >
                      Resend
                    </button>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
              </form>
            )}

            {/* ── Step 3: New Password ── */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button type="button" onClick={() => setShowNew((p) => !p)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            )}

            {/* ── Step 4: Done ── */}
            {step === "done" && (
              <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  Back to Login
                </button>
              </div>
            )}

            {/* Back to login link (except done step) */}
            {step !== "done" && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition mt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          © {new Date().getFullYear()} Attendance Manager. All rights reserved.
        </p>
      </div>
    </div>
  );
}
