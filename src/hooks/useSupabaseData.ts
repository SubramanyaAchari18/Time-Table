import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ==================== PROFILE ====================
export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ==================== SUBJECTS ====================
export const useSubjects = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subjects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateSubject = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subject: { name: string; color: string; duration_minutes: number; priority: string; study_goals?: string }) => {
      const { data, error } = await supabase
        .from("subjects")
        .insert({ ...subject, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
};

// ==================== SCHEDULES ====================
export const useSchedules = (dayOfWeek?: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["schedules", user?.id, dayOfWeek],
    queryFn: async () => {
      let query = supabase
        .from("schedules")
        .select("*, subjects(*)")
        .eq("user_id", user!.id)
        .order("start_time", { ascending: true });
      if (dayOfWeek !== undefined) {
        query = query.eq("day_of_week", dayOfWeek);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateSchedule = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: { subject_id: string; day_of_week: number; start_time: string; end_time: string }) => {
      const { data, error } = await supabase
        .from("schedules")
        .insert({ ...schedule, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

export const useDeleteSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

// ==================== STUDY SESSIONS ====================
export const useStudySessions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study_sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*, subjects(name, color)")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateStudySession = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: { subject_id: string; duration_seconds: number; completed: boolean; gems_earned: number; rating?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({ ...session, user_id: user!.id, ended_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;

      // Update daily progress
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("daily_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .single();

      if (existing) {
        await supabase
          .from("daily_progress")
          .update({
            total_study_seconds: existing.total_study_seconds + session.duration_seconds,
            sessions_completed: existing.sessions_completed + (session.completed ? 1 : 0),
            gems_earned: existing.gems_earned + session.gems_earned,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("daily_progress").insert({
          user_id: user!.id,
          date: today,
          total_study_seconds: session.duration_seconds,
          sessions_completed: session.completed ? 1 : 0,
          gems_earned: session.gems_earned,
        });
      }

      // Update profile gems
      if (session.gems_earned > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gems")
          .eq("user_id", user!.id)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ gems: profile.gems + session.gems_earned })
            .eq("user_id", user!.id);
        }
      }

      return data;
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
    queryKey: ["daily_progress", user?.id, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from("daily_progress")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useTodayProgress = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily_progress", user?.id, "today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ==================== ACHIEVEMENTS ====================
export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_achievements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ==================== NOTES ====================
export const useNotesFolders = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes_folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_folders")
        .select("*, subjects(name, color)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateFolder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folder: { name: string; subject_id?: string; parent_folder_id?: string }) => {
      const { data, error } = await supabase
        .from("notes_folders")
        .insert({ ...folder, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes_folders"] }),
  });
};

export const useNotesFiles = (folderId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes_files", user?.id, folderId],
    queryFn: async () => {
      let query = supabase
        .from("notes_files")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (folderId) {
        query = query.eq("folder_id", folderId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUploadFile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folderId, subjectId }: { file: File; folderId?: string; subjectId?: string }) => {
      const filePath = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("notes_files")
        .insert({
          user_id: user!.id,
          folder_id: folderId || null,
          subject_id: subjectId || null,
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size_bytes: file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes_files"] }),
  });
};

export const useDeleteFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from("study-materials").remove([filePath]);
      const { error } = await supabase.from("notes_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes_files"] }),
  });
};

// ==================== STREAK CALCULATION ====================
export const useStreak = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_progress")
        .select("date")
        .eq("user_id", user!.id)
        .gt("sessions_completed", 0)
        .order("date", { ascending: false })
        .limit(365);
      if (error) throw error;

      if (!data || data.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < data.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const dateStr = expectedDate.toISOString().split("T")[0];

        if (data[i].date === dateStr) {
          streak++;
        } else if (i === 0 && streak === 0) {
          // Allow today to be missing (hasn't studied yet today)
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (data[i].date === yesterday.toISOString().split("T")[0]) {
            streak++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      return streak;
    },
    enabled: !!user,
  });
};
