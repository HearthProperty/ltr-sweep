// API route: POST /api/pdf
// Generates a branded Monthly Sweep statement PDF.

import { NextResponse } from 'next/server';
import { buildStatementHTML, generatePDF } from '@/lib/pdf';
import type { FormInput, StatementResult, ScoreResult } from '@/lib/types';

export const maxDuration = 30; // Allow up to 30s for PDF generation

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input, statement, score } = body as {
      input: FormInput;
      statement: StatementResult;
      score: ScoreResult;
    };

    if (!input || !statement || !score) {
      return NextResponse.json(
        { error: 'Missing required data for PDF generation' },
        { status: 400 }
      );
    }

    const html = buildStatementHTML(input, statement, score);
    const pdfData = await generatePDF(html);
    const pdfBuffer = Buffer.from(pdfData);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="monthly-sweep-${input.propertyAddress.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[PDF] Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    );
  }
}
