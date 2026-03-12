// API route: POST /api/submit
// Orchestrates: validate → generate statement → score → Close + Discord → respond

import { NextResponse } from 'next/server';
import { formInputSchema } from '@/lib/types';
import { generateStatement } from '@/lib/statement';
import { calculateScore } from '@/lib/scoring';
import { createLead } from '@/lib/close';
import { sendLeadNotification } from '@/lib/discord';

export async function POST(request: Request) {
  try {
    // 1. Parse and validate
    const body = await request.json();
    const parseResult = formInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 2. Generate statement (deterministic — all math from config)
    const statement = generateStatement(input);
    console.log('[Submit] Statement generated — net distribution:', statement.sampleStatement.netOwnerDistribution);

    // 3. Score the lead
    const score = calculateScore(input);
    console.log('[Submit] Lead score:', score.leadScore, '/', score.maxScore, '—', score.scoreClassification);

    // 4. Build result URL (base64-encoded data in query param)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sweep.hearthproperty.com';
    const resultData = encodeURIComponent(
      Buffer.from(JSON.stringify({ input, statement, score })).toString('base64')
    );
    const resultUrl = `${siteUrl}/results?data=${resultData}`;

    // 5. Close CRM (critical path) + Discord (fire-and-forget) in parallel
    const [closeResult] = await Promise.allSettled([
      createLead(input, statement, score).catch(err => {
        console.error('[Submit] Close CRM failed:', err);
        throw err; // Re-throw — Close is critical path
      }),
      sendLeadNotification(input, statement, score, resultUrl).catch(err => {
        console.error('[Submit] Discord failed (non-blocking):', err);
        return false;
      }),
    ]);

    const closeLeadId = closeResult.status === 'fulfilled' ? closeResult.value : undefined;

    // If Close failed, log but still return results (lead data captured client-side)
    if (closeResult.status === 'rejected') {
      console.error('[Submit] Close CRM lead creation failed:', closeResult.reason);
    }

    // 6. Return success with all data
    return NextResponse.json({
      success: true,
      statement,
      score,
      closeLeadId,
      resultUrl,
    });
  } catch (error) {
    console.error('[Submit] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
