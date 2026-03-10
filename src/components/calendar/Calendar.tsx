import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/firebase/calendarService";

interface CalendarProps {
  year: number;
  month: number; // 0-11
  events: CalendarEvent[];
  onMonthChange: (year: number, month: number) => void;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMonthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

import { toLocalDateKey as toDateKey } from "@/lib/utils";

function buildCalendarGrid(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7; // convert Sun=0 to 6, Mon=0
  const gridStart = new Date(year, month, 1 - startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function eventColor(type: CalendarEvent["eventType"]) {
  switch (type) {
    case "exam":
      return "bg-red-500/10 text-red-600 border-red-500/30";
    case "assignment":
      return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    case "study":
    default:
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  }
}

export const StudyCalendar = ({ year, month, events, onMonthChange, onDayClick, onEventClick }: CalendarProps) => {
  const days = buildCalendarGrid(year, month);
  const todayKey = toDateKey(new Date());

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    acc[ev.eventDate] ??= [];
    acc[ev.eventDate].push(ev);
    return acc;
  }, {});

  const goPrevMonth = () => {
    const d = new Date(year, month, 1);
    d.setMonth(month - 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  const goNextMonth = () => {
    const d = new Date(year, month, 1);
    d.setMonth(month + 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Study calendar</p>
          <p className="text-lg font-semibold text-foreground">{getMonthLabel(year, month)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-xs">
        {days.map((day) => {
          const key = toDateKey(day);
          const isToday = key === todayKey;
          const inCurrentMonth = day.getMonth() === month;
          const dayEvents = eventsByDate[key] ?? [];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              className={`flex min-h-[64px] flex-col items-stretch rounded-xl border px-1.5 py-1 text-left transition-colors ${inCurrentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground"
                } ${isToday ? "border-primary ring-1 ring-primary/60" : "border-border hover:bg-accent/60"}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold">{day.getDate()}</span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className={`truncate rounded-md border px-1 py-[1px] text-[10px] ${eventColor(ev.eventType)}`}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="truncate text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudyCalendar;

