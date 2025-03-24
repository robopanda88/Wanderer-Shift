'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
}

interface Location {
  lat: number;
  lng: number;
}

interface POI {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<{ content: string; data: { pois: any[]; center: Location; radiusKm: number } | null }>;
  currentLocation: Location;
  onPOIsUpdated?: (pois: POI[], center: Location, radiusKm: number) => void;
}

function parseMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/<li>.+<\/li>/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br>');
  return html;
}

export default function ChatWindow({ messages, onSendMessage, currentLocation, onPOIsUpdated }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setInput('');
      return;
    }

    console.log('ChatWindow: Sending message:', input, 'with currentLocation:', currentLocation);
    setIsTyping(true);

    const response = await onSendMessage(input);
    if (response.data && onPOIsUpdated) {
      const mappedPois: POI[] = response.data.pois.map(poi => ({
        id: poi.id.toString(),
        lat: poi.lat,
        lng: poi.lon,
        name: poi.tags.name || 'Unnamed',
        category: poi.tags.amenity || poi.tags.leisure || poi.tags.tourism || 'unknown',
      }));
      onPOIsUpdated(mappedPois, response.data.center, response.data.radiusKm);
    }

    setInput('');
    setIsTyping(false);
  };

  const handleClearChat = () => {
    setInput('');
    console.log('Chat cleared (messages managed by parent)');
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-4xl mx-auto bg-white bg-opacity-90 bg-[url('/texture.png')] rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-gray-100">
        <h2 className="text-xl font-bold text-gray-800">TravelWeather Chat</h2>
        <button
          onClick={handleClearChat}
          className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-md"
          title="Clear chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'mb-4 p-3 rounded-lg max-w-[80%] shadow-sm',
              message.sender === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-green-200 text-gray-800 mr-auto'
            )}
          >
            <div
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
              className="prose max-w-none"
            />
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-gray-500"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <span>Typing...</span>
          </motion.div>
        )}
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300 bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about travel or weather..."
            className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-md",
              (isTyping || !input.trim()) && "opacity-50 cursor-not-allowed"
            )}
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}