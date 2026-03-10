import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as notes from "@/firebase/notesService";

export type NotesFolder = notes.NotesFolder;
export type NotesFile = notes.NotesFile;

export const useNotesFolders = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<NotesFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setFolders([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const unsub = notes.subscribeToFolders({
      userId: user.uid,
      onChange: (items) => {
        setFolders(items);
        setIsLoading(false);
        setError(null);
      },
      onError: (e) => {
        setError(e);
        setIsLoading(false);
      },
    });
    return () => unsub();
  }, [user]);

  return { folders, isLoading, error };
};

export const useNotesFiles = (folderId?: string) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<NotesFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const unsub = notes.subscribeToFiles({
      userId: user.uid,
      folderId,
      onChange: (items) => {
        setFiles(items);
        setIsLoading(false);
        setError(null);
      },
      onError: (e) => {
        setError(e);
        setIsLoading(false);
      },
    });
    return () => unsub();
  }, [user, folderId]);

  return { files, isLoading, error };
};

export const useCreateFolder = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (folder: { name: string }) => {
      if (!user) throw new Error("You must be signed in to create folders.");
      return await notes.createFolder({ userId: user.uid, name: folder.name });
    },
  });
};

export const useDeleteFolder = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (folderId: string) => {
      if (!user) throw new Error("You must be signed in to delete folders.");
      await notes.deleteFolder({ userId: user.uid, folderId });
    },
  });
};

export const useUploadFile = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, folderId, onProgress, signal }: { file: File; folderId?: string; onProgress?: (percent: number) => void; signal?: AbortSignal }) => {
      if (!user) throw new Error("You must be signed in to upload files.");
      return await notes.uploadFile({ userId: user.uid, folderId, file, onProgress, signal });
    },
  });
};

export const useDeleteFile = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      if (!user) throw new Error("You must be signed in to delete files.");
      await notes.deleteFile({ fileId: id });
    },
  });
};

export const useNotesUsage = (files: NotesFile[]) => {
  return useMemo(() => {
    const bytesUsed = files.reduce((sum, f) => sum + Number(f.size ?? 0), 0);
    return { bytesUsed };
  }, [files]);
};

