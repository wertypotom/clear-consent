import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import {
  insertConsentForm,
  insertExplainer,
  getExplainerByFormId,
} from '@/lib/db';
import { generateExplainer } from '@/lib/gemini';
import { PDFParse } from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;
    const doctorName = formData.get('doctorName') as string;
    const procedureName = formData.get('procedureName') as string;

    if (!file || !doctorName || !procedureName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Parse PDF text
    let pdfText: string;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Handle demo text files (text/plain) vs real PDFs
    if (file.type === 'text/plain') {
      // Demo mode: just use the text directly
      pdfText = buffer.toString('utf-8');
    } else {
      // Real PDF: parse with pdf-parse
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      pdfText = result.text;
      await parser.destroy();
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 400 },
      );
    }

    // Store consent form
    const formId = uuid();
    insertConsentForm({
      id: formId,
      doctor_name: doctorName,
      procedure_name: procedureName,
      pdf_text: pdfText,
      created_at: new Date().toISOString(),
    });

    // Generate AI explainer
    const explainerContent = await generateExplainer(procedureName, pdfText);

    const explainerId = uuid();
    insertExplainer({
      id: explainerId,
      form_id: formId,
      key_points: JSON.stringify(explainerContent.keyPoints),
      medical_terms: JSON.stringify(explainerContent.medicalTerms),
      risk_data: JSON.stringify(explainerContent.risks),
      questions: JSON.stringify(explainerContent.questions),
      reading_level: '6th grade',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      formId,
      explainerId,
      patientLink: `/patient/${formId}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
