import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { AppAuthProvider, useAppAuth } from "./hooks/useAppAuth";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";

function AppRouter() {
  const { session, isLoggedIn } = useAppAuth();

  return (
    <AnimatePresence mode="wait">
      {!isLoggedIn || !session ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <LoginPage />
        </motion.div>
      ) : session.role === "admin" ? (
        <motion.div
          key="admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-screen"
        >
          <AdminDashboard />
        </motion.div>
      ) : (
        <motion.div
          key="user"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-screen"
        >
          <UserDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppAuthProvider>
      <AppRouter />
      <Toaster />
    </AppAuthProvider>
  );
}
