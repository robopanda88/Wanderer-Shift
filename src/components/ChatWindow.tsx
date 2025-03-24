'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { Message, Location } from '@/types';
import { Paper, TextInput, Button, ScrollArea, Card, Text, Group, Stack, Box, Code } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';

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
    <Paper radius="lg" className="h-[600px]" withBorder shadow="md">
      <Stack h="100%" gap={0}>
        <Group
          p="md"
          bg="blue.6"
          style={{
            borderTopLeftRadius: 'var(--mantine-radius-lg)',
            borderTopRightRadius: 'var(--mantine-radius-lg)',
          }}
        >
          <Bot size={24} className="text-white" />
          <div>
            <Text size="lg" fw={600} c="white">Travel Assistant</Text>
            <Text size="sm" c="white" opacity={0.9}>Ask me anything about weather and travel</Text>
          </div>
        </Group>

        <ScrollArea h="calc(100% - 140px)" p="md" viewportRef={scrollAreaRef}>
          <Stack gap="md">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    withBorder
                    radius="md"
                    padding="sm"
                    style={{
                      maxWidth: '80%',
                      marginLeft: message.sender === 'user' ? 'auto' : 0,
                      backgroundColor: message.sender === 'user' ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-0)',
                    }}
                  >
                    <Text c={message.sender === 'user' ? 'white' : 'dark'}>
                      {message.content}
                    </Text>
                    {message.data && (
                      <Code block mt="xs" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                        {JSON.stringify(message.data, null, 2)}
                      </Code>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Box style={{ maxWidth: '80%' }}>
                  <Group gap="xs">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <Text size="sm" c="dimmed">Assistant is typing...</Text>
                  </Group>
                </Box>
              </motion.div>
            )}
          </Stack>
        </ScrollArea>

        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Group p="md" gap="sm" align="flex-start">
            <TextInput
              placeholder="Ask about weather, attractions, or travel tips..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1 }}
              radius="md"
              disabled={isTyping}
            />
            <Button
              type="submit"
              variant="filled"
              radius="md"
              loading={isTyping}
            >
              <Send size={20} />
            </Button>
          </Group>
        </form>
      </Stack>
    </Paper>
  );
}