import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import Welcome from "@/pages/Welcome";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Timetable from "@/pages/Timetable";
import Timer from "@/pages/Timer";
import Notes from "@/pages/Notes";
import ProgressPage from "@/pages/ProgressPage";
import StudyBot from "@/pages/StudyBot";
import Profile from "@/pages/Profile";
import Achievements from "@/pages/Achievements";
import SessionComplete from "@/pages/SessionComplete";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/timer/:subjectId" element={<Timer />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/study-bot" element={<StudyBot />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/session-complete" element={<SessionComplete />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
