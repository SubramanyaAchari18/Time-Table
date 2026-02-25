import { useState, useRef } from "react";
import { FolderPlus, Search, Upload, Trash2, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNotesFolders, useCreateFolder, useNotesFiles, useUploadFile, useDeleteFile } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

const Notes = () => {
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders } = useNotesFolders();
  const { data: files } = useNotesFiles(selectedFolder);
  const createFolder = useCreateFolder();
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
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 10MB", variant: "destructive" });
      return;
    }
    try {
      await uploadFile.mutateAsync({ file, folderId: selectedFolder });
      toast({ title: "File uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredFiles = files?.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notes</h1>
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
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => fileInputRef.current?.click()}>
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
      {folders && folders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFolder(undefined)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedFolder ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            All Files
          </button>
          {folders.map((f: any) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedFolder === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Folder className="h-3 w-3" /> {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Files list */}
      {uploadFile.isPending && (
        <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">Uploading...</CardContent></Card>
      )}

      {filteredFiles && filteredFiles.length > 0 ? (
        <div className="space-y-2">
          {filteredFiles.map((file: any) => (
            <Card key={file.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.file_size_bytes)} • {file.file_type}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => deleteFile.mutate({ id: file.id, filePath: file.file_path })}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !uploadFile.isPending && (
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
