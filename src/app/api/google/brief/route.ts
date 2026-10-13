import { NextResponse } from 'next/server';
import { listEmails, listCalendarEvents } from '@/lib/google/client';
import { getJarvisModel } from '@/lib/gemini/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Fetch real data in parallel
    const [emails, events] = await Promise.all([
      listEmails(5),
      listCalendarEvents(5),
    ]);

    if (emails.length === 0 && events.length === 0) {
      return NextResponse.json({
        brief: null,
        reason: 'no_data',
        message: 'No emails or calendar events found to generate a brief.',
      });
    }

    // Build the Gemini prompt using real data
    const emailSummaries = emails.length > 0
      ? emails.map((e, i) =>
          `${i + 1}. From: ${e.from} | Subject: ${e.subject} | Snippet: ${e.snippet} | Urgent: ${e.isUrgent}`
        ).join('\n')
      : 'No emails.';

    const calendarSummaries = events.length > 0
      ? events.map((e, i) => {
          const start = new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          return `${i + 1}. ${e.summary} at ${start}${e.location ? ` — ${e.location}` : ''}`;
        }).join('\n')
      : 'No events scheduled today.';

    const prompt = `
You are JARVIS, Pradyumna's elite AI executive assistant. 

Generate a concise, premium daily brief for Pradyumna based on these REAL data points below.

Format the response as clean, scannable markdown with these sections:
1. **Schedule Overview** — summarise today's meetings (if any)
2. **Inbox Highlights** — urgent or important emails
3. **Recommended Focus** — 2-3 actionable priorities for today based on the data
4. **Quick Wins** — any instant actions Pradyumna can take right now

Keep each section tight (2-4 bullet points max). Tone: calm, confident, premium.

---
REAL EMAILS (${emails.length} fetched):
${emailSummaries}

REAL CALENDAR EVENTS (${events.length} fetched):
${calendarSummaries}

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Current time: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
---
    `.trim();

    const model = getJarvisModel();
    const result = await model.generateContent(prompt);
    const brief = result.response.text();

    return NextResponse.json({ brief, emailCount: emails.length, eventCount: events.length });
  } catch (error: any) {
    console.error('Error generating AI brief:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate brief' }, { status: 500 });
  }
}
