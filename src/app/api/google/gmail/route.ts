import { NextRequest, NextResponse } from 'next/server';
import { listEmails, getEmailDetail, sendOrReplyEmail } from '../../../../lib/google/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const limitStr = searchParams.get('limit');
    
    if (id) {
      const email = await getEmailDetail(id);
      if (!email) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }
      return NextResponse.json(email);
    }

    const limit = limitStr ? parseInt(limitStr) : 5;
    const emails = await listEmails(limit);
    return NextResponse.json(emails);
  } catch (error: any) {
    console.error('Error in Gmail endpoint:', error);
    return NextResponse.json({ error: error.message || 'Gmail operation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, body: content, threadId } = body;
    
    if (!to || !subject || !content) {
      return NextResponse.json({ error: 'Missing to, subject or body' }, { status: 400 });
    }

    const result = await sendOrReplyEmail(to, subject, content, threadId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Gmail send endpoint:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
