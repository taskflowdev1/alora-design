import * as React from "react";
import { Smile } from "react-feather";
import { cn } from "@/lib/ad";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";

export interface Reaction {
  emoji: string;
  /** Names of people who reacted. */
  by: string[];
}

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  time: string;
  body: React.ReactNode;
  reactions?: Reaction[];
}

const EMOJI = ["👍", "🙏", "🎉", "👀", "✅", "😂"];

/** One of the two places emoji belong: reactions under comments. Same bubble padding as chips. */
function Reactions({ reactions, me, onReact }: { reactions: Reaction[]; me: string; onReact: (emoji: string) => void }) {
  const pill = (mine: boolean) =>
    cn(
      "inline-flex h-6 cursor-pointer select-none items-center gap-1 rounded-item px-bubble-sm text-small tabular-nums transition-[background-color,box-shadow,transform] duration-[160ms] ease-ad active:scale-95",
      mine ? "bg-sel text-ink shadow-sel" : "bg-fill text-ink-muted hover:bg-fill-hover",
    );
  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions
        .filter((r) => r.by.length)
        .map((r) => (
          <button key={r.emoji} type="button" title={r.by.join(", ")} className={pill(r.by.includes(me))} onClick={() => onReact(r.emoji)}>
            <span className="text-[13px] leading-none">{r.emoji}</span>
            {r.by.length}
          </button>
        ))}
      <Popover
        trigger={
          <button type="button" aria-label="Add reaction" className={cn(pill(false), "px-1.5")}>
            <Smile size={14} />
          </button>
        }
      >
        <div className="flex gap-0.5">
          {EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`React ${e}`}
              onClick={() => onReact(e)}
              className="grid size-8 cursor-pointer place-items-center rounded-control text-[16px] transition-[background-color,box-shadow,transform] duration-[160ms] hover:bg-fill active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
}

export interface CommentThreadProps {
  comments: Comment[];
  /** The signed-in person's name, to mark their own reactions. */
  me: string;
  onReact: (commentId: string, emoji: string) => void;
  onReply?: (text: string) => void;
  className?: string;
}

/** Comments as soft bubbles beside a circle avatar, reactions under each, a reply box at the bottom. */
export function CommentThread({ comments, me, onReact, onReply, className }: CommentThreadProps) {
  const [text, setText] = React.useState("");
  const send = () => {
    if (!text.trim()) return;
    onReply?.(text.trim());
    setText("");
  };
  return (
    <div className={cn("grid gap-4", className)}>
      {comments.map((c) => (
        <div key={c.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-2.5">
          <Avatar name={c.author} src={c.avatar} />
          <div className="grid min-w-0 justify-items-start gap-1.5">
            <div className="rounded-card bg-fill px-3 py-2">
              <div className="flex items-baseline gap-2 text-body">
                <span className="font-medium text-ink">{c.author}</span>
                <span className="text-small tabular-nums text-ink-muted">{c.time}</span>
              </div>
              <div className="mt-0.5 text-body text-ink">{c.body}</div>
            </div>
            <Reactions reactions={c.reactions ?? []} me={me} onReact={(e) => onReact(c.id, e)} />
          </div>
        </div>
      ))}
      {onReply ? (
        <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-2.5">
          <Avatar name={me} />
          <div className="flex items-end gap-2 rounded-card bg-fill p-nest pl-3 focus-within:bg-fill-hover">
            <textarea
              rows={1}
              value={text}
              aria-label="Reply"
              placeholder="Reply"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
              }}
              className="max-h-32 min-h-item flex-1 resize-none bg-transparent py-1.5 text-body leading-5 text-ink outline-none [field-sizing:content] placeholder:text-ink-faint"
            />
            <Button variant="primary" size="sm" onClick={send} disabled={!text.trim()}>
              Send
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
