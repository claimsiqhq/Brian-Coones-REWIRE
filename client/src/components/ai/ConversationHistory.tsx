import { formatDistanceToNow } from "date-fns";
import { useAiConversations } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MessageSquare, Loader2 } from "lucide-react";

interface ConversationHistoryProps {
  onSelectConversation?: (id: string) => void;
}

export function ConversationHistory({ onSelectConversation }: ConversationHistoryProps) {
  const { data: conversations, isLoading } = useAiConversations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-sage animate-spin" />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-8 text-sage/60">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a coaching session to see your history</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation?.(conv.id)}
            className="w-full text-left p-3 rounded-lg bg-deep-pine/50 hover:bg-deep-pine transition-colors border border-forest-floor/30"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                conv.sessionType === "voice"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}>
                {conv.sessionType === "voice" ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-birch">
                    {conv.sessionType === "voice" ? "Voice Session" : conv.actionType ? `${conv.actionType.charAt(0).toUpperCase() + conv.actionType.slice(1)} Session` : "Chat Session"}
                  </span>
                  <span className="text-xs text-sage/60">
                    {conv.startedAt ? formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true }) : ""}
                  </span>
                </div>
                {conv.summary && (
                  <p className="text-xs text-sage/70 mt-1 line-clamp-2">
                    {conv.summary}
                  </p>
                )}
                {conv.messagesCount > 0 && (
                  <p className="text-xs text-sage/50 mt-1">
                    {conv.messagesCount} message{conv.messagesCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
