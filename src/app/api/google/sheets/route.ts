import { NextRequest, NextResponse } from 'next/server';
import { readSpreadsheet, updateSpreadsheet, appendSpreadsheetRow } from '../../../../lib/google/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const spreadsheetId = searchParams.get('spreadsheetId') || undefined;
    const range = searchParams.get('range') || 'Sheet1!A1:E10';

    const values = await readSpreadsheet(spreadsheetId, range);
    return NextResponse.json(values);
  } catch (error: any) {
    console.error('Error in Sheets read endpoint:', error);
    return NextResponse.json({ error: error.message || 'Spreadsheet read failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spreadsheetId, range, values, action } = body;

    if (!range || !values || !Array.isArray(values)) {
      return NextResponse.json({ error: 'Missing range or values (must be 2D array)' }, { status: 400 });
    }

    if (action === 'append') {
      const result = await appendSpreadsheetRow(range, values, spreadsheetId);
      return NextResponse.json(result);
    } else {
      const result = await updateSpreadsheet(range, values, spreadsheetId);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('Error in Sheets write endpoint:', error);
    return NextResponse.json({ error: error.message || 'Spreadsheet write failed' }, { status: 500 });
  }
}
