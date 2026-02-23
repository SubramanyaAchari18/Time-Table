import { Flame, Gem, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good morning 👋</p>
          <h1 className="text-2xl font-bold text-foreground">Student</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
            <Gem className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">0</span>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <Card className="border-0 bg-gradient-to-r from-primary to-primary/80">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-foreground/80">Current Streak</p>
            <p className="text-2xl font-bold text-primary-foreground">0 days</p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Progress */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Progress</h2>
          <span className="text-sm text-muted-foreground">0/0 sessions</span>
        </div>
        <Progress value={0} className="h-2.5 rounded-full" />
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
          <Button variant="ghost" size="sm" className="text-primary">View all</Button>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No subjects scheduled yet</p>
            <Button size="sm" className="rounded-xl">Add Subject</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Achievements</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Complete your first session to earn badges!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
