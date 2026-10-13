import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/db';

// Initialize the Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
);

/**
 * Gets a configured OAuth2 client if the user is authenticated.
 * Refreshes tokens automatically if expired and updates the local db.
 */
export async function getGoogleAuthClient(): Promise<OAuth2Client | null> {
  const session = db.getSession();
  if (!session || !session.access_token) {
    return null;
  }

  oauth2Client.setCredentials({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expiry_date: session.expiry_date,
  });

  // Check if token is expired or close to expiry (within 5 minutes)
  const isExpired = session.expiry_date 
    ? Date.now() + 5 * 60 * 1000 >= session.expiry_date 
    : true;

  if (isExpired && session.refresh_token) {
    try {
      console.log('Refreshing Google access token...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      db.setSession({
        ...session,
        access_token: credentials.access_token!,
        expiry_date: credentials.expiry_date!,
      });
      oauth2Client.setCredentials(credentials);
      return oauth2Client;
    } catch (error) {
      console.error('Failed to refresh Google OAuth token:', error);
      // Clean up bad session
      db.clearSession();
      return null;
    }
  }

  return oauth2Client;
}

// ==========================================
// GMAIL SERVICE IMPLEMENTATION
// ==========================================

export async function listEmails(maxResults = 5) {
  const auth = await getGoogleAuthClient();
  if (!auth) {
    console.log('Google Auth not connected - Gmail list empty');
    return [];
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'category:primary',
    });

    const messages = res.data.messages || [];
    const emails = [];

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
      const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
      const date = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
      const snippet = detail.data.snippet || '';

      const isRead = !(detail.data.labelIds || []).includes('UNREAD');
      const isUrgent = subject.toLowerCase().includes('urgent') || 
                       subject.toLowerCase().includes('critical') || 
                       from.toLowerCase().includes('billing') ||
                       snippet.toLowerCase().includes('otp');
      
      let label = 'Inbox';
      if (subject.toLowerCase().includes('security')) label = 'Security';
      else if (from.toLowerCase().includes('stripe') || subject.toLowerCase().includes('invoice') || subject.toLowerCase().includes('payment')) label = 'Finance';
      else if (isUrgent) label = 'Urgent';
      else if (from.toLowerCase().includes('.ai') || from.toLowerCase().includes('git') || snippet.toLowerCase().includes('code')) label = 'Work';

      emails.push({
        id: msg.id!,
        from,
        subject,
        snippet,
        date,
        isRead,
        isUrgent,
        label,
      });
    }

    return emails;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}

export async function getEmailDetail(messageId: string) {
  const auth = await getGoogleAuthClient();
  if (!auth) return null;

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
    const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
    const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
    const date = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
    const snippet = detail.data.snippet || '';

    // Extract body content
    let body = '';
    const payload = detail.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload?.parts) {
      // Traverse parts
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain') || 
                       payload.parts.find(p => p.mimeType === 'text/html');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }
    if (!body) body = snippet;

    return {
      id: messageId,
      from,
      subject,
      snippet,
      date,
      body,
      isRead: !(detail.data.labelIds || []).includes('UNREAD'),
    };
  } catch (error) {
    console.error(`Error fetching email detail for ${messageId}:`, error);
    return null;
  }
}

export async function sendOrReplyEmail(to: string, subject: string, body: string, threadId?: string) {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Create base64 email draft
    const emailLines = [];
    emailLines.push(`To: ${to}`);
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('Content-Type: text/plain; charset=utf-8');
    if (threadId) {
      emailLines.push(`In-Reply-To: ${threadId}`);
      emailLines.push(`References: ${threadId}`);
    }
    emailLines.push('');
    emailLines.push(body);

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function updateEmailLabels(messageId: string, addLabels: string[], removeLabels: string[]) {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });
    return { success: true };
  } catch (error) {
    console.error(`Error updating labels for email ${messageId}:`, error);
    throw error;
  }
}

// ==========================================
// CALENDAR SERVICE IMPLEMENTATION
// ==========================================

export async function listCalendarEvents(maxResults = 10) {
  const auth = await getGoogleAuthClient();
  if (!auth) {
    console.log('Google Auth not connected - Calendar events empty');
    return [];
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = res.data.items || [];
    return items.map(item => ({
      id: item.id!,
      summary: item.summary || '(No Summary)',
      description: item.description || '',
      start: item.start?.dateTime || item.start?.date || new Date().toISOString(),
      end: item.end?.dateTime || item.end?.date || new Date().toISOString(),
      location: item.location || '',
      status: item.status || 'confirmed',
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export async function createCalendarEvent(eventDetails: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}) {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: { dateTime: eventDetails.start },
        end: { dateTime: eventDetails.end },
        location: eventDetails.location,
      },
    });

    return { success: true, event: res.data };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return { success: true };
  } catch (error) {
    console.error(`Error deleting calendar event ${eventId}:`, error);
    throw error;
  }
}

