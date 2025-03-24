'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { Message, Location } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentLocation: Location;
}

export default function ChatWindow({ messages, onSendMessage, currentLocation }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('ChatWindow: Sending message:', input, 'with currentLocation:', currentLocation);
      setIsTyping(true);
      await onSendMessage(input);
      setInput('');
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <div className="neomorphic h-[600px] overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/5 bg-secondary/30 px-6 py-4">
          <Bot size={24} className="text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-primary">Travel Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask me anything about weather and travel</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={cn(
                      "glass-card max-w-[80%] px-4 py-3",
                      message.sender === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-secondary/30'
                    )}
                  >
                    <p className="text-sm text-foreground">{message.content}</p>
                    {message.data && (
                      <pre className="mt-2 rounded bg-secondary/20 p-2 text-xs">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Assistant is typing...</span>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="border-t border-white/5 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about weather, attractions, or travel tips..."
              className="glass-input flex-1"
              disabled={isTyping}
            />
            <Button
              type="submit"
              variant="neomorphic"
              size="icon"
              disabled={isTyping}
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}