import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/db/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', req.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info using the authenticated client
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Persist session tokens in the database
    db.setSession({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      email: userInfo.data.email || 'pradyumna@example.com',
      name: userInfo.data.name || 'Pradyumna',
      picture: userInfo.data.picture || undefined,
    });

    console.log('Google OAuth authentication successful for user:', userInfo.data.email);

    // Redirect to dashboard page
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (err: any) {
    console.error('Error during OAuth callback processing:', err);
    return NextResponse.redirect(new URL('/?error=server_error', req.url));
  }
}
