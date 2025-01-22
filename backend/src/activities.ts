import axios from 'axios';
import { Connection, WorkflowClient } from '@temporalio/client';
import { getTemporalClientOptions } from './utils';

export interface Question {
  id: number;
  hint: string;
  question: string;
  answer: string;
}

export const questions: Question[] = [
  {
    id: 1,
    hint: 'A fundamental building block in programming used to store data.',
    question: 'What is the term for a variable that holds data in programming?',
    answer: 'Variable',
  },
  {
    id: 2,
    hint: 'A control structure that allows for repeated execution of a block of code.',
    question: 'What is the name of the loop structure that continues to execute as long as a condition is true?',
    answer: 'While Loop',
  },
  {
    id: 3,
    hint: `A JavaScript runtime built on Chrome's V8 engine.`,
    question: 'What is the name of the runtime environment that allows JavaScript to be executed on the server-side?',
    answer: 'Node.js',
  },
  {
    id: 4,
    hint: 'The name of the project that Temporal was forked from.',
    question: 'What was the precursor to Temporal?',
    answer: 'Cadence',
  },
  {
    id: 5,
    hint: 'A Temporal-specific concept used to define workflows.',
    question: 'In Temporal, what is the term for a sequence of activities that define a business process?',
    answer: 'Workflow',
  },
  {
    id: 6,
    hint: 'A statically typed programming language developed by Microsoft.',
    question: 'What is the name of the language that is a superset of JavaScript and adds static typing?',
    answer: 'TypeScript',
  },
  {
    id: 7,
    hint: 'This was announced in Replay 2024.',
    question: 'What is the name of the Temporal concept that allows cross namespace communication?',
    answer: 'Temporal Nexus',
  },
  {
    id: 8,
    hint: 'A Temporal-specific feature that ensures activities are executed in a specific order.',
    question: 'In Temporal, what mechanism is used to enforce the order of activity execution within a workflow?',
    answer: 'Workflow Task',
  },
  {
    id: 9,
    hint: 'A Temporal concept that allows sync communication.',
    question: 'What feature of Temporal enables workflows to receive signals and return a response?',
    answer: 'Update',
  },
  {
    id: 10,
    hint: 'The default retry policy attempts.',
    question: 'What is the default behavior of Temporal when an activity fails?',
    answer: 'Retry',
  },
  {
    id: 11,
    hint: 'A Temporal feature allowing external systems to trigger workflow execution.',
    question: 'What is the mechanism in Temporal for sending external triggers to workflows?',
    answer: 'Signal',
  },
  {
    id: 12,
    hint: 'A design pattern used in Temporal to handle long-running activities.',
    question: 'What Temporal pattern is used to split long-running activities into smaller, manageable tasks?',
    answer: 'Activity Heartbeating',
  },
  {
    id: 13,
    hint: 'A Temporal activity timeout type.',
    question: 'What is the timeout type in Temporal that stops an activity if it takes too long to start?',
    answer: 'Schedule-To-Start Timeout',
  },
  {
    id: 14,
    hint: 'A Temporal concept for grouping related workflows and activities.',
    question: 'What is the term used in Temporal to define an isolated execution environment for workflows?',
    answer: 'Namespace',
  }
];

export async function getQuestion(
  answeredQuestions: number[]
): Promise<{ id: number; hint: string; question: string }> {
  // Get available questions (not yet answered)
  const availableQuestions = questions.filter(q => !answeredQuestions.includes(q.id));
  
  if (availableQuestions.length === 0) {
    throw new Error('No more available questions.');
  }

  // Get a random question from available ones
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selectedQuestion = availableQuestions[randomIndex];

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: selectedQuestion.id,
    hint: selectedQuestion.hint,
    question: selectedQuestion.question
  };
}

export async function validateAnswerAI(questionId: number, question: string, userAnswer: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not set.');
  }

  const questionObj = questions.find(q => q.id === questionId);
  if (!questionObj) {
    throw new Error('Invalid question ID.');
  }

  const answer = questionObj.answer;
  const prompt = `Question: ${question}\nAnswer: ${userAnswer}\nThis should be the correct answer: ${answer}\nIs the answer correct? Respond with "Yes" or "No" only.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3,
        temperature: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    
    const aiResponse = response.data.choices[0]?.message?.content?.toLowerCase();
    console.log(`response: ${JSON.stringify(aiResponse)}`);
    return aiResponse === 'yes';
  } catch (error) {
    console.error('Error validating answer with AI:', error);
    throw new Error('Failed to validate answer.');
  }
}

export async function updateLeaderboard(playerName: string, score: number): Promise<void> {
  const connection = await Connection.connect(getTemporalClientOptions());
  const client = new WorkflowClient({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE
  });

  await client.signalWithStart(
    'LeaderBoardWorkflow',
    {
      workflowId: 'leaderboard-workflow',
      taskQueue: 'question-time-queue',
      signal: 'updateLeaderboard',
      signalArgs: [{ player: playerName, score }]
    }
  );
}

export async function getLeaderboard(): Promise<{ player: string; score: number }[]> {
  const connection = await Connection.connect(getTemporalClientOptions());
  const client = new WorkflowClient({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE
  });

  const handle = await client.getHandle('leaderboard-workflow');
  const leaderboard = await handle.query('getLeaderboard');
  return leaderboard as { player: string; score: number }[];
}