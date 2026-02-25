import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubjects } from "@/hooks/useSupabaseData";

const Timer = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { data: subjects } = useSubjects();

  const subject = subjects?.find(s => s.id === subjectId);
  const totalSeconds = (subject?.duration_minutes ?? 25) * 60;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setHasStarted(false);
  }, [totalSeconds, subjectId]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            // Navigate to session complete with data
            const elapsed = totalSeconds;
            const gems = Math.max(1, Math.round(elapsed / 60));
            navigate("/session-complete", {
              state: { subjectId, subjectName: subject?.name, durationSeconds: elapsed, gemsEarned: gems },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, totalSeconds, subjectId, subject?.name, navigate]);

  const handleStart = useCallback(() => {
    if (!hasStarted) {
      startTimeRef.current = new Date();
      setHasStarted(true);
    }
    setIsRunning(true);
  }, [hasStarted]);

  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    const elapsed = totalSeconds - timeLeft;
    if (elapsed > 30 && subjectId) {
      const gems = Math.max(1, Math.round(elapsed / 120)); // Half gems for incomplete
      navigate("/session-complete", {
        state: { subjectId, subjectName: subject?.name, durationSeconds: elapsed, gemsEarned: gems, incomplete: true },
      });
    } else {
      setTimeLeft(totalSeconds);
      setHasStarted(false);
    }
  }, [totalSeconds, timeLeft, subjectId, subject?.name, navigate]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 120;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 pb-24 safe-top safe-bottom">
      {subject && (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
          <p className="text-sm font-medium text-foreground">{subject.name}</p>
        </div>
      )}

      {/* Timer circle */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r="120" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle
            cx="128" cy="128" r="120"
            fill="none"
            stroke={subject?.color || "hsl(var(--primary))"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {!subjectId ? "Select a subject to begin" : isRunning ? "Stay focused!" : hasStarted ? "Paused" : "Ready to start"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {hasStarted && (
          <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={handleStop}>
            <Square className="h-5 w-5" />
          </Button>
        )}
        <Button
          size="lg"
          className="h-16 w-16 rounded-full"
          disabled={!subjectId}
          onClick={isRunning ? handlePause : handleStart}
        >
          {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
      </div>

      {!subjectId && (
        <p className="text-center text-sm text-muted-foreground">
          Start a study session from your timetable to activate the timer.
        </p>
      )}
    </div>
  );
};

export default Timer;
