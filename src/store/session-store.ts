import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SessionAnalysis {
  overallScore: number;
  technicalDepthScore: number;
  clarityScore: number;
  architectureScore: number;
  executiveSummary: string;
  strengths: string[];
  improvements: string[];
  actionPlan: string[];
}

export interface InterviewSession {
  id: string;
  createdAt: string;
  jobRole: string;
  jobDescription?: string;
  interviewerVoice: string;
  durationSeconds: number;
  questionCount: number;
  messages: { role: string; text: string }[];
  analysis: SessionAnalysis;
}

interface SessionState {
  sessions: InterviewSession[];
  activeSessionId: string | null;
  addSession: (session: InterviewSession) => void;
  deleteSession: (id: string) => void;
  clearSessions: () => void;
  setActiveSessionId: (id: string | null) => void;
  getLatestSession: () => InterviewSession | null;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [
        {
          id: 'session_demo_initial',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          jobRole: 'Senior Full Stack Developer',
          interviewerVoice: 'Emma - British Technical Lead',
          durationSeconds: 480,
          questionCount: 4,
          messages: [
            { role: 'assistant', text: 'Hello! Welcome to your interview today. Could you briefly introduce yourself and highlight a recent challenging technical project you led?' },
            { role: 'user', text: 'I built a distributed job queue in Node.js and Redis handling 50k events per second with automatic retries and dead-letter queues.' },
            { role: 'assistant', text: 'Impressive throughput. How did you handle backpressure and guarantee idempotency when retrying failed jobs?' },
            { role: 'user', text: 'We used Redis Lua scripts with idempotency keys in MongoDB, combined with exponential backoff and circuit breakers.' }
          ],
          analysis: {
            overallScore: 88,
            technicalDepthScore: 90,
            clarityScore: 86,
            architectureScore: 89,
            executiveSummary: 'Strong technical delivery demonstrating hands-on distributed systems expertise. Clear articulation of idempotency keys, Lua scripting, and queue backpressure.',
            strengths: [
              'Clear explanation of Redis Lua scripts for atomic operations',
              'Concrete mention of metrics (50k events/sec) and idempotency techniques',
              'Direct and structured responses'
            ],
            improvements: [
              'Explain failover strategy if Redis cluster nodes experience partition',
              'Discuss monitoring / observability instrumentation (e.g. OpenTelemetry)'
            ],
            actionPlan: [
              'Practice system failure scenario walk-throughs under split-brain conditions',
              'Review distributed consensus trade-offs (Raft vs Dynamo-style)'
            ]
          }
        }
      ],
      activeSessionId: null,
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions.filter(s => s.id !== session.id)],
          activeSessionId: session.id,
        })),
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        })),
      clearSessions: () => set({ sessions: [], activeSessionId: null }),
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      getLatestSession: () => {
        const { sessions } = get();
        return sessions.length > 0 ? sessions[0] : null;
      },
    }),
    {
      name: 'intervibe-sessions-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
