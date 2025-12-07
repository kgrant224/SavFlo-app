import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { createChatCompletion } from '@/sdk/api-clients/OpenAIGPTChat';
import type { CreateChatCompletionResponses } from '@/sdk/api-clients/OpenAIGPTChat';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  merchant?: string;
}

export interface BudgetStatus {
  totalBudget: number;
  spent: number;
  remaining: number;
  categories: Array<{
    name: string;
    budget: number;
    spent: number;
  }>;
}

export interface SpendingPattern {
  averageDaily: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  trends: {
    weekOverWeek?: number;
    monthOverMonth?: number;
  };
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Hook 1: useGenerateDailyInsight
// ============================================================================

export interface GenerateDailyInsightInput {
  transactions: Transaction[];
  budgetStatus: BudgetStatus;
  spendingPatterns: SpendingPattern;
  userContext?: {
    name?: string;
    timezone?: string;
  };
}

export interface GenerateDailyInsightResponse {
  insight: string;
  suggestions: string[];
  sentiment: 'positive' | 'neutral' | 'warning';
  metadata?: {
    tokensUsed: number;
    modelUsed: string;
  };
}

/**
 * Generate personalized daily spending insights based on user transactions and budget status.
 *
 * @example
 * ```tsx
 * const dailyInsight = useGenerateDailyInsight();
 *
 * const handleGenerateInsight = () => {
 *   dailyInsight.mutate({
 *     transactions: yesterdayTransactions,
 *     budgetStatus: currentBudget,
 *     spendingPatterns: patterns
 *   });
 * };
 *
 * if (dailyInsight.data) {
 *   console.log(dailyInsight.data.insight);
 * }
 * ```
 */
export function useGenerateDailyInsight(): UseMutationResult<
  GenerateDailyInsightResponse,
  Error,
  GenerateDailyInsightInput
> {
  return useMutation({
    mutationFn: async (input: GenerateDailyInsightInput): Promise<GenerateDailyInsightResponse> => {
      // Validate input
      if (!input.transactions || input.transactions.length === 0) {
        throw new Error('At least one transaction is required to generate insights');
      }

      if (!input.budgetStatus) {
        throw new Error('Budget status is required to generate insights');
      }

      if (!input.spendingPatterns) {
        throw new Error('Spending patterns are required to generate insights');
      }

      // Calculate total spent from transactions
      const totalSpent = input.transactions.reduce((sum, t) => sum + t.amount, 0);
      const transactionCount = input.transactions.length;

      // Build context for the AI
      const systemPrompt = `You are a friendly and insightful personal finance advisor. Analyze the user's spending data and provide a concise, personalized daily insight in 2-3 sentences. Focus on actionable advice and encouraging tone. Be specific about amounts and categories.`;

      const userPrompt = `
Analyze my spending from yesterday:

Transactions (${transactionCount} total):
${input.transactions.slice(0, 10).map(t =>
  `- ${t.description || t.merchant || 'Purchase'}: $${t.amount.toFixed(2)} (${t.category})`
).join('\n')}
${transactionCount > 10 ? `... and ${transactionCount - 10} more transactions` : ''}

Total spent yesterday: $${totalSpent.toFixed(2)}

Budget Status:
- Total Budget: $${input.budgetStatus.totalBudget.toFixed(2)}
- Already Spent: $${input.budgetStatus.spent.toFixed(2)}
- Remaining: $${input.budgetStatus.remaining.toFixed(2)}

Top Spending Categories:
${input.spendingPatterns.topCategories.slice(0, 3).map(c =>
  `- ${c.category}: $${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}% of total)`
).join('\n')}

Provide a personalized insight and 2-3 actionable suggestions to improve my spending habits.`;

      // Call the API
      const response = await createChatCompletion({
        body: {
          model: 'MaaS_4.1',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        headers: {
          'X-CREAO-API-NAME': 'OpenAIGPTChat',
          'X-CREAO-API-PATH': '/v1/ai/zWwyutGgvEGWwzSa/chat/completions',
          'X-CREAO-API-ID': '688a0b64dc79a2533460892c',
        },
      });

      // Handle errors
      if (response.error) {
        const errorMessage = typeof response.error === 'object' && response.error !== null
          ? JSON.stringify(response.error)
          : 'Failed to generate daily insight';
        throw new Error(errorMessage);
      }

      if (!response.data) {
        throw new Error('No response data received from AI service');
      }

      // Extract the insight from the response
      const aiResponse = response.data as CreateChatCompletionResponses[200];

      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error('No completion choices returned from AI service');
      }

      const content = aiResponse.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty content returned from AI service');
      }

      // Parse the AI response to extract insight and suggestions
      const lines = content.split('\n').filter(line => line.trim());
      const insight = lines.slice(0, 2).join(' ');
      const suggestions = lines.slice(2).filter(line =>
        line.includes('-') || line.includes('•') || line.match(/^\d+\./)
      ).map(s => s.replace(/^[-•]\s*|\d+\.\s*/, '').trim());

      // Determine sentiment based on budget remaining
      let sentiment: 'positive' | 'neutral' | 'warning' = 'neutral';
      const budgetUtilization = input.budgetStatus.spent / input.budgetStatus.totalBudget;

      if (budgetUtilization < 0.7) {
        sentiment = 'positive';
      } else if (budgetUtilization > 0.9) {
        sentiment = 'warning';
      }

      return {
        insight: insight || content,
        suggestions: suggestions.length > 0 ? suggestions : [content],
        sentiment,
        metadata: {
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          modelUsed: aiResponse.model,
        },
      };
    },
  });
}

