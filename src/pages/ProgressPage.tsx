import { Card, CardContent } from "@/components/ui/card";
import { Flame, Clock, BookOpen } from "lucide-react";

const stats = [
  { icon: Flame, label: "Current Streak", value: "0 days", color: "text-warning" },
  { icon: Clock, label: "Total Hours", value: "0h", color: "text-primary" },
  { icon: BookOpen, label: "Sessions", value: "0", color: "text-accent" },
];

const ProgressPage = () => {
  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground">Progress</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <span className="text-lg font-bold text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground text-center">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar heatmap placeholder */}
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Study calendar heatmap will appear here once you start studying.
          </p>
        </CardContent>
      </Card>

      {/* Charts placeholder */}
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Subject distribution and weekly trends will show here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;
