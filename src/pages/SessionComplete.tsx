import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gem, Star } from "lucide-react";
import { useCreateStudySession } from "@/hooks/useFirestoreData";
import { useToast } from "@/hooks/use-toast";

const SessionComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const createSession = useCreateStudySession();

  const state = location.state as {
    subjectId?: string;
    subjectName?: string;
    durationSeconds?: number;
    gemsEarned?: number;
    incomplete?: boolean;
  } | null;

  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);

  const subjectName = state?.subjectName || "Study";
  const durationSeconds = state?.durationSeconds || 0;
  const gemsEarned = state?.gemsEarned || 0;
  const completed = !state?.incomplete;

  const handleSave = async () => {
    if (!state?.subjectId || saved) {
      navigate("/dashboard");
      return;
    }
    try {
      await createSession.mutateAsync({
        subject_id: state.subjectId,
        duration_seconds: durationSeconds,
        completed,
        gems_earned: gemsEarned,
        rating: rating > 0 ? rating : undefined,
      });
      setSaved(true);
      toast({ title: "Session saved!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error saving session", description: err.message, variant: "destructive" });
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 safe-top safe-bottom">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
        <Gem className="h-12 w-12 text-accent" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {completed ? "Great Job! 🎉" : "Session Ended"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {completed ? `You completed ${subjectName}` : `You studied ${subjectName} for ${formatDuration(durationSeconds)}`}
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-6 py-3">
        <Gem className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-primary">+{gemsEarned} Gems</span>
      </div>

      {/* Quick rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} className="p-1" onClick={() => setRating(s)}>
            <Star className={`h-7 w-7 transition-colors ${s <= rating ? "text-warning fill-warning" : "text-muted-foreground/30 hover:text-warning"}`} />
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs space-y-3 pt-4">
        <Button className="w-full h-12 rounded-xl" onClick={handleSave} disabled={createSession.isPending}>
          {createSession.isPending ? "Saving..." : "Continue"}
        </Button>
        <Button variant="ghost" className="w-full rounded-xl" onClick={() => navigate("/dashboard")}>
          Skip & Return
        </Button>
      </div>
    </div>
  );
};

export default SessionComplete;
