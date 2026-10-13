import { NextRequest, NextResponse } from 'next/server';
import { listDriveFiles } from '../../../../lib/google/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr) : 10;

    const files = await listDriveFiles(limit);
    return NextResponse.json(files);
  } catch (error: any) {
    console.error('Error in Drive list endpoint:', error);
    return NextResponse.json({ error: error.message || 'Drive list failed' }, { status: 500 });
  }
}
