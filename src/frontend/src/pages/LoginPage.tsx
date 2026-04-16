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
  Target,
  User,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";
import { useAppLogo } from "../hooks/useAppLogo";
import type { AppBackend } from "../types/appTypes";

type View = "welcome" | "admin-login" | "user-login" | "register";

// ─── Gradient background decorations ────────────────────────────────────────
function GradientBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary gradient: deep navy → royal blue */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.28 0.14 264) 45%, oklch(0.22 0.11 264) 100%)",
        }}
      />
      {/* Cyan glow top-right */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "oklch(0.68 0.18 195)" }}
      />
      {/* Royal blue glow center */}
      <div
        className="absolute top-1/3 -left-16 w-64 h-64 rounded-full opacity-15 blur-3xl"
        style={{ background: "oklch(0.48 0.22 264)" }}
      />
      {/* Bottom accent blob */}
      <div
        className="absolute -bottom-24 right-1/4 w-96 h-72 rounded-full opacity-10 blur-3xl"
        style={{ background: "oklch(0.68 0.18 195)" }}
      />
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ─── Logo component ──────────────────────────────────────────────────────────
function AppLogo({ size = "lg" }: { size?: "sm" | "lg" }) {
  const logo = useAppLogo();
  const dim = size === "lg" ? "w-24 h-24" : "w-14 h-14";
  const iconDim = size === "lg" ? "w-12 h-12" : "w-7 h-7";

  if (logo) {
    return (
      <div
        className={`${dim} rounded-3xl overflow-hidden border-2 border-white/25 shadow-[0_0_30px_oklch(0.68_0.18_195/0.4)] mx-auto`}
      >
        <img src={logo} alt="App Logo" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-3xl flex items-center justify-center mx-auto`}
      style={{
        background:
          "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.6) 0%, oklch(0.68 0.18 195 / 0.4) 100%)",
        border: "1px solid oklch(1 0 0 / 0.2)",
        boxShadow:
          "0 0 30px oklch(0.68 0.18 195 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.15)",
      }}
    >
      <BookOpen className={`${iconDim} text-white`} />
    </div>
  );
}

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
  const features = [
    { icon: GraduationCap, label: "Study" },
    { icon: Dumbbell, label: "Gym" },
    { icon: Target, label: "Progress" },
  ];

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto flex flex-col items-center"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.05,
          duration: 0.55,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className="mb-7"
      >
        <AppLogo size="lg" />
      </motion.div>

      {/* App name + tagline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.45 }}
        className="text-center mb-3"
      >
        <h1
          className="text-4xl font-bold text-white tracking-tight"
          style={{ fontFamily: "Bricolage Grotesque, system-ui, sans-serif" }}
        >
          Prep Tracker
        </h1>
        <p className="text-white/50 text-xs mt-1 font-semibold tracking-[0.2em] uppercase">
          by Yash
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.45 }}
        className="text-white/65 text-center text-sm max-w-xs leading-relaxed mb-8"
      >
        Track study sessions, gym workouts & stay consistent every day.
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex gap-2 mb-9"
      >
        {features.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{
              background: "oklch(1 0 0 / 0.08)",
              border: "1px solid oklch(1 0 0 / 0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Icon className="w-3.5 h-3.5 text-white/75" />
            <span className="text-white/75 text-xs font-medium">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Auth buttons */}
      <div className="w-full space-y-3">
        {/* Admin login — glass outline */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
        >
          <button
            type="button"
            data-ocid="welcome.admin_login.button"
            onClick={onAdminLogin}
            className="w-full h-12 flex items-center justify-center gap-2.5 text-sm font-semibold text-white rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "oklch(1 0 0 / 0.1)",
              border: "1px solid oklch(1 0 0 / 0.22)",
              backdropFilter: "blur(10px)",
            }}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            Admin Login
          </button>
        </motion.div>

        {/* User login — solid cyan-to-blue gradient */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <button
            type="button"
            data-ocid="welcome.user_login.button"
            onClick={onUserLogin}
            className="w-full h-12 flex items-center justify-center gap-2.5 text-sm font-semibold text-white rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.60 0.20 230) 60%, oklch(0.68 0.18 195) 100%)",
              boxShadow:
                "0 4px 24px oklch(0.68 0.18 195 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.15)",
            }}
          >
            <User className="w-4.5 h-4.5" />
            User Login
          </button>
        </motion.div>

        {/* Register link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58, duration: 0.4 }}
          className="text-center"
        >
          <button
            type="button"
            data-ocid="welcome.register.link"
            onClick={onRegister}
            className="text-white/55 text-sm py-2 hover:text-white/85 transition-colors"
          >
            New user?{" "}
            <span className="underline underline-offset-2 font-medium">
              Register here
            </span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Shared form card wrapper ────────────────────────────────────────────────
function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-3xl p-6"
      style={{
        background: "oklch(1 0 0 / 0.07)",
        border: "1px solid oklch(1 0 0 / 0.15)",
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 8px 40px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.1)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Styled input for glass forms ────────────────────────────────────────────
const glassInputClass =
  "h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/20 rounded-xl";

// ─── Submit button ────────────────────────────────────────────────────────────
function GradientSubmitButton({
  isLoading,
  label,
  loadingLabel,
  ...props
}: {
  isLoading: boolean;
  label: string;
  loadingLabel: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.48 0.22 264) 0%, oklch(0.60 0.20 230) 60%, oklch(0.68 0.18 195) 100%)",
        boxShadow:
          "0 4px 24px oklch(0.68 0.18 195 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.15)",
      }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
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

  // Support custom password from localStorage
  const getAdminPassword = () =>
    localStorage.getItem("preptracker_admin_pass") || "Yash89@#$48";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter username and password");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);
    if (username === "Yash" && password === getAdminPassword()) {
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
      <button
        type="button"
        data-ocid="admin_login.back.button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/65 hover:text-white mb-5 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <FormCard>
        {/* Header */}
        <div className="mb-6">
          <AppLogo size="sm" />
          <h2
            className="text-2xl font-bold text-white mt-4"
            style={{ fontFamily: "Bricolage Grotesque, system-ui, sans-serif" }}
          >
            Admin Login
          </h2>
          <p className="text-white/55 text-sm mt-1">
            Enter your admin credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                data-ocid="admin_login.username.input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className={`pl-10 ${glassInputClass}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                data-ocid="admin_login.password.input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`pl-10 pr-10 ${glassInputClass}`}
              />
              <button
                type="button"
                data-ocid="admin_login.password_toggle.button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65 transition-colors"
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

          <GradientSubmitButton
            data-ocid="admin_login.submit_button"
            isLoading={isLoading}
            label="Login as Admin"
            loadingLabel="Signing in..."
          />
        </form>
      </FormCard>
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
      <button
        type="button"
        data-ocid="user_login.back.button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/65 hover:text-white mb-5 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <FormCard>
        <div className="mb-6">
          <AppLogo size="sm" />
          <h2
            className="text-2xl font-bold text-white mt-4"
            style={{ fontFamily: "Bricolage Grotesque, system-ui, sans-serif" }}
          >
            User Login
          </h2>
          <p className="text-white/55 text-sm mt-1">Enter your phone and PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                data-ocid="user_login.phone.input"
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className={`pl-10 ${glassInputClass}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
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
                      className="w-14 h-14 text-xl border-white/25 bg-white/10 text-white [&[data-active=true]]:border-cyan-400/70 [&[data-active=true]]:bg-white/20 rounded-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

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

          <GradientSubmitButton
            data-ocid="user_login.submit_button"
            isLoading={isLoading}
            label="Login"
            loadingLabel="Logging in..."
          />
        </form>
      </FormCard>
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
      <button
        type="button"
        data-ocid="register.back.button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/65 hover:text-white mb-5 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <FormCard>
        <div className="mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.5) 0%, oklch(0.68 0.18 195 / 0.35) 100%)",
              border: "1px solid oklch(1 0 0 / 0.18)",
            }}
          >
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Bricolage Grotesque, system-ui, sans-serif" }}
          >
            Create Account
          </h2>
          <p className="text-white/55 text-sm mt-1">
            Fill in your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
              Phone Number{" "}
              <span className="text-white/35 normal-case tracking-normal">
                (unique ID)
              </span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                data-ocid="register.phone.input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className={`pl-10 ${glassInputClass}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                data-ocid="register.name.input"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className={`pl-10 ${glassInputClass}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
              Bio{" "}
              <span className="text-white/35 normal-case tracking-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              data-ocid="register.details.textarea"
              placeholder="A short bio or any other details..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/20 rounded-xl resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
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
                      className="w-14 h-14 text-xl border-white/25 bg-white/10 text-white [&[data-active=true]]:border-cyan-400/70 [&[data-active=true]]:bg-white/20 rounded-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/75 text-xs font-semibold uppercase tracking-wider">
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
                      className="w-14 h-14 text-xl border-white/25 bg-white/10 text-white [&[data-active=true]]:border-cyan-400/70 [&[data-active=true]]:bg-white/20 rounded-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

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

          <GradientSubmitButton
            data-ocid="register.submit_button"
            isLoading={isLoading}
            label="Create Account"
            loadingLabel="Creating Account..."
          />
        </form>
      </FormCard>
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
      className="min-h-screen flex flex-col overflow-hidden relative"
      data-ocid="login.page"
    >
      <GradientBg />

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
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/45 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
