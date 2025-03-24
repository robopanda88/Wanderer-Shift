import React, { useState } from 'react';
import { format, isToday } from 'date-fns';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Task } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="neomorphic p-6 rounded-xl">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Today's Tasks</h2>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
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
          </div>

          {futureTasks.length > 0 && (
            <div className="mt-6 space-y-3">
              <Button
                variant="ghost"
                onClick={() => setShowFutureTasks(!showFutureTasks)}
                className="w-full justify-between"
              >
                <span>Upcoming Tasks</span>
                <motion.div
                  animate={{ rotate: showFutureTasks ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>

              {showFutureTasks && (
                <div className="space-y-3 mt-3">
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
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
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
    <div
      className={cn(
        "glass-card p-4 transition-all duration-200 cursor-pointer",
        isSelected ? "bg-primary/20 border-primary/30" : "hover:bg-secondary/20"
      )}
      onClick={() => onSelect(task)}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
        >
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
        
        <div className="flex-1">
          <p className={cn(
            "text-sm",
            task.completed ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {task.title}
          </p>
          {task.locationName && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" style={{ color: task.markerColor || '#00D4FF' }} />
              <span className="text-xs text-muted-foreground">{task.locationName}</span>
            </div>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground">
          {format(new Date(task.dueDate), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}