export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          target_role: string | null;
          seniority: string | null;
          subscription_tier: string | null;
          credits_remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          target_role?: string | null;
          seniority?: string | null;
          subscription_tier?: string | null;
          credits_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          target_role?: string | null;
          seniority?: string | null;
          subscription_tier?: string | null;
          credits_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          job_role: string;
          interviewer_voice: string | null;
          duration_seconds: number;
          question_count: number;
          overall_score: number | null;
          technical_depth_score: number | null;
          clarity_score: number | null;
          architecture_score: number | null;
          analysis: Json | null;
          audio_recording_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_role: string;
          interviewer_voice?: string | null;
          duration_seconds?: number;
          question_count?: number;
          overall_score?: number | null;
          technical_depth_score?: number | null;
          clarity_score?: number | null;
          architecture_score?: number | null;
          analysis?: Json | null;
          audio_recording_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_role?: string;
          interviewer_voice?: string | null;
          duration_seconds?: number;
          question_count?: number;
          overall_score?: number | null;
          technical_depth_score?: number | null;
          clarity_score?: number | null;
          architecture_score?: number | null;
          analysis?: Json | null;
          audio_recording_url?: string | null;
          created_at?: string;
        };
      };
      session_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'system' | 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'system' | 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'system' | 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}
