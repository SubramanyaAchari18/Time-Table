import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Timetable = () => {
  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Timetable</h1>
        <Button size="sm" className="gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>

      {/* Day toggle */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
          <button
            key={day}
            className={`flex min-w-[3rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span>{day}</span>
            <span className="text-[10px] opacity-70">{17 + i}</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">No subjects for this day</p>
          <Button variant="outline" size="sm" className="rounded-xl">
            Create Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Timetable;
