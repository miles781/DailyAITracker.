'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '../store/appState';
import { Flame, Leaf } from 'lucide-react';

interface RewardTreeProps {
  streak: number;
  completedTasks: number;
}

export default function RewardTree({ streak, completedTasks }: RewardTreeProps) {
  const getTreeStage = () => {
    if (streak < 7) return 'seedling';
    if (streak < 30) return 'growing';
    return 'blooming';
  };

  const getLeaves = () => {
    const baseLeaves = Math.min(completedTasks, 10);
    const bonusLeaves = Math.floor(streak / 7) * 5;
    return baseLeaves + bonusLeaves;
  };

  const treeStage = getTreeStage();
  const leaves = getLeaves();

  const treeVariants = {
    seedling: { scale: 0.8 },
    growing: { scale: 1 },
    blooming: { scale: 1.2 },
  };

  const leafVariants = {
    hidden: { scale: 0, opacity: 0, rotate: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      rotate: i * 30,
      transition: {
        delay: i * 0.08,
        duration: 0.5,
        type: 'spring',
      },
    }),
  };

  const stageEmoji = {
    seedling: '🌱',
    growing: '🌿',
    blooming: '🌳',
  };

  const stageLabel = {
    seedling: 'Seedling Stage',
    growing: 'Growing Strong',
    blooming: 'Fully Bloomed',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 glass"
    >
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        {stageEmoji[treeStage]} Your Growth Tree
      </h3>

      {/* Tree Visualization */}
      <div className="flex flex-col items-center justify-center my-8 min-h-40">
        <motion.div
          variants={treeVariants}
          animate={treeStage}
          className="relative w-32 h-32"
        >
          {/* Tree Crown */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-ai opacity-20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Leaves */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: Math.min(leaves, 20) }, (_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={leafVariants}
                initial="hidden"
                animate="visible"
                className="absolute text-lg"
                style={{
                  left: `${50 + 40 * Math.cos((i / leaves) * Math.PI * 2)}%`,
                  top: `${50 + 40 * Math.sin((i / leaves) * Math.PI * 2)}%`,
                }}
              >
                🍃
              </motion.div>
            ))}
            <Leaf className="w-12 h-12 text-emerald-500" />
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        {/* Stage Badge */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="badge-secondary mx-auto inline-block"
          >
            {stageLabel[treeStage]}
          </motion.div>
        </div>

        {/* Streak & Completion */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="text-sm text-foreground/60 mb-1 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Streak</span>
            </div>
            <div className="text-2xl font-bold text-primary">{streak}</div>
            <div className="text-xs text-foreground/50">days</div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/10 text-center">
            <div className="text-sm text-foreground/60 mb-1">Tasks</div>
            <div className="text-2xl font-bold text-secondary">{completedTasks}</div>
            <div className="text-xs text-foreground/50">completed</div>
          </div>
        </div>

        {/* Leaves Count */}
        <div className="text-center p-3 rounded-lg bg-emerald-500/10">
          <p className="text-xs text-foreground/60 mb-1">Growth Progress</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            🍃 {leaves} leaves
          </p>
        </div>

        {/* Milestones */}
        {streak >= 7 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-center p-3 rounded-lg bg-amber-500/10 border-2 border-amber-500/30"
          >
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              ⭐ Weekly Milestone Unlocked!
            </p>
          </motion.div>
        )}

        {streak >= 30 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-3 rounded-lg bg-purple-500/10 border-2 border-purple-500/30"
          >
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              👑 Monthly Champion!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 