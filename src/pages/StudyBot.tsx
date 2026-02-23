import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const suggestions = [
  "Explain photosynthesis",
  "Help me with algebra",
  "Tips for better focus",
  "Summarize a chapter",
];

const StudyBot = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Study Bot</h1>
            <p className="text-xs text-muted-foreground">AI-powered study assistant</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <Bot className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-center text-sm text-muted-foreground">
          Ask me anything about your studies — I'm here to help!
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 pb-24">
        <div className="flex gap-2">
          <Input placeholder="Type your question..." className="rounded-xl flex-1" />
          <Button size="icon" className="h-10 w-10 rounded-xl shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyBot;
