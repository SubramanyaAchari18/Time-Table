import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Let's set you up!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about yourself so we can personalize your experience.
          </p>
        </div>

        {/* Placeholder for multi-step form */}
        <div className="rounded-xl border bg-card p-8">
          <p className="text-sm text-muted-foreground">
            Onboarding steps coming soon — name, education level, goals, and
            initial subjects.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 h-12 rounded-xl"
            onClick={() => navigate("/dashboard")}
          >
            Skip
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl"
            onClick={() => navigate("/dashboard")}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
