import { NextRequest, NextResponse } from 'next/server';
import {
  getConsentForm,
  getExplainerByFormId,
  insertPatientSession,
} from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const { formId } = await params;
    const form = getConsentForm(formId);
    if (!form) {
      return NextResponse.json(
        { error: 'Consent form not found' },
        { status: 404 },
      );
    }

    const explainer = getExplainerByFormId(formId);
    if (!explainer) {
      return NextResponse.json(
        { error: 'Explainer not generated yet' },
        { status: 404 },
      );
    }

    // Create patient session
    const sessionId = uuid();
    insertPatientSession({
      id: sessionId,
      form_id: formId,
      patient_name: null,
      started_at: new Date().toISOString(),
      completed_at: null,
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
    });

    return NextResponse.json({
      sessionId,
      procedureName: form.procedure_name,
      doctorName: form.doctor_name,
      keyPoints: JSON.parse(explainer.key_points),
      medicalTerms: JSON.parse(explainer.medical_terms),
      risks: JSON.parse(explainer.risk_data),
      questions: JSON.parse(explainer.questions),
    });
  } catch (error) {
    console.error('Explainer fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load explainer' },
      { status: 500 },
    );
  }
}
