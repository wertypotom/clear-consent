import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import {
  getPatientSession,
  updatePatientName,
  completeSession,
  insertVerification,
  getExplainerByFormId,
} from '@/lib/db';

interface VerifyBody {
  sessionId: string;
  patientName: string;
  answers: { questionId: number; selectedId: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyBody = await req.json();
    const { sessionId, patientName, answers } = body;

    if (!sessionId || !patientName || !answers?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const session = getPatientSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update patient name
    updatePatientName(sessionId, patientName);

    // Get correct answers
    const explainer = getExplainerByFormId(session.form_id);
    if (!explainer) {
      return NextResponse.json(
        { error: 'Explainer not found' },
        { status: 404 },
      );
    }

    const questions = JSON.parse(explainer.questions);
    let correct = 0;
    const results = answers.map((a) => {
      const q = questions.find((q: { id: number }) => q.id === a.questionId);
      const isCorrect = q?.correctId === a.selectedId;
      if (isCorrect) correct++;
      return {
        questionId: a.questionId,
        selectedId: a.selectedId,
        correctId: q?.correctId,
        isCorrect,
        explanation: q?.explanation || '',
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correct / totalQuestions) * 100);
    const passed = correct === totalQuestions; // Must get ALL correct

    // Track which topics need re-education (wrong answers)
    const reEducationTopics = results
      .filter((r) => !r.isCorrect)
      .map((r) => {
        const q = questions.find((q: { id: number }) => q.id === r.questionId);
        return q
          ? questions[q.relatedKeyPoint]?.title || 'Unknown topic'
          : 'Unknown topic';
      });

    // Store verification
    const verificationId = uuid();
    insertVerification({
      id: verificationId,
      session_id: sessionId,
      answers: JSON.stringify(results),
      score,
      passed: passed ? 1 : 0,
      re_education_topics:
        reEducationTopics.length > 0
          ? JSON.stringify(reEducationTopics)
          : undefined,
      verified_at: new Date().toISOString(),
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
    });

    if (passed) {
      completeSession(sessionId);
    }

    return NextResponse.json({
      verificationId,
      score,
      passed,
      correct,
      total: totalQuestions,
      results,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
