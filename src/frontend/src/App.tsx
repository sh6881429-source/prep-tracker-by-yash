import { Toaster } from "@/components/ui/sonner";
import { AppAuthProvider, useAppAuth } from "./hooks/useAppAuth";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";

function AppRouter() {
  const { session, isLoggedIn } = useAppAuth();

  if (!isLoggedIn || !session) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (session.role === "admin") {
    return (
      <>
        <AdminDashboard />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <UserDashboard />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AppAuthProvider>
      <AppRouter />
    </AppAuthProvider>
  );
}
