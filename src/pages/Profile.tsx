import { User, Bell, Palette, Shield, Download, ChevronRight, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useSupabaseData";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: User, label: "Personal Info", desc: "Name, education, goals" },
  { icon: Bell, label: "Notifications", desc: "Reminders & alerts" },
  { icon: Palette, label: "Appearance", desc: "Theme & display" },
  { icon: Shield, label: "Account Security", desc: "Password & privacy" },
  { icon: Download, label: "Export Data", desc: "Download your progress" },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <User className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{profile?.display_name || "Student"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card key={item.label} className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <item.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="destructive" className="mt-4 rounded-xl gap-2" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
};

export default Profile;