// ============================================================================
// Hook 2: useGenerateSavingsRecommendation
// ============================================================================

export interface GenerateSavingsRecommendationInput {
  savingsGoal: SavingsGoal;
  transactions: Transaction[];
  monthlyIncome: number;
  spendingPatterns: SpendingPattern;
  timeframeMonths?: number;
}

export interface GenerateSavingsRecommendationResponse {
  recommendations: string[];
  projectedSavingsIncrease: number;
  estimatedTimeToGoal: {
    months: number;
    description: string;
  };
  specificActions: Array<{
    action: string;
    potentialSavings: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  metadata?: {
    tokensUsed: number;
    modelUsed: string;
  };
}

/**
 * Get AI-powered recommendations for accelerating savings goals based on transaction history and spending patterns.
 *
 * @example
 * ```tsx
 * const savingsRecs = useGenerateSavingsRecommendation();
 *
 * const handleGetRecommendations = () => {
 *   savingsRecs.mutate({
 *     savingsGoal: { id: '1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 3000, deadline: '2025-12-31', priority: 'high' },
 *     transactions: recentTransactions,
 *     monthlyIncome: 5000,
 *     spendingPatterns: patterns
 *   });
 * };
 *
 * if (savingsRecs.data) {
 *   savingsRecs.data.specificActions.forEach(action => {
 *     console.log(`${action.action}: Save $${action.potentialSavings}`);
 *   });
 * }
 * ```
 */
export function useGenerateSavingsRecommendation(): UseMutationResult<
  GenerateSavingsRecommendationResponse,
  Error,
  GenerateSavingsRecommendationInput
> {
  return useMutation({
    mutationFn: async (input: GenerateSavingsRecommendationInput): Promise<GenerateSavingsRecommendationResponse> => {
      // Validate input
      if (!input.savingsGoal) {
        throw new Error('Savings goal is required');
      }

      if (!input.transactions || input.transactions.length === 0) {
        throw new Error('Transaction history is required to generate recommendations');
      }

      if (!input.monthlyIncome || input.monthlyIncome <= 0) {
        throw new Error('Valid monthly income is required');
      }

      if (!input.spendingPatterns) {
        throw new Error('Spending patterns are required');
      }

      // Calculate key metrics
      const remainingToGoal = input.savingsGoal.targetAmount - input.savingsGoal.currentAmount;
      const totalSpending = input.transactions.reduce((sum, t) => sum + t.amount, 0);
      const averageMonthlySpending = input.spendingPatterns.averageDaily * 30;
      const currentMonthlySavings = input.monthlyIncome - averageMonthlySpending;
      const timeframeMonths = input.timeframeMonths || 12;

      // Calculate time to goal at current rate
      const monthsToGoal = currentMonthlySavings > 0
        ? Math.ceil(remainingToGoal / currentMonthlySavings)
        : Infinity;

      // Build context for the AI
      const systemPrompt = `You are an expert financial advisor specializing in savings strategies. Analyze the user's financial data and provide specific, actionable recommendations to accelerate their savings goal. Focus on realistic suggestions based on their spending patterns. Format your response with clear action items and estimated savings amounts.`;

      const userPrompt = `
Help me reach my savings goal faster:

Savings Goal: ${input.savingsGoal.name}
- Target: $${input.savingsGoal.targetAmount.toFixed(2)}
- Current: $${input.savingsGoal.currentAmount.toFixed(2)}
- Remaining: $${remainingToGoal.toFixed(2)}
- Deadline: ${input.savingsGoal.deadline}
- Priority: ${input.savingsGoal.priority}

Financial Situation:
- Monthly Income: $${input.monthlyIncome.toFixed(2)}
- Average Monthly Spending: $${averageMonthlySpending.toFixed(2)}
- Current Monthly Savings: $${currentMonthlySavings.toFixed(2)}
- Estimated months to goal at current rate: ${monthsToGoal === Infinity ? 'Cannot reach goal (spending exceeds income)' : monthsToGoal}

Top Spending Categories (potential reduction areas):
${input.spendingPatterns.topCategories.map(c =>
  `- ${c.category}: $${c.amount.toFixed(2)}/month (${c.percentage.toFixed(1)}%)`
).join('\n')}

Recent Transactions (sample):
${input.transactions.slice(0, 5).map(t =>
  `- ${t.description || t.merchant || 'Purchase'}: $${t.amount.toFixed(2)} (${t.category})`
).join('\n')}

Provide:
1. 3-5 specific recommendations to increase my savings rate
2. For each recommendation, estimate the monthly savings amount
3. Rate each recommendation's difficulty (easy/medium/hard)
4. Calculate how much faster I could reach my goal

Format as:
RECOMMENDATION: [action]
SAVINGS: $[amount]/month
DIFFICULTY: [easy/medium/hard]`;

      // Call the API
      const response = await createChatCompletion({
        body: {
          model: 'MaaS_4.1',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        headers: {
          'X-CREAO-API-NAME': 'OpenAIGPTChat',
          'X-CREAO-API-PATH': '/v1/ai/zWwyutGgvEGWwzSa/chat/completions',
          'X-CREAO-API-ID': '688a0b64dc79a2533460892c',
        },
      });

      // Handle errors
      if (response.error) {
        const errorMessage = typeof response.error === 'object' && response.error !== null
          ? JSON.stringify(response.error)
          : 'Failed to generate savings recommendations';
        throw new Error(errorMessage);
      }

      if (!response.data) {
        throw new Error('No response data received from AI service');
      }

      // Extract the recommendations from the response
      const aiResponse = response.data as CreateChatCompletionResponses[200];

      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error('No completion choices returned from AI service');
      }

      const content = aiResponse.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty content returned from AI service');
      }

      // Parse the AI response to extract structured recommendations
      const lines = content.split('\n').filter(line => line.trim());
      const specificActions: Array<{
        action: string;
        potentialSavings: number;
        difficulty: 'easy' | 'medium' | 'hard';
      }> = [];

      let currentAction: { action?: string; savings?: number; difficulty?: 'easy' | 'medium' | 'hard' } = {};

      lines.forEach(line => {
        const recommendationMatch = line.match(/RECOMMENDATION:\s*(.+)/i);
        const savingsMatch = line.match(/SAVINGS:\s*\$?(\d+(?:\.\d{2})?)/i);
        const difficultyMatch = line.match(/DIFFICULTY:\s*(easy|medium|hard)/i);

        if (recommendationMatch) {
          if (currentAction.action && currentAction.savings !== undefined && currentAction.difficulty) {
            specificActions.push({
              action: currentAction.action,
              potentialSavings: currentAction.savings,
              difficulty: currentAction.difficulty,
            });
          }
          currentAction = { action: recommendationMatch[1].trim() };
        } else if (savingsMatch) {
          currentAction.savings = parseFloat(savingsMatch[1]);
        } else if (difficultyMatch) {
          currentAction.difficulty = difficultyMatch[1].toLowerCase() as 'easy' | 'medium' | 'hard';
        }
      });

      // Add the last action if complete
      if (currentAction.action && currentAction.savings !== undefined && currentAction.difficulty) {
        specificActions.push({
          action: currentAction.action,
          potentialSavings: currentAction.savings,
          difficulty: currentAction.difficulty,
        });
      }

      // Calculate projected savings increase
      const totalPotentialSavings = specificActions.reduce((sum, a) => sum + a.potentialSavings, 0);
      const newMonthlySavings = currentMonthlySavings + totalPotentialSavings;
      const newMonthsToGoal = newMonthlySavings > 0
        ? Math.ceil(remainingToGoal / newMonthlySavings)
        : Infinity;

      // Extract general recommendations
      const recommendations = specificActions.length > 0
        ? specificActions.map(a => a.action)
        : lines.filter(l =>
            (l.includes('-') || l.includes('•') || l.match(/^\d+\./)) &&
            !l.match(/RECOMMENDATION:|SAVINGS:|DIFFICULTY:/i)
          ).map(s => s.replace(/^[-•]\s*|\d+\.\s*/, '').trim());

      // Generate time to goal description
      let timeDescription = '';
      if (newMonthsToGoal === Infinity) {
        timeDescription = 'Additional income needed to reach goal';
      } else {
        const monthsSaved = monthsToGoal - newMonthsToGoal;
        timeDescription = monthsSaved > 0
          ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} faster than current pace`
          : `${newMonthsToGoal} month${newMonthsToGoal !== 1 ? 's' : ''} to reach goal`;
      }

      return {
        recommendations: recommendations.length > 0 ? recommendations : [content],
        projectedSavingsIncrease: totalPotentialSavings,
        estimatedTimeToGoal: {
          months: newMonthsToGoal === Infinity ? -1 : newMonthsToGoal,
          description: timeDescription,
        },
        specificActions: specificActions.length > 0
          ? specificActions
          : [{
              action: 'Review and optimize spending across all categories',
              potentialSavings: Math.min(averageMonthlySpending * 0.1, 200),
              difficulty: 'medium' as const,
            }],
        metadata: {
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          modelUsed: aiResponse.model,
        },
      };
    },
  });
}
