import { Flame, Gem, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProfile, useSchedules, useStreak, useTodayProgress, useUserAchievements } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: streak } = useStreak();
  const { data: todayProgress } = useTodayProgress();
  const { data: userAchievements } = useUserAchievements();

  const dayOfWeek = new Date().getDay();
  // Convert JS day (0=Sun) to our schema (0=Mon)
  const schemaDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const { data: todaySchedules } = useSchedules(schemaDay);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Student";
  const sessionsToday = todayProgress?.sessions_completed ?? 0;
  const totalScheduled = todaySchedules?.length ?? 0;
  const progressPercent = totalScheduled > 0 ? Math.round((sessionsToday / totalScheduled) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()} 👋</p>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
            <Gem className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{profile?.gems ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <Card className="border-0 bg-gradient-to-r from-primary to-primary/80">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-foreground/80">Current Streak</p>
            <p className="text-2xl font-bold text-primary-foreground">{streak ?? 0} days</p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Progress */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Progress</h2>
          <span className="text-sm text-muted-foreground">{sessionsToday}/{totalScheduled} sessions</span>
        </div>
        <Progress value={progressPercent} className="h-2.5 rounded-full" />
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/timetable")}>View all</Button>
        </div>
        {todaySchedules && todaySchedules.length > 0 ? (
          <div className="space-y-2">
            {todaySchedules.map((schedule: any) => (
              <Card key={schedule.id} className="cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => navigate(`/timer/${schedule.subject_id}`)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-1 rounded-full" style={{ backgroundColor: schedule.subjects?.color || "hsl(var(--primary))" }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{schedule.subjects?.name || "Subject"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs">Start</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No subjects scheduled yet</p>
              <Button size="sm" className="rounded-xl" onClick={() => navigate("/timetable")}>Add Subject</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Achievements */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Achievements</h2>
        {userAchievements && userAchievements.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {userAchievements.slice(0, 4).map((ua: any) => (
              <Card key={ua.id} className="min-w-[120px]">
                <CardContent className="flex flex-col items-center gap-1 p-3">
                  <Trophy className="h-6 w-6 text-warning" />
                  <p className="text-xs font-medium text-foreground text-center">{ua.achievements?.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Complete your first session to earn badges!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
