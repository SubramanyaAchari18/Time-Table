import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Clock, FolderOpen, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/timetable", icon: Calendar, label: "Timetable" },
  { to: "/timer", icon: Clock, label: "Timer" },
  { to: "/notes", icon: FolderOpen, label: "Notes" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
];

const BottomNav = () => {
  const location = useLocation();

  // Hide on non-app routes
  const appRoutes = tabs.map((t) => t.to);
  const showNav =
    appRoutes.some((r) => location.pathname.startsWith(r)) ||
    ["/study-bot", "/profile", "/achievements"].includes(location.pathname);

  if (!showNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <tab.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />

              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
