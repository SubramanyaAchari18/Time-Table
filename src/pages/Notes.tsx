import { useMemo, useState, useRef } from "react";
import { FolderPlus, Search, Upload, Trash2, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNotesFolders, useCreateFolder, useDeleteFolder, useNotesFiles, useUploadFile, useDeleteFile, useNotesUsage } from "@/hooks/useNotes";
import { useToast } from "@/hooks/use-toast";
import { resolveDownloadUrl } from "@/firebase/notesService";

const Notes = () => {
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { folders, isLoading: foldersLoading, error: foldersError } = useNotesFolders();
  const { files, isLoading: filesLoading, error: filesError } = useNotesFiles(selectedFolder);
  const usage = useNotesUsage(files);
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const { toast } = useToast();

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await createFolder.mutateAsync({ name: folderName });
      setShowFolderDialog(false);
      setFolderName("");
      toast({ title: "Folder created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 150MB", variant: "destructive" });
      return;
    }
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      newWindow.document.write("<html><body><p style='font-family:sans-serif;'>Uploading your file... This window will show your file when ready.</p></body></html>");
    }

    try {
      setUploadingFileName(file.name);
      setUploadProgress(0);
      abortControllerRef.current = new AbortController();
      const uploadedFile = await uploadFile.mutateAsync({
        file,
        folderId: selectedFolder,
        onProgress: (percent) => setUploadProgress(percent),
        signal: abortControllerRef.current.signal,
      });
      toast({ title: "File uploaded!" });
      if (newWindow) {
        newWindow.location.href = uploadedFile.fileURL || uploadedFile.storagePath;
      } else {
        handleOpenFile(uploadedFile); // fallback if popup blocked initially
      }
    } catch (err: any) {
      if (err?.code === "storage/canceled") {
        toast({ title: "Upload cancelled" });
      } else {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      }
      if (newWindow) newWindow.close();
    }
    abortControllerRef.current = null;
    setUploadingFileName(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredFiles = useMemo(
    () => files.filter((f: any) => f.name.toLowerCase().includes(search.toLowerCase())),
    [files, search]
  );

  const handleOpenFile = async (file: any) => {
    try {
      let url: string | null = file.fileURL || null;
      if (!url && file.storagePath) url = await resolveDownloadUrl({ storagePath: file.storagePath });

      if (!url) {
        toast({
          title: "File is still processing",
          description: "Please wait a few seconds and try again.",
        });
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Unable to open file",
        description: "The file link is not available yet.",
        variant: "destructive",
      });
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const usageText = usage?.bytesUsed ? `${formatSize(usage.bytesUsed)} used` : null;

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          {usageText && <p className="text-xs text-muted-foreground mt-0.5">{usageText}</p>}
        </div>
        <div className="flex gap-2">
          <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Folder Name</Label>
                  <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. Chapter 1" className="rounded-xl" />
                </div>
                <Button className="w-full rounded-xl" onClick={handleCreateFolder} disabled={createFolder.isPending}>
                  {createFolder.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={uploadFile.isPending}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {/* Folders */}
      {foldersError && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">Failed to load folders: {foldersError.message}</CardContent>
        </Card>
      )}

      {foldersLoading && (
        <Card>
          <CardContent className="p-4 text-center text-sm text-muted-foreground">Loading folders...</CardContent>
        </Card>
      )}

      {folders && folders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFolder(undefined)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${!selectedFolder ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
          >
            All Files
          </button>
          {folders.map((f: any) => (
            <div key={f.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedFolder(f.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${selectedFolder === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
              >
                <Folder className="h-3 w-3" /> {f.name}
              </button>
              <button
                className="text-[10px] text-muted-foreground hover:text-destructive px-1"
                onClick={async () => {
                  if (selectedFolder === f.id) setSelectedFolder(undefined);
                  try {
                    await deleteFolder.mutateAsync(f.id);
                    toast({ title: "Folder deleted" });
                  } catch (err: any) {
                    toast({ title: "Delete failed", description: err.message ?? "Could not delete folder", variant: "destructive" });
                  }
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Files list */}
      {uploadFile.isPending && (
        <Card>
          <CardContent className="flex items-center justify-between p-4 text-sm text-muted-foreground w-full">
            <div className="flex-1 truncate pr-4">
              {uploadProgress !== null
                ? `Uploading${uploadingFileName ? ` "${uploadingFileName}"` : ""}... ${uploadProgress}%`
                : "Uploading..."}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => {
                abortControllerRef.current?.abort();
              }}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {filesError && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">Failed to load files: {filesError.message}</CardContent>
        </Card>
      )}

      {filesLoading && !uploadFile.isPending && (
        <Card>
          <CardContent className="p-4 text-center text-sm text-muted-foreground">Loading files...</CardContent>
        </Card>
      )}

      {filteredFiles.length > 0 ? (
        <div className="space-y-2">
          {filteredFiles.map((file: any) => (
            <Card
              key={file.id}
              className="cursor-pointer hover:bg-accent/40 transition-colors"
              onClick={() => handleOpenFile(file)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size ?? null)}
                    {file.type ? ` • ${file.type}` : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile.mutate(
                      { id: file.id },
                      {
                        onSuccess: () => toast({ title: "File deleted" }),
                        onError: (err: any) =>
                          toast({ title: "Delete failed", description: err.message ?? "Could not delete file", variant: "destructive" }),
                      }
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !uploadFile.isPending && !filesLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16">
              <FolderPlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{search ? "No files match your search" : "No notes yet"}</p>
              {!search && (
                <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload File
                </Button>
              )}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default Notes;
