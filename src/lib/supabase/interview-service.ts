import { supabase } from './client';
import type { InterviewSession } from '@/store/session-store';

/**
 * Saves a completed interview session and its message dialogue to Supabase.
 */
export async function saveSessionToSupabase(session: InterviewSession, userId: string): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('[Supabase Service] Skipped cloud sync: NEXT_PUBLIC_SUPABASE_ANON_KEY not configured.');
    return null;
  }

  try {
    // 1. Insert Interview Session Row
    const { data: sessionRow, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: userId,
        job_role: session.jobRole,
        interviewer_voice: session.interviewerVoice,
        duration_seconds: session.durationSeconds,
        question_count: session.questionCount,
        overall_score: session.analysis?.overallScore ?? null,
        technical_depth_score: session.analysis?.technicalDepthScore ?? null,
        clarity_score: session.analysis?.clarityScore ?? null,
        architecture_score: session.analysis?.architectureScore ?? null,
        analysis: session.analysis as any,
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[Supabase Service] Error inserting session:', sessionError);
      return null;
    }

    const insertedId = sessionRow.id;

    // 2. Insert Conversation Messages
    if (session.messages && session.messages.length > 0) {
      const messagesToInsert = session.messages.map((m) => ({
        session_id: insertedId,
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.text,
      }));

      const { error: messagesError } = await supabase
        .from('session_messages')
        .insert(messagesToInsert);

      if (messagesError) {
        console.warn('[Supabase Service] Warning inserting messages:', messagesError);
      }
    }

    console.log(`[Supabase Service] Successfully persisted interview session ${insertedId}`);
    return insertedId;
  } catch (err) {
    console.error('[Supabase Service] Exception persisting session:', err);
    return null;
  }
}

/**
 * Fetches all past interview sessions for the current user from Supabase.
 */
export async function fetchUserSessionsFromSupabase(userId: string): Promise<InterviewSession[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*, session_messages(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[Supabase Service] Error fetching sessions:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      jobRole: row.job_role,
      interviewerVoice: row.interviewer_voice || 'Sarah - Friendly HR',
      durationSeconds: row.duration_seconds || 0,
      questionCount: row.question_count || 0,
      messages: (row.session_messages || []).map((m: any) => ({
        role: m.role,
        text: m.content,
      })),
      analysis: row.analysis || {
        overallScore: row.overall_score || 0,
        technicalDepthScore: row.technical_depth_score || 0,
        clarityScore: row.clarity_score || 0,
        architectureScore: row.architecture_score || 0,
        executiveSummary: '',
        strengths: [],
        improvements: [],
        actionPlan: [],
      },
    }));
  } catch (err) {
    console.error('[Supabase Service] Exception fetching sessions:', err);
    return [];
  }
}

/**
 * Uploads an interview audio recording to Supabase Storage bucket.
 */
export async function uploadInterviewAudioToSupabase(
  audioBlob: Blob,
  sessionId: string,
  userId: string
): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const fileName = `${userId}/${sessionId}.wav`;
    const { data, error } = await supabase.storage
      .from('intervibe-docs')
      .upload(fileName, audioBlob, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (error) {
      console.error('[Supabase Storage] Audio upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('intervibe-docs')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[Supabase Storage] Audio upload exception:', err);
    return null;
  }
}
