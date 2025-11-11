'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appState';
import { Task } from '../lib/db';
import { X, Sparkles } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

export default function AddTaskModal({ isOpen, onClose, editTask }: AddTaskModalProps) {
  const { addTask, updateTask } = useAppStore();
  const [formData, setFormData] = useState({
    title: editTask?.title || '',
    category: editTask?.category || 'personal' as Task['category'],
    scheduledTime: editTask?.scheduledTime || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { value: Task['category']; label: string; icon: string; color: string }[] = [
    { value: 'work', label: 'Work', icon: '💼', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'personal', label: 'Personal', icon: '🎯', color: 'text-emerald-600 dark:text-emerald-400' },
    { value: 'health', label: 'Health', icon: '💪', color: 'text-red-600 dark:text-red-400' },
    { value: 'learning', label: 'Learning', icon: '📚', color: 'text-purple-600 dark:text-purple-400' },
    { value: 'other', label: 'Other', icon: '📌', color: 'text-slate-600 dark:text-slate-400' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, formData);
      } else {
        await addTask({
          ...formData,
          completed: false,
        });
      }
      onClose();
      setFormData({ title: '', category: 'personal', scheduledTime: '' });
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
          >
            <div className="card max-w-md w-full p-6 pointer-events-auto shadow-depth">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-ai text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editTask ? 'Edit Task' : 'New Task'}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition-colors"
                >
                  <X className="w-5 h-5 text-foreground/60" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title Input */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-base"
                    placeholder="What do you want to accomplish?"
                    required
                    autoFocus
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <motion.button
                        key={category.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: category.value })}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl text-sm font-semibold transition-all border-2 flex flex-col items-center gap-1 ${
                          formData.category === category.value
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-card border-border hover:border-primary/30 text-foreground/70 hover:text-foreground'
                        }`}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-xs">{category.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Input */}
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-semibold text-foreground mb-2">
                    Schedule (Optional)
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="input-base"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all border-2 border-border text-foreground hover:bg-foreground/5"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : editTask ? (
                      'Update Task'
                    ) : (
                      'Add Task'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}