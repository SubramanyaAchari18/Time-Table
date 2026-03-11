import { useState, useRef, useEffect } from "react";
import { User, Camera, BookOpen, Calendar as CalendarIcon, Trophy, Plus, Trash2, Loader2, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useUpdateUserProfile, useUploadAvatar } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);

  // Local state for edits
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    college: "",
    department: "",
  });
  
  // Local state for timetable
  const [timetable, setTimetable] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        year: profile.year || "",
        college: profile.college || "",
        department: profile.department || "",
      });
      
      // Convert array of timetable entries back to an accessible object map for editing
      const initialTimetable = {};
      if (Array.isArray(profile.timetable)) {
        profile.timetable.forEach(entry => {
          initialTimetable[`${entry.day}-${entry.period}`] = entry.subject;
        });
      }
      setTimetable(initialTimetable);
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      toast({ title: "Profile updated successfully!" });
    } catch (err) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }
    
    try {
      await uploadAvatar.mutateAsync(file);
      toast({ title: "Avatar updated successfully!" });
    } catch (err) {
      toast({ title: "Failed to upload avatar", description: err.message, variant: "destructive" });
    }
  };

  const handleTimetableChange = (day, period, subject) => {
    setTimetable(prev => ({
      ...prev,
      [`${day}-${period}`]: subject
    }));
  };

  const handleSaveTimetable = async () => {
    try {
      // Flatten map to array for firestore
      const flattened = Object.entries(timetable)
        .filter(([_, subject]) => subject && subject.trim() !== "")
        .map(([key, subject]) => {
          const [day, period] = key.split("-");
          return { day, period: parseInt(period), subject: subject.trim() };
        });
        
      await updateProfile.mutateAsync({ timetable: flattened });
      toast({ title: "Timetable updated successfully!" });
    } catch (err) {
      toast({ title: "Failed to update timetable", description: err.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (err) {
      toast({ title: "Failed to sign out", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6 safe-top max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="destructive" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Log out
          </Button>
        </div>
      </div>

      {/* Basic Info Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative cursor-pointer group rounded-full"
                onClick={handleAvatarClick}
              >
                <Avatar 
                  src={profile?.avatar} 
                  email={user?.email} 
                  size="xl" 
                  className={uploadAvatar.isPending ? "opacity-50" : ""}
                />
                
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadAvatar.isPending ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-white mb-1" />
                      <span className="text-white text-xs font-semibold tracking-wider">CHANGE</span>
                    </>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Profile Form */}
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email <span className="text-xs text-muted-foreground">(Read-only)</span></Label>
                  <Input value={profile.email} disabled className="bg-muted/50 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Current Year / Semester</Label>
                  <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="e.g. 2nd Year, Semester 3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">School / College</Label>
                  <Input id="college" name="college" value={formData.college} onChange={handleInputChange} placeholder="Your institution" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="department">Department / Course</Label>
                  <Input id="department" name="department" value={formData.department} onChange={handleInputChange} placeholder="e.g. Computer Science" />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Profile Details"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Timetable Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Academic Timetable</CardTitle>
                <CardDescription>Manage your weekly period schedule</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={handleSaveTimetable} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Timetable"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[700px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2 font-medium text-sm text-muted-foreground border-b pb-2">
                <div className="col-span-1">Day \ Period</div>
                {PERIODS.map(p => (
                  <div key={p} className="text-center">Period {p}</div>
                ))}
              </div>
              
              {/* Timetable Grid */}
              <div className="space-y-2">
                {DAYS.map(day => (
                  <div key={day} className="grid grid-cols-8 gap-2 items-center">
                    <div className="col-span-1 font-medium text-sm">{day}</div>
                    {PERIODS.map(period => (
                      <Input 
                        key={`${day}-${period}`}
                        value={timetable[`${day}-${period}`] || ""}
                        onChange={(e) => handleTimetableChange(day, period, e.target.value)}
                        placeholder="Subject/Break"
                        className="h-8 text-xs text-center px-1"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Achievements</CardTitle>
              <CardDescription>Badges you've earned</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile?.badges && profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profile.badges.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center p-4 border rounded-xl bg-card hover:bg-accent/50 transition-colors">
                  <div className="text-4xl mb-2">{badge.icon || "🏆"}</div>
                  <p className="font-semibold text-sm text-center">{badge.name}</p>
                  {badge.dateEarned && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(badge.dateEarned).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No achievements yet</p>
              <p className="text-xs text-muted-foreground mt-1">Keep studying to earn your first badge!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
};

export default Profile;
