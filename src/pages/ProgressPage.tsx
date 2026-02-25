import { Card, CardContent } from "@/components/ui/card";
import { Flame, Clock, BookOpen } from "lucide-react";
import { useStreak, useDailyProgress, useStudySessions } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const ProgressPage = () => {
  const { data: streak } = useStreak();
  const { data: dailyProgress } = useDailyProgress(30);
  const { data: sessions } = useStudySessions();

  const totalHours = dailyProgress
    ? Math.round(dailyProgress.reduce((sum, d) => sum + d.total_study_seconds, 0) / 3600 * 10) / 10
    : 0;
  const totalSessions = dailyProgress
    ? dailyProgress.reduce((sum, d) => sum + d.sessions_completed, 0)
    : 0;

  const stats = [
    { icon: Flame, label: "Current Streak", value: `${streak ?? 0} days`, color: "text-warning" },
    { icon: Clock, label: "Total Hours", value: `${totalHours}h`, color: "text-primary" },
    { icon: BookOpen, label: "Sessions", value: `${totalSessions}`, color: "text-accent" },
  ];

  // Prepare chart data (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayData = dailyProgress?.find(p => p.date === dateStr);
    chartData.push({
      day: d.toLocaleDateString("en", { weekday: "short" }),
      minutes: dayData ? Math.round(dayData.total_study_seconds / 60) : 0,
    });
  }

  // Heatmap: last 28 days
  const heatmapDays = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayData = dailyProgress?.find(p => p.date === dateStr);
    const mins = dayData ? Math.round(dayData.total_study_seconds / 60) : 0;
    heatmapDays.push({ date: dateStr, day: d.getDate(), mins });
  }

  const getHeatColor = (mins: number) => {
    if (mins === 0) return "bg-secondary";
    if (mins < 30) return "bg-primary/30";
    if (mins < 60) return "bg-primary/50";
    return "bg-primary";
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground">Progress</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <span className="text-lg font-bold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground text-center">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar heatmap */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">Study Calendar (28 days)</p>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmapDays.map((d) => (
              <div
                key={d.date}
                className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium ${getHeatColor(d.mins)} ${d.mins > 0 ? "text-primary-foreground" : "text-muted-foreground"}`}
                title={`${d.date}: ${d.mins} min`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly chart */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">This Week (minutes)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(val: number) => [`${val} min`, "Study"]} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;
