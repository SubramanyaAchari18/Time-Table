import { Trophy, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAchievements, useUserAchievements } from "@/hooks/useFirestoreData";

const RARITY_COLORS = {
  common: "border-muted-foreground/30",
  uncommon: "border-primary/50",
  rare: "border-accent/50",
  legendary: "border-warning",
};

const Achievements = () => {
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();

  const unlockedIds = new Set(
    userAchievements?.map((ua) => ua.achievement_id) || [],
  );

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-warning" />
        <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        {unlockedIds.size} / {achievements?.length || 0} unlocked
      </p>

      <div className="grid grid-cols-2 gap-3">
        {achievements?.map((a) => {
          const unlocked = unlockedIds.has(a.id);
          return (
            <Card
              key={a.id}
              className={`border-2 ${unlocked ? RARITY_COLORS[a.rarity] || "" : "opacity-60"}`}
            >
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                {unlocked ? (
                  <Trophy className="h-8 w-8 text-warning" />
                ) : (
                  <Lock className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-semibold text-foreground">
                  {a.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {a.description}
                </p>
                {a.gems_reward > 0 && (
                  <span className="text-[10px] font-medium text-primary">
                    +{a.gems_reward} gems
                  </span>
                )}
                <span className="text-[9px] uppercase font-medium text-muted-foreground tracking-wider">
                  {a.rarity}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
