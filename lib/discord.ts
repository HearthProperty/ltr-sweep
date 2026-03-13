// Discord notification — fire-and-forget.
// If this fails, we log the error but never block the lead submission.

import type { FormInput, ScoreResult, StatementResult } from './types';

export async function sendLeadNotification(
  input: FormInput,
  statement: StatementResult,
  score: ScoreResult,
  resultUrl: string
): Promise<boolean> {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('[Discord] Skipped — webhook URL not configured');
      return false;
    }

    const mgmtLabel = input.managementType === 'self-managed' ? 'Self-managed' : 'Has a PM';
    const scoreEmoji = score.scoreClassification === 'immediate' ? '🔴' :
      score.scoreClassification === 'high' ? '🟠' :
      score.scoreClassification === 'moderate' ? '🟡' : '🟢';

    const embed = {
      title: '📊 New Monthly Sweep Lead',
      color: 3066993, // Hearth-aligned green
      fields: [
        { name: 'Lead Magnet', value: 'Monthly Sweep Simulator', inline: true },
        { name: 'Owner', value: input.ownerName || 'N/A', inline: true },
        { name: 'Email', value: input.email || 'N/A', inline: true },
        { name: 'Phone', value: input.phone || 'N/A', inline: true },
        { name: 'Property', value: input.propertyAddress || 'N/A', inline: false },
        { name: 'Monthly Rent', value: `$${input.monthlyRent.toLocaleString()}/mo`, inline: true },
        { name: 'Current Fee', value: `$${input.managementFeeCurrent.toLocaleString()}/mo`, inline: true },
        { name: 'Manager', value: mgmtLabel, inline: true },
        { name: 'Score', value: `${scoreEmoji} ${score.leadScore}/${score.maxScore} — ${score.scoreClassification}`, inline: true },
        { name: 'Frustrations', value: (input.primaryProblems || []).join(', ') || 'N/A', inline: false },
        { name: 'Net Distribution', value: `$${statement.sampleStatement.netOwnerDistribution.toLocaleString()}/mo`, inline: true },
      ],
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord] Webhook failed:', response.status, errorText);
      return false;
    }

    console.log('[Discord] Lead notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Discord] Webhook error:', error);
    return false;
  }
}
