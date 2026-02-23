import { User, Bell, Palette, Shield, Download, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const menuItems = [
  { icon: User, label: "Personal Info", desc: "Name, education, goals" },
  { icon: Bell, label: "Notifications", desc: "Reminders & alerts" },
  { icon: Palette, label: "Appearance", desc: "Theme & display" },
  { icon: Shield, label: "Account Security", desc: "Password & privacy" },
  { icon: Download, label: "Export Data", desc: "Download your progress" },
];

const Profile = () => {
  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <User className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Student</p>
          <p className="text-sm text-muted-foreground">student@email.com</p>
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
    </div>
  );
};

export default Profile;
