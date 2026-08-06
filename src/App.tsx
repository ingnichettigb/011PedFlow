import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LicenseGate } from "@/components/LicenseGate";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Activation from "./pages/Activation";
import Terms from "./pages/Terms";
import LicenseExpired from "./pages/LicenseExpired";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Calculator from "./pages/Calculator";
import Registry from "./pages/Registry";
import Databases from "./pages/Databases";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/attivazione" element={<Activation />} />
            <Route path="/condizioni" element={<Terms />} />
            <Route path="/licenza-scaduta" element={<LicenseExpired />} />
            <Route path="/" element={<LicenseGate><Landing /></LicenseGate>} />
            <Route path="/login" element={<LicenseGate><Login /></LicenseGate>} />
            <Route path="/signup" element={<LicenseGate><Signup /></LicenseGate>} />
            <Route path="/forgot-password" element={<LicenseGate><ForgotPassword /></LicenseGate>} />
            <Route path="/reset-password" element={<LicenseGate><ResetPassword /></LicenseGate>} />
            <Route path="/calcolatore" element={<LicenseGate><ProtectedRoute><Calculator /></ProtectedRoute></LicenseGate>} />
            <Route path="/classificazione/:id" element={<LicenseGate><ProtectedRoute><Calculator /></ProtectedRoute></LicenseGate>} />
            <Route path="/registro" element={<LicenseGate><ProtectedRoute><Registry /></ProtectedRoute></LicenseGate>} />
            <Route path="/databases" element={<LicenseGate><ProtectedRoute><Databases /></ProtectedRoute></LicenseGate>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
