import { NextRequest, NextResponse } from 'next/server';
import { explainTerm } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { term, procedureContext } = await req.json();

    if (!term) {
      return NextResponse.json({ error: 'Term required' }, { status: 400 });
    }

    const explanation = await explainTerm(
      term,
      procedureContext || 'a medical procedure',
    );
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Term explanation error:', error);
    return NextResponse.json(
      { error: 'Failed to explain term' },
      { status: 500 },
    );
  }
}
