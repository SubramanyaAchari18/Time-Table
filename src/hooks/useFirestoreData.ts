import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as fs from "@/firebase/firestoreService";
import * as ev from "@/firebase/eventsService";

// ==================== PROFILE ====================
export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.uid],
    queryFn: async () => {
      const p = await fs.getUserProfile(user!.uid);
      return {
        display_name: p?.name ?? user?.displayName ?? user?.email?.split("@")[0] ?? "Student",
        gems: 0,
      };
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: { display_name: string }) => {
      await fs.updateUserProfile(user!.uid, { name: profile.display_name });
    },
    onSuccess: (_data, variables) => {
      qc.setQueryData(["profile", user?.uid], (old: any) => ({
        ...(old || {}),
        display_name: variables.display_name,
      }));
    },
  });
};

// ==================== SUBJECTS ====================
export const useSubjects = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subjects", user?.uid],
    queryFn: async () => {
      const rows = await fs.getSubjects(user!.uid);
      return rows.map((r: any) => ({
        id: r.id,
        user_id: r.userId,
        name: r.subjectName,
        color: r.color ?? "#6366F1",
        duration_minutes: r.studyDuration ?? 30,
        priority: r.priority ?? "medium",
      }));
    },
    enabled: !!user,
  });
};

export const useCreateSubject = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subject: { name: string; color: string; duration_minutes: number; priority: string; study_goals?: string }) => {
      void subject.study_goals;
      return await fs.addSubject(user!.uid, {
        subjectName: subject.name,
        studyDuration: subject.duration_minutes,
        color: subject.color,
        priority: subject.priority,
      });
    },
    onSuccess: (created) => {
      // Optimistically update subjects list so UI reflects new subject immediately
      qc.setQueryData<any[]>(["subjects", user?.uid], (old) => [
        ...(old ?? []),
        {
          id: created.id,
          user_id: created.userId,
          name: created.subjectName,
          color: created.color ?? "#6366F1",
          duration_minutes: created.studyDuration ?? 30,
          priority: created.priority ?? "medium",
        },
      ]);
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useDeleteSubject = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await fs.deleteSubject(user!.uid, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
};

// ==================== SCHEDULES ====================
export const useSchedules = (dayOfWeek?: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["schedules", user?.uid, dayOfWeek],
    queryFn: async () => {
      const schedules = await fs.getSchedules(user!.uid, dayOfWeek);
      const subjects = await fs.getSubjects(user!.uid);
      const subjectById = new Map(subjects.map((s: any) => [s.id, s]));
      return schedules.map((s: any) => {
        const subj = subjectById.get(s.subjectId);
        return {
          id: s.id,
          subject_id: s.subjectId,
          day_of_week: s.dayOfWeek,
          start_time: s.startTime,
          end_time: s.endTime,
          subjects: subj ? { id: subj.id, name: subj.subjectName, color: subj.color ?? "#6366F1" } : undefined,
        };
      });
    },
    enabled: !!user,
  });
};

export const useCreateSchedule = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: { subject_id: string; day_of_week: number; start_time: string; end_time: string }) => {
      return await fs.addSchedule(user!.uid, {
        subjectId: schedule.subject_id,
        dayOfWeek: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

export const useDeleteSchedule = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await fs.deleteSchedule(user!.uid, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

// ==================== STUDY SESSIONS ====================
export const useStudySessions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study_sessions", user?.uid],
    queryFn: async () => {
      const sessions = await fs.getStudySessions(user!.uid);
      const subjects = await fs.getSubjects(user!.uid);
      const subjectById = new Map(subjects.map((s: any) => [s.id, s]));
      return sessions.map((s: any) => {
        const subj = subjectById.get(s.subjectId);
        const startedAt = s.startTime?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
        return {
          id: s.id,
          user_id: s.userId,
          subject_id: s.subjectId,
          started_at: startedAt,
          ended_at: s.endTime?.toDate?.()?.toISOString?.() ?? null,
          duration_seconds: Number(s.durationSeconds ?? 0),
          completed: !!s.completed,
          gems_earned: Number(s.gemsEarned ?? 0),
          rating: s.rating ?? null,
          subjects: subj ? { name: subj.subjectName, color: subj.color ?? "#6366F1" } : undefined,
        };
      });
    },
    enabled: !!user,
  });
};

export const useCreateStudySession = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: { subject_id: string; duration_seconds: number; completed: boolean; gems_earned: number; rating?: number; notes?: string }) => {
      void session.notes;
      return await fs.recordStudySession({
        userId: user!.uid,
        subjectId: session.subject_id,
        durationSeconds: session.duration_seconds,
        completed: session.completed,
        gemsEarned: session.gems_earned,
        rating: session.rating,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study_sessions"] });
      qc.invalidateQueries({ queryKey: ["daily_progress"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

// ==================== DAILY PROGRESS ====================
export const useDailyProgress = (days: number = 30) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_progress", user?.uid, days],
    queryFn: async () => await fs.getDailyProgress(user!.uid, days),
    enabled: !!user,
  });
};

export const useTodayProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_progress", user?.uid, "today"],
    queryFn: async () => await fs.getTodayProgress(user!.uid),
    enabled: !!user,
  });
};

// ==================== ACHIEVEMENTS ====================
export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => await fs.getAchievements(),
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_achievements", user?.uid],
    queryFn: async () => await fs.getUserAchievements(user!.uid),
    enabled: !!user,
  });
};

// ==================== STUDY CALENDAR EVENTS ====================
export const useStudyEvents = (year: number, month: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study_events", user?.uid, year, month],
    queryFn: async () => await ev.getEventsForMonth(user!.uid, year, month),
    enabled: !!user,
  });
};

export const useCreateStudyEvent = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; date: string; type: ev.StudyEventType }) => {
      return await ev.createEvent({
        userId: user!.uid,
        title: payload.title,
        description: payload.description,
        date: payload.date,
        type: payload.type,
      });
    },
    onSuccess: (_created, variables) => {
      const d = new Date(variables.date);
      qc.invalidateQueries({ queryKey: ["study_events", user?.uid, d.getFullYear(), d.getMonth()] });
    },
  });
};

export const useUpdateStudyEvent = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; title: string; description?: string; type: ev.StudyEventType; date: string }) => {
      await ev.updateEvent(payload.id, {
        title: payload.title,
        description: payload.description,
        type: payload.type,
      });
    },
    onSuccess: (_data, variables) => {
      const d = new Date(variables.date);
      qc.invalidateQueries({ queryKey: ["study_events", user?.uid, d.getFullYear(), d.getMonth()] });
    },
  });
};

export const useDeleteStudyEvent = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; date: string }) => {
      await ev.deleteEvent(payload.id);
    },
    onSuccess: (_data, variables) => {
      const d = new Date(variables.date);
      qc.invalidateQueries({ queryKey: ["study_events", user?.uid, d.getFullYear(), d.getMonth()] });
    },
  });
};

// ==================== STREAK CALCULATION ====================
export const useStreak = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["streak", user?.uid],
    queryFn: async () => await fs.getStreak(user!.uid),
    enabled: !!user,
  });
};

