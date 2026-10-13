import { NextRequest, NextResponse } from 'next/server';
import { listCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../../../../lib/google/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr) : 10;
    
    const events = await listCalendarEvents(limit);
    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error in Calendar list endpoint:', error);
    return NextResponse.json({ error: error.message || 'Calendar list failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { summary, description, start, end, location } = body;
    
    if (!summary || !start || !end) {
      return NextResponse.json({ error: 'Missing summary, start or end time' }, { status: 400 });
    }

    const result = await createCalendarEvent({ summary, description, start, end, location });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Calendar create endpoint:', error);
    return NextResponse.json({ error: error.message || 'Failed to create calendar event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const result = await deleteCalendarEvent(eventId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Calendar delete endpoint:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete calendar event' }, { status: 500 });
  }
}
