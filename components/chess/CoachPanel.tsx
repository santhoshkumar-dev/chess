"use client";

import React, { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { 
  Bot, 
  ChevronRight, 
  Eraser, 
  MessageSquare, 
  Sparkles,
  User,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Lightweight formatter for LLM responses.
 * Replaces **text** with bold spans.
 */
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <b key={i} className="font-bold text-primary dark:text-primary/90">
              {part.slice(2, -2)}
            </b>
          );
        }
        return part;
      })}
    </>
  );
};

/**
 * AI Companion Panel for real-time coaching feedback.
 */
export default function CoachPanel() {
  const { 
    coachMessages, 
    isCoachThinking, 
    clearCoachMessages,
    addCoachMessage
  } = useGameStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [coachMessages, isCoachThinking]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1d1a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden group">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase">AI Companion Mode</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => clearCoachMessages()}
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          title="Clear Coaching History"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="flex flex-col gap-4 min-h-full">
          {coachMessages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                msg.role === "assistant" 
                   ? "bg-zinc-900 border-zinc-700 text-zinc-100" 
                   : "bg-primary border-primary-foreground/10 text-primary-foreground"
              )}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={cn(
                "flex flex-col max-w-[85%]",
                msg.role === "assistant" ? "items-start" : "items-end"
              )}>
                <div className={cn(
                  "px-3 py-2 text-sm leading-relaxed rounded-2xl shadow-sm border",
                  msg.role === "assistant" 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border-zinc-200 dark:border-zinc-700" 
                    : "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                )}>
                  <FormattedText text={msg.content} />
                </div>
              </div>
            </div>
          ))}

          {/* Thinking State */}
          {isCoachThinking && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary animate-bounce" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Analyzing Strategy...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-primary" />
            </div>
            <span className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">Coach Precision: High</span>
        </div>
      </div>
    </div>
  );
}
