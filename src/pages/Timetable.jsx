import { useState } from "react";
import { Plus, Trash2, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useSubjects,
  useCreateSubject,
  useDeleteSubject,
  useSchedules,
  useCreateSchedule,
  useDeleteSchedule,
} from "@/hooks/useFirestoreData";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

const Timetable = () => {
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    color: COLORS[0],
    duration_minutes: 30,
    priority: "medium",
  });
  const [newSchedule, setNewSchedule] = useState({
    subject_id: "",
    start_time: "09:00",
    end_time: "10:00",
  });

  const { data: subjects } = useSubjects();
  const { data: schedules, isLoading } = useSchedules(selectedDay);
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) return;
    try {
      await createSubject.mutateAsync(newSubject);
      setShowSubjectDialog(false);
      setNewSubject({
        name: "",
        color: COLORS[0],
        duration_minutes: 30,
        priority: "medium",
      });
      toast({ title: "Subject added!" });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.subject_id) return;
    try {
      await createSchedule.mutateAsync({
        ...newSchedule,
        day_of_week: selectedDay,
      });
      setShowScheduleDialog(false);
      setNewSchedule({
        subject_id: "",
        start_time: "09:00",
        end_time: "10:00",
      });
      toast({ title: "Schedule entry added!" });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Timetable</h1>
        <div className="flex gap-2">
          <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-xl"
              >
                <Plus className="h-4 w-4" /> Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder="e.g. Mathematics"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${newSubject.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                        onClick={() =>
                          setNewSubject((s) => ({ ...s, color: c }))
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newSubject.duration_minutes}
                    onChange={(e) =>
                      setNewSubject((s) => ({
                        ...s,
                        duration_minutes: parseInt(e.target.value) || 30,
                      }))
                    }
                    min={15}
                    max={180}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleAddSubject}
                  disabled={createSubject.isPending}
                >
                  {createSubject.isPending ? "Adding..." : "Add Subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" /> Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to {DAYS[selectedDay]}'s Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={newSchedule.subject_id}
                    onValueChange={(v) =>
                      setNewSchedule((s) => ({ ...s, subject_id: v }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: sub.color }}
                            />
                            {sub.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) =>
                        setNewSchedule((s) => ({
                          ...s,
                          start_time: e.target.value,
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) =>
                        setNewSchedule((s) => ({
                          ...s,
                          end_time: e.target.value,
                        }))
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={handleAddSchedule}
                  disabled={createSchedule.isPending || !newSchedule.subject_id}
                >
                  {createSchedule.isPending ? "Adding..." : "Add to Schedule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Day toggle */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`flex min-w-[3rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              i === selectedDay
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span>{day}</span>
          </button>
        ))}
      </div>

      {/* Schedule entries */}
      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : schedules && schedules.length > 0 ? (
        <div className="space-y-2">
          {schedules.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className="h-full w-1 self-stretch rounded-full"
                  style={{
                    backgroundColor:
                      entry.subjects?.color || "hsl(var(--primary))",
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {entry.subjects?.name || "Subject"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {entry.start_time?.slice(0, 5)} –{" "}
                    {entry.end_time?.slice(0, 5)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => navigate(`/timer/${entry.subject_id}`)}
                >
                  <Play className="h-3 w-3" /> Start Study
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => deleteSchedule.mutate(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-muted-foreground">
              No subjects for {DAYS[selectedDay]}
            </p>
            {subjects && subjects.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowScheduleDialog(true)}
              >
                Add to Schedule
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowSubjectDialog(true)}
              >
                Create a Subject First
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subjects list */}
      {subjects && subjects.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Your Subjects
          </h2>
          <div className="space-y-2">
            {subjects.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className="h-8 w-8 rounded-lg"
                    style={{ backgroundColor: sub.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {sub.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.duration_minutes} min • {sub.priority}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl text-xs gap-1.5"
                    onClick={() => navigate(`/timer/${sub.id}`)}
                  >
                    <Play className="h-3 w-3" /> Start Study
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => deleteSubject.mutate(sub.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
