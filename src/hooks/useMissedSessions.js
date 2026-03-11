import { useMemo } from "react";
import { useSchedules, useStudySessions } from "./useFirestoreData";
import { toLocalDateKey } from "@/lib/utils";

export const useMissedSessions = () => {
  const dayOfWeek = new Date().getDay();
  const schemaDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const { data: todaySchedules } = useSchedules(schemaDay);
  const { data: sessions } = useStudySessions();

  return useMemo(() => {
    if (!todaySchedules || !sessions) return [];

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const todayStr = toLocalDateKey(now);

    // Get subject IDs that have a session today
    const completedSubjectIds = new Set(
      sessions
        .filter((s) => s.started_at?.startsWith(todayStr))
        .map((s) => s.subject_id),
    );

    return todaySchedules
      .filter((schedule) => {
        // Schedule end time has passed and no session recorded for this subject today
        const endTime = schedule.end_time?.slice(0, 5) || "23:59";
        return (
          endTime < currentTimeStr &&
          !completedSubjectIds.has(schedule.subject_id)
        );
      })
      .map((schedule) => ({
        scheduleId: schedule.id,
        subjectId: schedule.subject_id,
        subjectName: schedule.subjects?.name || "Subject",
        subjectColor: schedule.subjects?.color || "#6366F1",
        startTime: schedule.start_time?.slice(0, 5) || "",
        endTime: schedule.end_time?.slice(0, 5) || "",
      }));
  }, [todaySchedules, sessions]);
};
