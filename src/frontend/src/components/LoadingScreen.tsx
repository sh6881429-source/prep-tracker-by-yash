import { BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.08 264) 0%, oklch(0.22 0.1 264) 50%, oklch(0.16 0.07 264) 100%)",
      }}
      data-ocid="loading_state"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo mark with glow */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.48 0.22 264 / 0.4), oklch(0.68 0.18 195 / 0.3))",
              border: "1px solid oklch(1 0 0 / 0.2)",
              boxShadow:
                "0 0 40px oklch(0.68 0.18 195 / 0.25), 0 8px 32px oklch(0.18 0.08 264 / 0.5)",
            }}
          >
            <BookOpen className="w-9 h-9 text-white" />
          </motion.div>

          {/* Outer ring pulse */}
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-3xl"
            style={{ border: "2px solid oklch(0.68 0.18 195 / 0.5)" }}
          />
        </div>

        {/* App name */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl font-bold text-white font-display tracking-tight"
          >
            Prep Tracker
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="text-white/50 text-sm mt-1"
          >
            by Yash
          </motion.p>
        </div>

        {/* Cyan spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative w-10 h-10"
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid oklch(0.68 0.18 195 / 0.2)" }}
          />
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: "2px solid transparent",
              borderTopColor: "oklch(0.68 0.18 195)",
            }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-sm font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
