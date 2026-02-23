import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const Timer = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 pb-24 safe-top safe-bottom">
      {/* Timer circle */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128" cy="128" r="120"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <circle
            cx="128" cy="128" r="120"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120}
          />
        </svg>
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums text-foreground">25:00</p>
          <p className="mt-2 text-sm text-muted-foreground">Select a subject to begin</p>
        </div>
      </div>

      {/* Controls */}
      <Button size="lg" className="h-16 w-16 rounded-full" disabled>
        <Play className="h-6 w-6" />
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Start a study session from your timetable to activate the timer.
      </p>
    </div>
  );
};

export default Timer;
