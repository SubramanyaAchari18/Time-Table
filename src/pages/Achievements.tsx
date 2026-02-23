import { Trophy, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const badges = [
  { name: "First Session", desc: "Complete your first study session", unlocked: false },
  { name: "3-Day Streak", desc: "Study 3 days in a row", unlocked: false },
  { name: "Gem Collector", desc: "Earn 100 gems", unlocked: false },
  { name: "Night Owl", desc: "Study after 10 PM", unlocked: false },
  { name: "Early Bird", desc: "Study before 7 AM", unlocked: false },
  { name: "Marathon", desc: "Study for 2 hours straight", unlocked: false },
];

const Achievements = () => {
  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-warning" />
        <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge) => (
          <Card key={badge.name} className={badge.unlocked ? "" : "opacity-60"}>
            <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
              {badge.unlocked ? (
                <Trophy className="h-8 w-8 text-warning" />
              ) : (
                <Lock className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm font-semibold text-foreground">{badge.name}</p>
              <p className="text-[11px] text-muted-foreground">{badge.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
