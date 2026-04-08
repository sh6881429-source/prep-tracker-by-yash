import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  ArrowLeft,
  BookOpen,
  Dumbbell,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import type { AppBackend } from "../types/appTypes";

type View = "welcome" | "admin-login" | "user-login" | "register";

// ─── Welcome Screen ─────────────────────────────────────────────────────────
function WelcomeScreen({
  onAdminLogin,
  onUserLogin,
  onRegister,
}: {
  onAdminLogin: () => void;
  onUserLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto flex flex-col items-center"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-glow mx-auto">
          <BookOpen className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      {/* App name */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="text-center mb-3"
      >
        <h1 className="text-4xl font-bold text-white font-display tracking-tight">
          Prep Tracker
        </h1>
        <p className="text-white/60 text-sm mt-1 font-medium tracking-widest uppercase">
          by Yash
        </p>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="text-white/70 text-center text-base max-w-xs leading-relaxed mb-10"
      >
        Track your study sessions and workouts. Stay consistent, achieve more.
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="flex gap-3 mb-10"
      >
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
          <GraduationCap className="w-3.5 h-3.5 text-white/80" />
          <span className="text-white/80 text-xs font-medium">Study</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
          <Dumbbell className="w-3.5 h-3.5 text-white/80" />
          <span className="text-white/80 text-xs font-medium">Gym</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
          <span className="text-white/80 text-xs font-medium">📊 Progress</span>
        </div>
      </motion.div>

      {/* Auth buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45 }}
        className="w-full space-y-3"
      >
        <Button
          data-ocid="welcome.admin_login.button"
          onClick={onAdminLogin}
          className="w-full h-13 text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-none"
          variant="ghost"
        >
          <ShieldCheck className="mr-2 h-5 w-5" />
          Admin Login
        </Button>

        <Button
          data-ocid="welcome.user_login.button"
          onClick={onUserLogin}
          className="w-full h-13 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-glow rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <User className="mr-2 h-5 w-5" />
          User Login
        </Button>

        <button
          type="button"
          data-ocid="welcome.register.link"
          onClick={onRegister}
          className="w-full text-center text-white/60 text-sm py-2 hover:text-white/90 transition-colors underline underline-offset-2"
        >
          New user? Register here
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Admin Login Screen ──────────────────────────────────────────────────────
function AdminLoginScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter username and password");
      return;
    }

    setIsLoading(true);
    // Simulate brief load
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);

    if (username === "Yash" && password === "Yash89@#$48") {
      onSuccess();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <motion.div
      key="admin-login"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Back button */}
      <button
        type="button"
        data-ocid="admin_login.back.button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/70 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white font-display">
          Admin Login
        </h2>
        <p className="text-white/60 text-sm mt-1">
          Enter your admin credentials
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white/80 text-sm font-medium">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-ocid="admin_login.username.input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/80 text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-ocid="admin_login.password.input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl"
            />
            <button
              type="button"
              data-ocid="admin_login.password_toggle.button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            data-ocid="admin_login.error_state"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-300 text-sm bg-red-500/15 border border-red-400/25 rounded-xl px-4 py-2.5"
          >
            {error}
          </motion.p>
        )}

        <Button
          data-ocid="admin_login.submit_button"
          type="submit"
          disabled={isLoading}
          className="w-full h-13 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-glow rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Login as Admin"
          )}
        </Button>
      </form>
    </motion.div>
  );
}

// ─── User Login Screen ───────────────────────────────────────────────────────
function UserLoginScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (phone: string, name: string, details: string) => void;
}) {
  const { actor } = useActor();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (pin.length < 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }
    if (!actor) {
      setError("Unable to connect. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const newActor = actor as unknown as AppBackend;
      const result = await newActor.loginUser(phone.trim(), pin);
      if (result.__kind__ === "ok") {
        const profile = result.ok;
        onSuccess(profile.phone, profile.name, profile.details);
      } else if (result.__kind__ === "userNotFound") {
        setError("No account found with this number");
      } else if (result.__kind__ === "wrongPin") {
        setError("Incorrect PIN");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (_err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="user-login"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Back button */}
      <button
        type="button"
        data-ocid="user_login.back.button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/70 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
          <User className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white font-display">
          User Login
        </h2>
        <p className="text-white/60 text-sm mt-1">Enter your phone and PIN</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-white/80 text-sm font-medium">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-ocid="user_login.phone.input"
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80 text-sm font-medium">
            4-Digit PIN
          </Label>
          <div className="flex justify-center">
            <InputOTP
              data-ocid="user_login.pin.input"
              maxLength={4}
              pattern={REGEXP_ONLY_DIGITS}
              value={pin}
              onChange={(v) => setPin(v)}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-14 h-14 text-xl border-white/30 bg-white/10 text-white [&[data-active=true]]:border-white/70 [&[data-active=true]]:bg-white/20"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            data-ocid="user_login.error_state"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-300 text-sm bg-red-500/15 border border-red-400/25 rounded-xl px-4 py-2.5 text-center"
          >
            {error}
          </motion.p>
        )}

        <Button
          data-ocid="user_login.submit_button"
          type="submit"
          disabled={isLoading}
          className="w-full h-13 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-glow rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </motion.div>
  );
}

