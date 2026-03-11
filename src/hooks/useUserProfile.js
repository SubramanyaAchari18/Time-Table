import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreDb, firebaseStorage } from "@/firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Helper to fetch user profile directly
const fetchUserProfile = async (userId) => {
  const snap = await getDoc(doc(firestoreDb, "users", userId));
  return snap.exists() ? snap.data() : null;
};

// Hook to pull user profile
export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userProfile", user?.uid],
    queryFn: async () => {
      const data = await fetchUserProfile(user.uid);
      return {
        // Fallbacks
        name: data?.name || user?.displayName || user?.email?.split("@")[0] || "Student",
        email: data?.email || user?.email || "",
        avatarUrl: data?.avatarUrl || null,
        college: data?.college || "",
        year: data?.year || "",
        department: data?.department || "",
        timetable: data?.timetable || [], // Timetable structure
        ...data,
      };
    },
    enabled: !!user,
  });
};

// Hook to update simple profile details
export const useUpdateUserProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const userRef = doc(firestoreDb, "users", user.uid);
      await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      return updates;
    },
    onSuccess: (updates) => {
      qc.setQueryData(["userProfile", user?.uid], (old) => ({
        ...(old || {}),
        ...updates,
      }));
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

// Hook specific for uploading avatar
export const useUploadAvatar = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateProfile = useUpdateUserProfile();

  return useMutation({
    mutationFn: async (file) => {
      if (!file) throw new Error("No file selected");
      
      const storageRef = ref(firebaseStorage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update firestore with new avatar URL
      await updateProfile.mutateAsync({ avatarUrl: downloadUrl });
      
      return downloadUrl;
    },
    onSuccess: (url) => {
      qc.setQueryData(["userProfile", user?.uid], (old) => ({
        ...(old || {}),
        avatarUrl: url,
      }));
    },
  });
};