// ==========================================
// DRIVE & SPREADSHEETS SERVICE IMPLEMENTATION
// ==========================================

export async function listDriveFiles(maxResults = 10) {
  const auth = await getGoogleAuthClient();
  if (!auth) {
    console.log('Google Auth not connected - Drive files empty');
    return [];
  }

  try {
    const drive = google.drive({ version: 'v3', auth });
    const res = await drive.files.list({
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink)',
      orderBy: 'modifiedTime desc',
    });

    return (res.data.files || []).map(f => ({
      id: f.id!,
      name: f.name || 'Untitled File',
      mimeType: f.mimeType || 'unknown',
      modifiedTime: f.modifiedTime || new Date().toISOString(),
      size: f.size ? `${(parseInt(f.size) / (1024 * 1024)).toFixed(1)} MB` : 'unknown',
      webViewLink: f.webViewLink || '#',
    }));
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return [];
  }
}

export async function readSpreadsheet(spreadsheetId?: string, range = 'Sheet1!A1:E10') {
  const targetId = spreadsheetId || process.env.DEFAULT_GOOGLE_SHEET_ID;
  const auth = await getGoogleAuthClient();
  
  if (!auth || !targetId || targetId.startsWith('1zeEGBt5Ix')) {
    console.log('No Google Auth or placeholder sheet ID - Sheet content empty');
    return [];
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: targetId,
      range,
    });
    return res.data.values || [];
  } catch (error) {
    console.error(`Error reading spreadsheet ${targetId}:`, error);
    return [];
  }
}

export async function updateSpreadsheet(
  range: string, 
  values: any[][], 
  spreadsheetId?: string
) {
  const targetId = spreadsheetId || process.env.DEFAULT_GOOGLE_SHEET_ID;
  const auth = await getGoogleAuthClient();

  if (!auth || !targetId || targetId.startsWith('1zeEGBt5Ix')) {
    throw new Error('Google connection required or placeholder sheet ID in use');
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: targetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return { success: true };
  } catch (error) {
    console.error(`Error updating spreadsheet ${targetId}:`, error);
    throw error;
  }
}

export async function appendSpreadsheetRow(
  range: string, 
  values: any[][], 
  spreadsheetId?: string
) {
  const targetId = spreadsheetId || process.env.DEFAULT_GOOGLE_SHEET_ID;
  const auth = await getGoogleAuthClient();

  if (!auth || !targetId || targetId.startsWith('1zeEGBt5Ix')) {
    throw new Error('Google connection required or placeholder sheet ID in use');
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: targetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return { success: true };
  } catch (error) {
    console.error(`Error appending spreadsheet row for ${targetId}:`, error);
    throw error;
  }
}

// ==========================================
// GOOGLE TASKS SERVICE IMPLEMENTATION
// ==========================================

export async function listGoogleTasks(maxResults = 20) {
  const auth = await getGoogleAuthClient();
  if (!auth) {
    console.log('Google Auth not connected - Google Tasks empty');
    return [];
  }

  try {
    const tasksService = google.tasks({ version: 'v1', auth });
    const res = await tasksService.tasks.list({
      tasklist: '@default',
      maxResults,
      showCompleted: true,
      showHidden: true,
    });

    const items = res.data.items || [];
    return items.map(task => ({
      id: task.id!,
      title: task.title || '(No Title)',
      status: task.status === 'completed' ? 'completed' : 'pending',
      dueDate: task.due || undefined,
      createdAt: task.updated || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching Google Tasks:', error);
    return [];
  }
}

export async function createGoogleTask(title: string, notes?: string, due?: string) {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const tasksService = google.tasks({ version: 'v1', auth });
    const res = await tasksService.tasks.insert({
      tasklist: '@default',
      requestBody: {
        title,
        notes,
        due,
      }
    });
    return {
      id: res.data.id!,
      title: res.data.title || '(No Title)',
      status: res.data.status === 'completed' ? 'completed' : 'pending',
      dueDate: res.data.due || undefined,
      createdAt: res.data.updated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating Google Task:', error);
    throw error;
  }
}

export async function updateGoogleTask(taskId: string, status: 'needsAction' | 'completed') {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const tasksService = google.tasks({ version: 'v1', auth });
    const res = await tasksService.tasks.patch({
      tasklist: '@default',
      task: taskId,
      requestBody: {
        status,
      }
    });
    return {
      id: res.data.id!,
      title: res.data.title || '(No Title)',
      status: res.data.status === 'completed' ? 'completed' : 'pending',
      dueDate: res.data.due || undefined,
      createdAt: res.data.updated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating Google Task:', error);
    throw error;
  }
}

export async function deleteGoogleTask(taskId: string) {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Unauthenticated');

  try {
    const tasksService = google.tasks({ version: 'v1', auth });
    await tasksService.tasks.delete({
      tasklist: '@default',
      task: taskId,
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting Google Task:', error);
    throw error;
  }
}
