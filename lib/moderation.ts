/**
 * AI-Powered Content Moderation System
 * 3-Strike Warning System with Fair Penalties
 */

import { callAI } from './ai';
import { prisma } from './prisma';

export interface ModerationResult {
  isToxic: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  confidence: number;
}

/**
 * Check content for toxicity using AI
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    const response = await callAI(
      [
        {
          role: 'system',
          content: `Du bist ein Content-Moderator. Analysiere den folgenden Text auf toxisches Verhalten:

          Kategorien:
          - HARASSMENT: Belästigung, Mobbing, persönliche Angriffe
          - HATE_SPEECH: Hassrede, Diskriminierung
          - VIOLENCE: Gewaltandrohungen, Aufrufe zu Gewalt
          - SPAM: Spam, wiederholte Werbung
          - NSFW: Explizite Inhalte

          Antworte NUR im folgenden JSON-Format (ohne weitere Erklärungen):
          {
            "isToxic": true/false,
            "severity": "LOW"/"MEDIUM"/"HIGH",
            "reason": "kurze Begründung auf Deutsch",
            "confidence": 0.0-1.0
          }

          Severity Guidelines:
          - LOW: Leichte Unhöflichkeit, unprofessionelle Sprache
          - MEDIUM: Klare Beleidigungen, aggressive Sprache
          - HIGH: Hassrede, Gewaltdrohungen, schwere Verstöße

          Sei fair aber strikt. Business-Kritik ist OK, persönliche Angriffe nicht.`
        },
        {
          role: 'user',
          content: `Analysiere diesen Text:\n\n${content}`
        }
      ],
      { temperature: 0.1, maxTokens: 200 }
    );

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      isToxic: result.isToxic || false,
      severity: result.severity || 'LOW',
      reason: result.reason || 'No specific reason provided',
      confidence: result.confidence || 0.5
    };
  } catch (error) {
    console.error('Moderation check failed:', error);
    // Fail-safe: Don't block content if AI fails
    return {
      isToxic: false,
      severity: 'LOW',
      reason: 'Moderation service unavailable',
      confidence: 0
    };
  }
}

/**
 * Issue a warning to a user and handle strike logic
 */
export async function issueWarning(
  userId: string,
  content: string,
  moderationResult: ModerationResult
): Promise<{
  warningNumber: number;
  shouldBan: boolean;
  message: string;
}> {
  // Get current warning count
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { toxicityWarnings: true, isBanned: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isBanned) {
    throw new Error('User is already banned');
  }

  const newWarningCount = user.toxicityWarnings + 1;

  // Create warning record
  await prisma.moderationWarning.create({
    data: {
      userId,
      content,
      reason: moderationResult.reason,
      severity: moderationResult.severity,
      warningNumber: newWarningCount
    }
  });

  // Update user warning count
  await prisma.user.update({
    where: { id: userId },
    data: { toxicityWarnings: newWarningCount }
  });

  // Determine response based on warning number
  let message = '';
  let shouldBan = false;

  if (newWarningCount === 1) {
    message = `⚠️ **Erste Warnung**\n\nDein Beitrag wurde als unangemessen erkannt:\n"${moderationResult.reason}"\n\nBitte halte dich an unsere Community-Richtlinien. Bei weiteren Verstößen folgen härtere Konsequenzen.`;
  } else if (newWarningCount === 2) {
    message = `⚠️ **Zweite Warnung**\n\nErneuter Verstoß erkannt:\n"${moderationResult.reason}"\n\nDies ist deine zweite Warnung. Noch ein Verstoß und es gibt ernsthafte Konsequenzen.`;
  } else if (newWarningCount === 3) {
    message = `🚨 **LETZTE WARNUNG**\n\nDritter Verstoß:\n"${moderationResult.reason}"\n\n**WICHTIG:** Beim nächsten Verstoß wird dein Account gesperrt und du erhältst eine Rückerstattung deiner Zahlung abzüglich einer fairen Strafgebühr.`;
  } else {
    // 4th strike = BAN
    shouldBan = true;
    await banUser(userId, moderationResult.reason);
    message = `🔒 **Account gesperrt**\n\nDein Account wurde aufgrund wiederholter Verstöße gegen unsere Community-Richtlinien gesperrt.\n\nLetzte Verletzung: "${moderationResult.reason}"\n\nDu erhältst eine Rückerstattung deiner Zahlung abzüglich einer Strafgebühr innerhalb von 7 Werktagen.`;
  }

  return {
    warningNumber: newWarningCount,
    shouldBan,
    message
  };
}

/**
 * Ban user and process refund
 */
async function banUser(userId: string, reason: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      banReason: reason,
      bannedAt: new Date()
    }
  });

  // TODO: Trigger payment refund with penalty
  // This should integrate with your payment system (Stripe, PayPal, etc.)
  // For now, just log it
  console.log(`[REFUND REQUIRED] User ${userId} banned. Reason: ${reason}`);

  // Optional: Send email notification about ban and refund
  // await sendBanNotificationEmail(userId);
}

/**
 * Check if user is allowed to post (not banned, not over limit)
 */
export async function canUserPost(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, toxicityWarnings: true }
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  if (user.isBanned) {
    return {
      allowed: false,
      reason: 'Your account has been banned due to repeated violations of our community guidelines.'
    };
  }

  return { allowed: true };
}
