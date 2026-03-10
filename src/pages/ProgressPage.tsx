import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Clock, BookOpen } from "lucide-react";
import { useStreak, useDailyProgress, useStudySessions } from "@/hooks/useFirestoreData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import AddEventModal from "@/components/calendar/AddEventModal";
import { useAllCalendarEvents } from "@/hooks/useCalendar";
import type { CalendarEvent } from "@/firebase/calendarService";
import { toLocalDateKey } from "@/lib/utils";

const ProgressPage = () => {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

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
    const dateStr = toLocalDateKey(d);
    const dayData = dailyProgress?.find(p => p.date === dateStr);
    chartData.push({
      day: d.toLocaleDateString("en", { weekday: "short" }),
      minutes: dayData ? Math.round(dayData.total_study_seconds / 60) : 0,
    });
  }

  // Study calendar: simple 1–31 grid showing important events
  const DAYS_IN_VIEW = 31;
  const calendarDays = Array.from({ length: DAYS_IN_VIEW }, (_, i) => i + 1);

  const { events: calendarEvents } = useAllCalendarEvents();
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  (calendarEvents ?? []).forEach((ev) => {
    const raw = (ev as any).eventDate;
    let dayNum: number | null = null;

    if (typeof raw === "number") {
      dayNum = raw;
    } else if (typeof raw === "string") {
      // Primary format: "YYYY-MM-DD"
      const parts = raw.split("-");
      if (parts.length === 3) {
        const today = new Date();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const y = today.getFullYear().toString();
        if (parts[0] === y && parts[1] === m) {
          dayNum = parseInt(parts[2], 10);
        }
      } else {
        // Fallback: raw is just the day number as string
        const n = Number(raw);
        if (!Number.isNaN(n)) dayNum = n;
      }
    }

    if (dayNum && dayNum >= 1 && dayNum <= 31) {
      eventsByDay[dayNum] ??= [];
      eventsByDay[dayNum].push(ev);
    }
  });

  // Today's label + today's day (auto-updates with device date)
  const today = new Date();
  const todayDay = today.getDate();
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

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

      {/* Study Calendar (1–31) */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-medium text-foreground">Study Calendar</p>
            <p className="text-[11px] text-muted-foreground">{todayLabel}</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((dayNumber) => (
              <button
                key={dayNumber}
                type="button"
                className={`relative aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium bg-secondary text-muted-foreground ${dayNumber === todayDay ? "bg-primary/20 border border-primary ring-2 ring-primary/40 shadow-sm" : ""
                  }`}
                title={`Day ${dayNumber}. Click to add an important event.`}
                onClick={() => {
                  const today = new Date();
                  const date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                  setSelectedCalendarDate(date);
                  setCalendarModalOpen(true);
                }}
              >
                <span>{dayNumber}</span>
                {eventsByDay[dayNumber] && eventsByDay[dayNumber].length > 0 && (
                  <span className="max-w-[90%] truncate text-[8px] leading-tight">
                    {eventsByDay[dayNumber][0].title}
                  </span>
                )}
              </button>
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

      <AddEventModal
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
        date={selectedCalendarDate}
        eventToEdit={undefined}
      />
    </div>
  );
};

export default ProgressPage;
