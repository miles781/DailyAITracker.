'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appState';
import { Flame, TrendingUp, Zap } from 'lucide-react';

export default function StreakCard() {
  const { tasks } = useAppStore();
  
  const completedToday = tasks.filter(task => 
    task.completed && 
    task.completedAt && 
    new Date(task.completedAt).toDateString() === new Date().toDateString()
  ).length;

  const totalToday = tasks.filter(task => 
    new Date(task.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  // Mock streak data - in real app, this would come from the store
  const currentStreak = 5;
  const longestStreak = 12;

  const motivationalQuotes = [
    "Consistency is the key to mastery. Keep going!",
    "Small daily improvements lead to stunning results.",
    "Your future self will thank you for today&apos;s effort.",
    "Progress, not perfection. Every step counts.",
    "You&apos;re building habits that will last a lifetime."
  ];
  // Deterministic selection based on date to avoid impure calls during render
  const today = new Date();
  const quoteIndex = today.getDate() % motivationalQuotes.length;
  const randomQuote = motivationalQuotes[quoteIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card p-6"
    >
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        Streak Insights
      </h3>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-xl bg-gradient-ai text-white text-center"
        >
          <div className="text-xs text-white/80 mb-1">Current Streak</div>
          <div className="text-3xl font-bold">{currentStreak}</div>
          <div className="text-xs text-white/70 mt-1">🔥 Days</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-center"
        >
          <div className="text-xs text-foreground/60 mb-1">Personal Best</div>
          <div className="text-3xl font-bold text-secondary">{longestStreak}</div>
          <div className="text-xs text-foreground/50 mt-1">🏆 Days</div>
        </motion.div>
      </div>

      {/* Today's Progress */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground flex items-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
              Today&apos;s Progress
          </span>
          <span className="text-sm font-bold text-primary">{Math.round(completionRate)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-card border border-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="h-full bg-gradient-ai rounded-full"
          />
        </div>

        <p className="text-xs text-foreground/50 text-center">
          {completedToday} of {totalToday} tasks completed
        </p>
      </div>

      {/* Motivational Quote */}
      <div className="mb-6 p-4 glass rounded-xl">
        <p className="text-sm text-foreground leading-relaxed italic">
          &ldquo;{randomQuote}&rdquo;
        </p>
      </div>

      {/* Weekly Activity */}
      <div>
        <div className="text-xs font-semibold text-foreground/60 uppercase tracking-widest mb-3">
          This Week
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            const isToday = date.toDateString() === new Date().toDateString();
            // Deterministic mock activity based on date to avoid Math.random in render
            const hasActivity = ((date.getDate() + i) % 4) !== 0;
            
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.1 }}
                className="group flex flex-col items-center flex-1"
                title={dayName}
              >
                <div
                  className={`flex-1 w-full rounded-lg transition-all cursor-pointer ${
                    hasActivity 
                      ? 'bg-gradient-ai hover:shadow-glow' 
                      : 'bg-card border border-border hover:border-foreground/20'
                  } ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                />
                <span className="text-xs text-foreground/50 mt-1 font-medium">
                  {dayName}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
} 