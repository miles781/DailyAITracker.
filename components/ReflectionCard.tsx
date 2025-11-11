'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appState';
import { Reflection } from '../lib/db';
import { Edit2, Send, X } from 'lucide-react';

interface ReflectionCardProps {
  reflection?: Reflection | null;
  // onSave may be async (persists to the store/db)
  onSave: (reflection: Omit<Reflection, 'id' | 'userId' | 'encryptedData'>) => Promise<void> | void;
}

export default function ReflectionCard({ reflection, onSave }: ReflectionCardProps) {
  const [mood, setMood] = useState<Reflection['mood']>(reflection?.mood || 3);
  const [text, setText] = useState(reflection?.text || '');
  const [isEditing, setIsEditing] = useState(!reflection);

  const moodLabels = ['😔 Very Low', '😕 Low', '😐 Neutral', '🙂 Good', '😄 Excellent'];
  const moodEmojis = ['😔', '😕', '😐', '🙂', '😄'];

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        date: new Date().toISOString().split('T')[0],
        mood,
        text: text.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving reflection in component:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (!isEditing && reflection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            ✨ Today&apos;s Reflection
          </h3>
          <motion.button
            onClick={handleEdit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-primary"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Mood Display */}
        <div className="mb-6">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{moodEmojis[reflection.mood - 1]}</div>
              <div>
                <p className="text-xs text-foreground/60 uppercase font-semibold">Your Mood</p>
                <p className="text-lg font-bold text-foreground">{moodLabels[reflection.mood - 1]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reflection Text */}
        <div className="space-y-2">
          <p className="text-sm text-foreground/60 uppercase font-semibold">Thoughts</p>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{reflection.text}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <h3 className="text-lg font-bold text-foreground mb-6">✨ Daily Reflection</h3>

      <div className="space-y-6">
        {/* Mood Selector */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-4">
            How are you feeling today?
          </label>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map((value) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => setMood(value as Reflection['mood'])}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  mood === value
                    ? 'bg-gradient-ai text-white shadow-glow scale-110'
                    : 'bg-card border border-border text-foreground/60 hover:border-secondary'
                }`}
              >
                <span className="text-2xl">{moodEmojis[value - 1]}</span>
                <span className="text-xs font-semibold hidden sm:block">{moodLabels[value - 1].split(' ')[0]}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reflection Text Input */}
        <div>
          <label htmlFor="reflection-text" className="block text-sm font-semibold text-foreground mb-3">
            Your thoughts today
          </label>
          <textarea
            id="reflection-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="input-base resize-none"
            placeholder="What went well today? What could be better? Any insights or lessons learned?"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {reflection && (
            <motion.button
              type="button"
              onClick={() => setIsEditing(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all border-2 border-border text-foreground hover:bg-foreground/5 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </motion.button>
          )}
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save Reflection</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 