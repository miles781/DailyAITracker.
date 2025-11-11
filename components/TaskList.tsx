'use client';

import { Task } from '../lib/db';
import { motion } from 'framer-motion';
import { CheckCircle2, Edit2, Trash2, Clock } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

type TaskCategory = Task['category'];

interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

interface CategoryColors {
  work: CategoryConfig;
  personal: CategoryConfig;
  health: CategoryConfig;
  learning: CategoryConfig;
  other: CategoryConfig;
}

export default function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps): JSX.Element {
  const getCategoryConfig = (category: TaskCategory): CategoryConfig => {
    const colors: CategoryColors = {
      work: { label: 'Work', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', icon: '💼' },
      personal: { label: 'Personal', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', icon: '🎯' },
      health: { label: 'Health', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10', icon: '💪' },
      learning: { label: 'Learning', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10', icon: '📚' },
      other: { label: 'Other', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/10', icon: '📌' },
    };
    return colors[category];
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/50" role="status" aria-live="polite">
        <div className="text-4xl mb-3">✨</div>
        <p className="text-sm">All caught up! Create a new task to get started.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Task list">
      {tasks.map((task: Task, index: number) => {
        const categoryConfig = getCategoryConfig(task.category);
        return (
          <li key={task.id}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className={`card group p-4 border-l-4 transition-all ${
                task.completed
                  ? 'border-l-emerald-500 opacity-60 dark:opacity-50'
                  : 'border-l-secondary hover:shadow-glow'
              }`}
            >
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <motion.button
                  onClick={() => onToggleComplete(task.id)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-border hover:border-secondary bg-card hover:bg-secondary/10'
                  }`}
                  aria-label={task.completed ? `Mark task "${task.title}" as incomplete` : `Mark task "${task.title}" as complete`}
                >
                  {task.completed && (
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  </span>
                </motion.button>
                
                <div className="flex-1 min-w-0">
                  <h3 
                    className={`font-semibold break-words sm:truncate transition-colors ${
                      task.completed 
                        ? 'line-through text-foreground/50' 
                        : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.scheduledTime && (
                    <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {task.scheduledTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                  <span
                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-lg ${categoryConfig.color} ${categoryConfig.bgColor} transition-colors flex-shrink-0`}
                  >
                    <span aria-hidden="true" className="hidden sm:inline">{categoryConfig.icon}</span>
                    <span className="sr-only">Category: {categoryConfig.label}</span>
                    <span className="hidden sm:inline ml-1">{categoryConfig.label}</span>
                  </span>
                  
                  {task.planForNextDay && (
                    <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0">
                      📅 Next Day
                    </span>
                  )}
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <motion.button
                    onClick={() => onEdit(task)}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    aria-label={`Edit task "${task.title}"`}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">Edit task</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => onDelete(task.id)}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    aria-label={`Delete task "${task.title}"`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">Delete task</span>
                  </motion.button>
                </div>
              </div>
            </div>
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
} 