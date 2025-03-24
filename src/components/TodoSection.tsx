'use client';

import React, { useState } from 'react';
import { format, isToday } from 'date-fns';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Task } from '@/types';
import { Paper, Text, Stack, Group, Box, Collapse, ActionIcon, Card, UnstyledButton } from '@mantine/core';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface TodoSectionProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
  onTaskSelect: (task: Task) => void;
  selectedTask?: Task;
}

export default function TodoSection({ tasks, onTaskToggle, onTaskSelect, selectedTask }: TodoSectionProps) {
  const [showFutureTasks, setShowFutureTasks] = useState(false);

  const todayTasks = tasks.filter(task => isToday(new Date(task.dueDate)));
  const futureTasks = tasks.filter(task => !isToday(new Date(task.dueDate)));

  return (
    <Paper radius="lg" p="lg" withBorder shadow="sm">
      <Stack>
        <Text size="xl" fw={600}>Today's Tasks</Text>
        <Stack gap="xs">
          {todayTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TaskItem
                task={task}
                onToggle={onTaskToggle}
                onSelect={onTaskSelect}
                isSelected={selectedTask?.id === task.id}
              />
            </motion.div>
          ))}
        </Stack>

        {futureTasks.length > 0 && (
          <Stack mt="md">
            <UnstyledButton
              onClick={() => setShowFutureTasks(!showFutureTasks)}
              className="hover:bg-gray-100 rounded-md p-2 transition-colors w-full text-left"
            >
              <Group>
                <Text>Upcoming Tasks</Text>
                <motion.div
                  animate={{ rotate: showFutureTasks ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </Group>
            </UnstyledButton>

            <Collapse in={showFutureTasks}>
              <Stack gap="xs" mt="xs">
                {futureTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskItem
                      task={task}
                      onToggle={onTaskToggle}
                      onSelect={onTaskSelect}
                      isSelected={selectedTask?.id === task.id}
                    />
                  </motion.div>
                ))}
              </Stack>
            </Collapse>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onSelect: (task: Task) => void;
  isSelected: boolean;
}

function TaskItem({ task, onToggle, onSelect, isSelected }: TaskItemProps) {
  return (
    <Card
      withBorder
      padding="sm"
      className={clsx(
        'w-full transition-all duration-200 hover:shadow-md',
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      )}
    >
      <UnstyledButton onClick={() => onSelect(task)} className="w-full">
        <Group>
          <ActionIcon
            component="div"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            variant="subtle"
            color={task.completed ? 'green' : 'gray'}
            className="transition-transform hover:scale-110"
          >
            {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </ActionIcon>
          
          <div style={{ flex: 1 }}>
            <Text
              style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'var(--mantine-color-gray-6)' : 'inherit'
              }}
            >
              {task.title}
            </Text>
            {task.locationName && (
              <Group gap="xs" mt={4}>
                <MapPin size={14} style={{ color: task.markerColor }} />
                <Text size="sm" c="dimmed">{task.locationName}</Text>
              </Group>
            )}
          </div>
          
          <Text size="sm" c="dimmed">
            {format(new Date(task.dueDate), 'HH:mm')}
          </Text>
        </Group>
      </UnstyledButton>
    </Card>
  );
}