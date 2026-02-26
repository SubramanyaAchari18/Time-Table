import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissedSession } from "@/hooks/useMissedSessions";

interface Props {
  missedSessions: MissedSession[];
}

const MissedSessionReminder = ({ missedSessions }: Props) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = missedSessions.filter((s) => !dismissed.has(s.scheduleId));
  if (visible.length === 0) return null;

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set(prev).add(id));

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4" />
        Missed Sessions ({visible.length})
      </p>
      {visible.map((session) => (
        <div
          key={session.scheduleId}
          className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 animate-in slide-in-from-top-2 duration-300"
        >
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 animate-pulse"
            style={{ backgroundColor: session.subjectColor }}
          >
            {session.subjectName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session.subjectName}
            </p>
            <p className="text-xs text-muted-foreground">
              Scheduled {session.startTime} – {session.endTime}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg gap-1 text-xs border-primary text-primary shrink-0"
            onClick={() => navigate(`/timer/${session.subjectId}`)}
          >
            <Play className="h-3 w-3" /> Start
          </Button>
          <button
            className="text-muted-foreground hover:text-foreground p-1"
            onClick={() => dismiss(session.scheduleId)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MissedSessionReminder;
