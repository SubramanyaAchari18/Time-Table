import { useState } from "react";
import { Bell, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { StudyCalendar } from "@/components/calendar/Calendar";
import AddEventModal from "@/components/calendar/AddEventModal";
import { useCalendarMonth } from "@/hooks/useCalendar";

const StudyCalendarPage = () => {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const { toast } = useToast();

  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const { events, loading, error } = useCalendarMonth(year, monthIndex);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedDate(new Date(event.eventDate + "T00:00:00"));
    setEditingEvent(event);
    setModalOpen(true);
  };

  if (error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Study Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Add exams, assignments and study reminders to stay on track.
          </p>
        </div>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>

      <StudyCalendar
        year={year}
        month={monthIndex}
        events={events}
        onMonthChange={(y, m) => setMonthDate(new Date(y, m, 1))}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          {loading
            ? "Loading events..."
            : "Tap any day to add exams, assignments or study reminders."}
        </CardContent>
      </Card>

      <AddEventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={selectedDate}
        eventToEdit={editingEvent ?? undefined}
      />
    </div>
  );
};

export default StudyCalendarPage;
