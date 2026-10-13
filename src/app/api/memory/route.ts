import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db/db';

export async function GET() {
  try {
    const memory = db.getMemory();
    return NextResponse.json(memory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch memory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, category } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const newItem = db.addMemory(content, category || 'general');
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save memory item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }

    const success = db.deleteMemory(id);
    if (!success) {
      return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete memory item' }, { status: 500 });
  }
}
