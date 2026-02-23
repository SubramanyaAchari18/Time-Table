import { FolderPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const Notes = () => {
  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-6 safe-top">
      <h1 className="text-2xl font-bold text-foreground">Notes</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search notes..." className="pl-10 rounded-xl" />
      </div>

      {/* Empty state */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <FolderPlus className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
          <Button size="sm" className="gap-1.5 rounded-xl">
            <FolderPlus className="h-4 w-4" /> Create Folder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notes;
