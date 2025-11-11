import { db, type Task, type Behavior, type Reflection } from './db';
import { encryptionService } from './encrypt';

export interface BehaviorSummary {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  frequentCategories: string[];
  reflectionConsistency: number;
  averageMood: number;
  productiveHours: string[];
  commonBehaviors: string[];
}

export interface AnonymizedData {
  summary: BehaviorSummary;
  patterns: {
    bestPerformingCategory: string;
    worstPerformingCategory: string;
    moodCorrelation: number;
    peakProductivity: string;
  };
  sentiment?: number; // -1 (negative) .. 1 (positive)
}

export class AISummarizer {
  private async decryptAndAggregate<T>(items: any[]): Promise<T[]> {
    const decryptedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const parsed = await encryptionService.decryptUserData(item.encryptedData);
          // Normalize createdAt if it's a string so downstream logic can use Date methods
          if (parsed && (parsed as any).createdAt && typeof (parsed as any).createdAt === 'string') {
            try {
              (parsed as any).createdAt = new Date((parsed as any).createdAt);
            } catch (e) {
              // leave as-is if conversion fails
            }
          }

          return parsed;
        } catch (error) {
          console.error('Decryption error:', error);
          return null;
        }
      })
    );
    return decryptedItems.filter(Boolean) as T[];
  }

  async generateSummary(userId: string, days: number = 7): Promise<AnonymizedData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Fetch recent data
      const [tasks, behaviors, reflections] = await Promise.all([
        db.tasks
          .where('userId')
          .equals(userId)
          .filter((task: Task) => task.createdAt >= startDate)
          .toArray(),
        db.behaviors
          .where('userId')
          .equals(userId)
          .filter((behavior: Behavior) => behavior.timestamp >= startDate)
          .toArray(),
        db.reflections
          .where('userId')
          .equals(userId)
          .filter((reflection: Reflection) => reflection.date >= startDate.toISOString().split('T')[0])
          .toArray(),
      ]);

      // Decrypt data
      const decryptedTasks = await this.decryptAndAggregate<{ title: string; category: string; completed: boolean }>(tasks);
      const decryptedReflections = await this.decryptAndAggregate<{ mood: number; text: string }>(reflections);

      // Calculate summary
      const totalTasks = decryptedTasks.length;
      const completedTasks = decryptedTasks.filter(task => task.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Category analysis
      const categoryCount = decryptedTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const frequentCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Mood analysis
      const averageMood = decryptedReflections.length > 0 
        ? decryptedReflections.reduce((sum, ref) => sum + ref.mood, 0) / decryptedReflections.length
        : 0;

      // Reflection consistency (days with reflections)
  const uniqueReflectionDays = new Set(reflections.map((r: Reflection) => r.date)).size;
      const reflectionConsistency = (uniqueReflectionDays / days) * 100;

      // Behavior patterns
      const behaviorTypes = behaviors.reduce((acc: Record<string, number>, behavior: Behavior) => {
        acc[behavior.type] = (acc[behavior.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonBehaviors = (Object.entries(behaviorTypes) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([behavior]) => behavior);

      const summary: BehaviorSummary = {
        totalTasks,
        completedTasks,
        completionRate,
        frequentCategories,
        reflectionConsistency,
        averageMood,
        productiveHours: this.calculateProductiveHours(behaviors),
        commonBehaviors,
      };

      // Pattern analysis
      const patterns = {
        bestPerformingCategory: this.findBestPerformingCategory(decryptedTasks),
        worstPerformingCategory: this.findWorstPerformingCategory(decryptedTasks),
        moodCorrelation: this.calculateMoodCorrelation(decryptedTasks, decryptedReflections),
        peakProductivity: this.findPeakProductivity(behaviors),
      };

      // Sentiment analysis across decrypted reflections
      const sentiment = this.analyzeSentiment(decryptedReflections);

      return {
        summary,
        patterns,
        sentiment,
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      // Return default data on error
      return this.getDefaultSummary();
    }
  }

  // Public sentiment analyzer: returns -1 (negative) .. 1 (positive)
  analyzeSentiment(reflections: Array<{ mood?: number; text?: string }>): number {
    if (!reflections || reflections.length === 0) return 0;

    const positiveWords = ['good', 'great', 'focused', 'productive', 'completed', 'success', 'happy', 'energized', 'better', 'improved'];
    const negativeWords = ['tired', 'missed', 'failed', 'struggle', 'worse', 'sad', 'angry', 'frustrat', 'anxious', 'overwhelmed'];

    let score = 0;
    reflections.forEach((r) => {
      const text = (r.text || '').toLowerCase();
      let local = 0;
      positiveWords.forEach(w => { if (text.includes(w)) local += 1; });
      negativeWords.forEach(w => { if (text.includes(w)) local -= 1; });
      // incorporate mood if present (scale 1-5 -> -1..1)
      if (typeof r.mood === 'number') {
        local += (r.mood - 3) / 2; // mood 3 -> 0, 5 -> +1, 1 -> -1
      }
      score += Math.max(-3, Math.min(3, local));
    });

    const normalized = score / (reflections.length * 3);
    // clamp to -1..1
    return Math.max(-1, Math.min(1, normalized));
  }

  private calculateProductiveHours(behaviors: any[]): string[] {
    // Simple implementation - return default hours
    return ['09:00', '14:00', '16:00'];
  }

  private findBestPerformingCategory(tasks: any[]): string {
    if (tasks.length === 0) return 'general';

    const categoryCompletion = tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { total: 0, completed: 0 };
      }
      acc[task.category].total++;
      if (task.completed) acc[task.category].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const bestCategory = (Object.entries(categoryCompletion) as [string, { total: number; completed: number }][])
      .filter(([, stats]) => stats.total >= 1) // Minimum tasks for meaningful data
      .map(([category, stats]) => ({
        category,
        rate: stats.completed / stats.total,
      }))
      .sort((a, b) => b.rate - a.rate)[0];

    return bestCategory?.category || 'general';
  }

  private findWorstPerformingCategory(tasks: any[]): string {
    if (tasks.length === 0) return 'general';

    const categoryCompletion = tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { total: 0, completed: 0 };
      }
      acc[task.category].total++;
      if (task.completed) acc[task.category].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const worstCategory = (Object.entries(categoryCompletion) as [string, { total: number; completed: number }][])
      .filter(([, stats]) => stats.total >= 1)
      .map(([category, stats]) => ({
        category,
        rate: stats.completed / stats.total,
      }))
      .sort((a, b) => a.rate - b.rate)[0];

    return worstCategory?.category || 'general';
  }

  private calculateMoodCorrelation(tasks: any[], reflections: any[]): number {
    if (tasks.length === 0 || reflections.length === 0) return 0.5;
    
    // Simplified correlation calculation
    const completedTasksByDay = tasks.reduce((acc, task) => {
      // Support both Date objects and ISO date strings
      let createdAtIso: string;
      try {
        if (task.createdAt instanceof Date) {
          createdAtIso = task.createdAt.toISOString();
        } else {
          createdAtIso = new Date(task.createdAt).toISOString();
        }
      } catch (e) {
        createdAtIso = new Date().toISOString();
      }
      const date = createdAtIso.split('T')[0];
      if (!acc[date]) acc[date] = { completed: 0, total: 0 };
      if (task.completed) acc[date].completed++;
      acc[date].total++;
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    let correlationSum = 0;
    let count = 0;

    reflections.forEach(reflection => {
      const dayData = completedTasksByDay[reflection.date];
      if (dayData && dayData.total > 0) {
        const completionRate = dayData.completed / dayData.total;
        // Simple positive correlation assumption
        correlationSum += completionRate * (reflection.mood / 5);
        count++;
      }
    });

    return count > 0 ? correlationSum / count : 0.7;
  }

  private findPeakProductivity(behaviors: any[]): string {
    if (behaviors.length === 0) return '14:00';

    const hourCounts = behaviors.reduce((acc, behavior) => {
      const hour = new Date(behavior.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = (Object.entries(hourCounts) as [string, number][])
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return peakHour ? `${peakHour.toString().padStart(2, '0')}:00` : '14:00';
  }

  private getDefaultSummary(): AnonymizedData {
    return {
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        frequentCategories: [],
        reflectionConsistency: 0,
        averageMood: 3,
        productiveHours: ['09:00', '14:00', '16:00'],
        commonBehaviors: [],
      },
      patterns: {
        bestPerformingCategory: 'general',
        worstPerformingCategory: 'general',
        moodCorrelation: 0.5,
        peakProductivity: '14:00',
      },
    };
  }

  async prepareAIRequestData(userId: string): Promise<string> {
    try {
      const anonymizedData = await this.generateSummary(userId);
      
      // Remove any potentially identifiable information
      const successProbability = this.forecastGoalCompletion(anonymizedData.summary.completionRate, anonymizedData.summary.reflectionConsistency);

      const safeData = {
        productivity: {
          taskCompletion: Math.round(anonymizedData.summary.completionRate),
          consistentCategories: anonymizedData.summary.frequentCategories,
          totalTasksCompleted: anonymizedData.summary.completedTasks,
        },
        wellbeing: {
          moodTrend: Math.round(anonymizedData.summary.averageMood * 10) / 10,
          reflectionHabit: Math.round(anonymizedData.summary.reflectionConsistency),
        },
        patterns: anonymizedData.patterns,
        productiveHours: anonymizedData.summary.productiveHours,
        forecasting: {
          goalSuccessProbability: Math.round(successProbability * 100) / 100
        },
      };

      return JSON.stringify(safeData, null, 2);
    } catch (error) {
      console.error('Error preparing AI request data:', error);
      return JSON.stringify(this.getDefaultSummary(), null, 2);
    }
  }

  // Simple goal forecasting: returns probability (0..1) of hitting next-day goals
  forecastGoalCompletion(completionRate: number, reflectionConsistency: number): number {
    // completionRate is 0..100, reflectionConsistency is 0..100
    const completionFactor = Math.max(0, Math.min(1, completionRate / 100));
    const consistencyFactor = Math.max(0, Math.min(1, reflectionConsistency / 100));

    // Weighted combination: completion is more important (70%), consistency less (30%)
    const probability = 0.7 * completionFactor + 0.3 * consistencyFactor;
    return Math.max(0, Math.min(1, probability));
  }
}

export const aiSummarizer = new AISummarizer(); 