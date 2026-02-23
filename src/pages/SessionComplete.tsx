import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gem, Star } from "lucide-react";

const SessionComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 safe-top safe-bottom">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
        <Gem className="h-12 w-12 text-accent" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Great Job! 🎉</h1>
        <p className="mt-2 text-muted-foreground">You've completed your study session</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-6 py-3">
        <Gem className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-primary">+10 Gems</span>
      </div>

      {/* Quick rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} className="p-1">
            <Star className="h-7 w-7 text-muted-foreground/30 hover:text-warning transition-colors" />
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs space-y-3 pt-4">
        <Button className="w-full h-12 rounded-xl" onClick={() => navigate("/dashboard")}>
          Continue
        </Button>
        <Button variant="ghost" className="w-full rounded-xl" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SessionComplete;
