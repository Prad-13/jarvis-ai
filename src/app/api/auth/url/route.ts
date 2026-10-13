import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/tasks',
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // crucial for getting refresh_token
      prompt: 'consent',      // forces Google to return refresh token every time
      scope: scopes,
    });

    return NextResponse.json({ url: authorizationUrl });
  } catch (error: any) {
    console.error('Error generating Google OAuth URL:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}
