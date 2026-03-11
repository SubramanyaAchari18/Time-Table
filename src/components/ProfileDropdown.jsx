import { LogOut, Settings, Award, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useUserProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar src={profile?.avatar} email={user?.email} size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.name || user?.email?.split("@")[0]}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <Award className="mr-2 h-4 w-4" />
          <span>Achievements</span>
        </DropdownMenuItem>
        <div className="p-1">
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
