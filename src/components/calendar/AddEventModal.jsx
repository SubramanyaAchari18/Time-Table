import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from "@/hooks/useCalendar";

const EVENT_TYPES = [
  { value: "exam", label: "Exam" },
  { value: "assignment", label: "Assignment" },
  { value: "study", label: "Study reminder" },
];

import { toLocalDateKey } from "@/lib/utils";

export const AddEventModal = ({ open, onOpenChange, date, eventToEdit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("exam");

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description ?? "");
      setEventType(eventToEdit.eventType);
    } else {
      setTitle("");
      setDescription("");
      setEventType("exam");
    }
  }, [eventToEdit, date]);

  const handleSave = async () => {
    if (!date || !title.trim()) return;
    const eventDate = toLocalDateKey(date);
    try {
      if (eventToEdit) {
        await updateEvent.mutateAsync({
          id: eventToEdit.id,
          title: title.trim(),
          description: description.trim() || "",
          eventType,
        });
      } else {
        await createEvent.mutateAsync({
          title: title.trim(),
          description: description.trim() || "",
          eventType,
          eventDate,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving event:", err);
      // errors are handled by parent via toasts if needed
    }
  };

  const isSaving = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? "Edit Event" : "Add Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Math Exam, Project Submission"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra details or study goals..."
              className="rounded-xl min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <Select value={eventType} onValueChange={(v) => setEventType(v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="rounded-xl w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : eventToEdit
                ? "Save changes"
                : "Add event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventModal;