// ─── Registration Screen ─────────────────────────────────────────────────────
function RegisterScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (phone: string, name: string, details: string) => void;
}) {
  const { actor } = useActor();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string => {
    if (!phone.trim()) return "Phone number is required";
    if (!/^\d{7,15}$/.test(phone.trim()))
      return "Please enter a valid phone number (7-15 digits)";
    if (!name.trim()) return "Full name is required";
    if (pin.length < 4) return "Please enter a 4-digit PIN";
    if (confirmPin.length < 4) return "Please confirm your PIN";
    if (pin !== confirmPin) return "PINs do not match";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!actor) {
      setError("Unable to connect. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const newActor = actor as unknown as AppBackend;
      const result = await newActor.registerUser(
        phone.trim(),
        name.trim(),
        details.trim(),
        pin,
      );
      if (result.__kind__ === "ok") {
        const profile = result.ok;
        onSuccess(profile.phone, profile.name, profile.details);
      } else if (result.__kind__ === "phoneAlreadyTaken") {
        setError("This phone number is already registered");
      } else if (result.__kind__ === "invalidPhone") {
        setError("Please enter a valid phone number");
      } else if (result.__kind__ === "invalidPin") {
        setError("PIN must be exactly 4 digits");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (_err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Back button */}
      <button
        type="button"
        data-ocid="register.back.button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/70 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white font-display">
          Create Account
        </h2>
        <p className="text-white/60 text-sm mt-1">
          Fill in your details to get started
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white/80 text-sm font-medium">
            Phone Number <span className="text-white/40">(your unique ID)</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-ocid="register.phone.input"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/80 text-sm font-medium">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              data-ocid="register.name.input"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/80 text-sm font-medium">
            Details / Bio <span className="text-white/40">(optional)</span>
          </Label>
          <Textarea
            data-ocid="register.details.textarea"
            placeholder="A short bio or any other details..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80 text-sm font-medium">
            Set a 4-Digit PIN
          </Label>
          <div className="flex justify-center">
            <InputOTP
              data-ocid="register.pin.input"
              maxLength={4}
              pattern={REGEXP_ONLY_DIGITS}
              value={pin}
              onChange={(v) => setPin(v)}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-14 h-14 text-xl border-white/30 bg-white/10 text-white [&[data-active=true]]:border-white/70 [&[data-active=true]]:bg-white/20"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80 text-sm font-medium">
            Confirm PIN
          </Label>
          <div className="flex justify-center">
            <InputOTP
              data-ocid="register.confirm_pin.input"
              maxLength={4}
              pattern={REGEXP_ONLY_DIGITS}
              value={confirmPin}
              onChange={(v) => setConfirmPin(v)}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-14 h-14 text-xl border-white/30 bg-white/10 text-white [&[data-active=true]]:border-white/70 [&[data-active=true]]:bg-white/20"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            data-ocid="register.error_state"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-300 text-sm bg-red-500/15 border border-red-400/25 rounded-xl px-4 py-2.5 text-center"
          >
            {error}
          </motion.p>
        )}

        <Button
          data-ocid="register.submit_button"
          type="submit"
          disabled={isLoading}
          className="w-full h-13 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-glow rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </motion.div>
  );
}

// ─── Login Page (root) ───────────────────────────────────────────────────────
export default function LoginPage() {
  const { loginAsAdmin, loginAsUser } = useAppAuth();
  const [view, setView] = useState<View>("welcome");

  const handleAdminSuccess = () => loginAsAdmin();

  const handleUserSuccess = (phone: string, name: string, details: string) =>
    loginAsUser(phone, name, details);

  return (
    <div
      className="min-h-screen gradient-hero flex flex-col overflow-hidden"
      data-ocid="login.page"
    >
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-white/3 blur-2xl" />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <AnimatePresence mode="wait">
            {view === "welcome" && (
              <WelcomeScreen
                key="welcome"
                onAdminLogin={() => setView("admin-login")}
                onUserLogin={() => setView("user-login")}
                onRegister={() => setView("register")}
              />
            )}
            {view === "admin-login" && (
              <AdminLoginScreen
                key="admin-login"
                onBack={() => setView("welcome")}
                onSuccess={handleAdminSuccess}
              />
            )}
            {view === "user-login" && (
              <UserLoginScreen
                key="user-login"
                onBack={() => setView("welcome")}
                onSuccess={handleUserSuccess}
              />
            )}
            {view === "register" && (
              <RegisterScreen
                key="register"
                onBack={() => setView("welcome")}
                onSuccess={handleUserSuccess}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center shrink-0">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/50 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
