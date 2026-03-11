import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Trophy, Brain } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    label: "Smart Schedules",
    desc: "Organize your study time effortlessly",
  },
  {
    icon: Clock,
    label: "Focus Timer",
    desc: "Stay on track with timed sessions",
  },
  {
    icon: Trophy,
    label: "Earn Rewards",
    desc: "Collect gems and unlock achievements",
  },
  {
    icon: Brain,
    label: "AI Assistant",
    desc: "Get instant help with your doubts",
  },
];

const Welcome = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-12 safe-top safe-bottom">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <BookOpen className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
          TimeTable
        </h1>
        <p className="mb-10 max-w-xs text-muted-foreground">
          Your smart study companion — build habits, stay focused, and ace your
          goals.
        </p>

        {/* Feature highlights */}
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center"
            >
              <f.icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {f.label}
              </span>
              <span className="text-xs text-muted-foreground">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 w-full max-w-sm space-y-3">
        <Button
          asChild
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          <Link to="/auth">Get Started</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Welcome;
