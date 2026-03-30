import { NextRequest, NextResponse } from 'next/server';
import {
  getVerificationBySession,
  getPatientSession,
  getConsentForm,
  getExplainerByFormId,
} from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> },
) {
  try {
    const { verificationId } = await params;

    // Find verification by ID
    const db = (await import('@/lib/db')).getDb();
    const verification = db
      .prepare('SELECT * FROM verification_records WHERE id = ?')
      .get(verificationId) as
      | {
          id: string;
          session_id: string;
          answers: string;
          score: number;
          passed: number;
          verified_at: string;
          ip_address: string;
        }
      | undefined;

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 },
      );
    }

    const session = getPatientSession(verification.session_id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const form = getConsentForm(session.form_id);
    if (!form) {
      return NextResponse.json(
        { error: 'Consent form not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      certificate: {
        id: verification.id,
        patientName: session.patient_name,
        procedureName: form.procedure_name,
        doctorName: form.doctor_name,
        score: verification.score,
        passed: !!verification.passed,
        verifiedAt: verification.verified_at,
        sessionStarted: session.started_at,
        ipAddress: verification.ip_address,
        answers: JSON.parse(verification.answers),
        legalStatement: `This document certifies that ${session.patient_name} has been presented with a plain-language explanation of the informed consent for "${form.procedure_name}" and has demonstrated comprehension by correctly answering ${verification.score}% of verification questions. This verification complies with informed consent requirements under FDA 21 CFR 50.20 and supports the standard of care for patient education per AMA guidelines.`,
      },
    });
  } catch (error) {
    console.error('Certificate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 },
    );
  }
}
