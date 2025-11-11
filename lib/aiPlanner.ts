import { aiSummarizer, type AnonymizedData } from './aiSummarizer';
import { db, type AISummary } from './db';
import { encryptionService } from './encrypt';

export interface AITaskSuggestion {
  title: string;
  category: 'work' | 'personal' | 'health' | 'learning' | 'other';
  reason: string;
  estimatedTime?: string;
}

export interface AIPlan {
  tasks: AITaskSuggestion[];
  motivationalQuote: string;
  insights: string[];
  focusArea: string;
}

export class AIPlanner {
  private async callAIAPI(prompt: string): Promise<string> {
    // Check if we're online and have API key
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey || !navigator.onLine) {
      return this.generateOfflinePlan();
    }

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a thoughtful, empathetic productivity coach. Create personalized daily plans based on user behavior patterns. Focus on realistic, achievable tasks that align with the user's goals and patterns. Always include a motivational quote and practical insights.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI API call failed:', error);
      return this.generateOfflinePlan();
    }
  }

  private generateOfflinePlan(): string {
    const offlineTemplates = [
      {
        tasks: [
          {
            title: "Review your goals for the week",
            category: "personal",
            reason: "Regular goal review helps maintain focus and direction",
            estimatedTime: "15 minutes"
          },
          {
            title: "Take a mindful break outdoors",
            category: "health",
            reason: "Fresh air and movement boost creativity and wellbeing",
            estimatedTime: "20 minutes"
          },
          {
            title: "Learn something new related to your interests",
            category: "learning",
            reason: "Continuous learning keeps the mind engaged and growing"
          }
        ],
        motivationalQuote: "The secret of getting ahead is getting started. - Mark Twain",
        insights: [
          "Small consistent actions lead to big results over time",
          "Balance is key - remember to include rest and reflection"
        ],
        focusArea: "Consistent Progress"
      },
      {
        tasks: [
          {
            title: "Tackle your most important task first",
            category: "work",
            reason: "Starting with priority tasks builds momentum for the day"
          },
          {
            title: "Connect with someone important to you",
            category: "personal",
            reason: "Strong relationships contribute to overall happiness"
          },
          {
            title: "Practice gratitude reflection",
            category: "personal",
            reason: "Acknowledging positives improves mindset and resilience"
          }
        ],
        motivationalQuote: "Quality is not an act, it is a habit. - Aristotle",
        insights: [
          "Your environment shapes your habits - optimize your space for success",
          "Progress over perfection - every step forward counts"
        ],
        focusArea: "Meaningful Connections"
      }
    ];

    const randomTemplate = offlineTemplates[Math.floor(Math.random() * offlineTemplates.length)];
    return JSON.stringify(randomTemplate, null, 2);
  }

  async generateDailyPlan(userId: string): Promise<AIPlan> {
    try {
      // Get anonymized user data
      const userData = await aiSummarizer.prepareAIRequestData(userId);
      
      const prompt = `
        User Behavior Summary (Last 7 Days):
        ${userData}

        Please generate a personalized daily plan with:
        1. 3-5 specific, achievable tasks across different categories (work, personal, health, learning, other)
        2. A motivational quote relevant to their patterns
        3. 2-3 insights about their productivity patterns
        4. One focus area for the day

        Respond with a JSON object exactly in this format:
        {
          "tasks": [
            {
              "title": "specific task description",
              "category": "work|personal|health|learning|other",
              "reason": "why this task suits their patterns",
              "estimatedTime": "optional time suggestion"
            }
          ],
          "motivationalQuote": "relevant quote with author",
          "insights": ["insight 1", "insight 2"],
          "focusArea": "single focus area"
        }
      `;

      const aiResponse = await this.callAIAPI(prompt);
      
      // Parse AI response
      let plan: AIPlan;
      try {
        plan = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        plan = JSON.parse(this.generateOfflinePlan());
      }

      // Validate and ensure we have the required structure
      if (!plan.tasks || !Array.isArray(plan.tasks)) {
        plan.tasks = JSON.parse(this.generateOfflinePlan()).tasks;
      }

      // Limit to 5 tasks max
      plan.tasks = plan.tasks.slice(0, 5);

      // Save the plan
      await this.savePlan(userId, plan);

      return plan;
    } catch (error) {
      console.error('Error generating daily plan:', error);
      return JSON.parse(this.generateOfflinePlan());
    }
  }

  private async savePlan(userId: string, plan: AIPlan): Promise<void> {
    const encryptedData = await encryptionService.encryptUserData(plan);
    
    const aiSummary = {
      id: crypto.randomUUID(),
      userId,
      date: new Date().toISOString().split('T')[0],
      summaryJSON: JSON.stringify(plan),
      encryptedData,
      createdAt: new Date(),
    };

    await db.aiSummaries.add(aiSummary);
  }

  async getTodayPlan(userId: string): Promise<AIPlan | null> {
    const today = new Date().toISOString().split('T')[0];
    const summary = await db.aiSummaries
      .where('userId')
      .equals(userId)
      .and((s: AISummary) => s.date === today)
      .first();

    if (!summary) return null;

    try {
      return await encryptionService.decryptUserData(summary.encryptedData);
    } catch (error) {
      console.error('Error decrypting AI plan:', error);
      return null;
    }
  }
}

export const aiPlanner = new AIPlanner(); 