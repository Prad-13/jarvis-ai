import { GoogleGenerativeAI, Tool } from '@google/generative-ai';
import { JARVIS_SYSTEM_INSTRUCTION } from './system';
import * as googleClient from '../google/client';
import { db } from '../db/db';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Define the tool declarations for Gemini Function Calling
 */
export const jarvisTools: Tool[] = [
  {
    functionDeclarations: [
      // Gmail Tools
      {
        name: 'list_emails',
        description: 'Retrieve a list of recent primary emails from Gmail.',
        parameters: {
          type: 'OBJECT',
          properties: {
            maxResults: { 
              type: 'NUMBER', 
              description: 'Maximum number of emails to retrieve. Default is 5.' 
            }
          }
        }
      },
      {
        name: 'get_email_detail',
        description: 'Retrieve the detailed body and contents of a specific email by message ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            messageId: { 
              type: 'STRING', 
              description: 'The unique message ID of the email to inspect.' 
            }
          },
          required: ['messageId']
        }
      },
      {
        name: 'send_email',
        description: 'Send a new email or a reply to a recipient.',
        parameters: {
          type: 'OBJECT',
          properties: {
            to: { type: 'STRING', description: 'Recipient email address.' },
            subject: { type: 'STRING', description: 'Subject line of the email.' },
            body: { type: 'STRING', description: 'The body text of the email.' },
            threadId: { type: 'STRING', description: 'Optional thread ID to reply to.' }
          },
          required: ['to', 'subject', 'body']
        }
      },
      {
        name: 'archive_email',
        description: 'Archive an email by removing the INBOX label.',
        parameters: {
          type: 'OBJECT',
          properties: {
            messageId: { type: 'STRING', description: 'The email message ID.' }
          },
          required: ['messageId']
        }
      },

      // Calendar Tools
      {
        name: 'list_calendar_events',
        description: 'List upcoming calendar events and meetings.',
        parameters: {
          type: 'OBJECT',
          properties: {
            maxResults: { 
              type: 'NUMBER', 
              description: 'Maximum number of events to list. Default is 10.' 
            }
          }
        }
      },
      {
        name: 'create_calendar_event',
        description: 'Create a new meeting or event on the user\'s Google Calendar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING', description: 'Title or summary of the meeting.' },
            start: { type: 'STRING', description: 'Start time in ISO 8601 format (e.g. 2026-06-28T10:00:00Z).' },
            end: { type: 'STRING', description: 'End time in ISO 8601 format (e.g. 2026-06-28T11:00:00Z).' },
            location: { type: 'STRING', description: 'Optional physical location or Meet URL.' },
            description: { type: 'STRING', description: 'Optional description of the event details.' }
          },
          required: ['summary', 'start', 'end']
        }
      },
      {
        name: 'delete_calendar_event',
        description: 'Delete/cancel an event on the user\'s Google Calendar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: { type: 'STRING', description: 'The unique ID of the event to delete.' }
          },
          required: ['eventId']
        }
      },

      // Sheets Tools
      {
        name: 'read_spreadsheet',
        description: 'Read the values/rows from a Google Sheet.',
        parameters: {
          type: 'OBJECT',
          properties: {
            range: { 
              type: 'STRING', 
              description: 'The spreadsheet range to read in A1 notation. Default is Sheet1!A1:E20.' 
            },
            spreadsheetId: { 
              type: 'STRING', 
              description: 'Optional Google Sheet ID. If omitted, uses the configured default spreadsheet.' 
            }
          }
        }
      },
      {
        name: 'update_spreadsheet_cell',
        description: 'Update the content of specific cells in a spreadsheet.',
        parameters: {
          type: 'OBJECT',
          properties: {
            range: { type: 'STRING', description: 'The cell range in A1 notation (e.g. Sheet1!B4).' },
            value: { type: 'STRING', description: 'The new value to write to the cell.' },
            spreadsheetId: { type: 'STRING', description: 'Optional Google Sheet ID.' }
          },
          required: ['range', 'value']
        }
      },
      {
        name: 'append_spreadsheet_row',
        description: 'Append a row of data to a spreadsheet.',
        parameters: {
          type: 'OBJECT',
          properties: {
            range: { type: 'STRING', description: 'Sheet name or range to append to (e.g. Sheet1).' },
            values: { 
              type: 'ARRAY', 
              items: { type: 'STRING' },
              description: 'Array of cells for the new row.' 
            },
            spreadsheetId: { type: 'STRING', description: 'Optional Google Sheet ID.' }
          },
          required: ['range', 'values']
        }
      },

      // Drive Tools
      {
        name: 'list_drive_files',
        description: 'Search and list files, documents, slides, and spreadsheets from Google Drive.',
        parameters: {
          type: 'OBJECT',
          properties: {
            maxResults: { 
              type: 'NUMBER', 
              description: 'Number of files to return. Default is 10.' 
            }
          }
        }
      },

      // Google Tasks Tools
      {
        name: 'list_google_tasks',
        description: 'List all tasks from the user\'s default Google Tasks list.',
        parameters: {
          type: 'OBJECT',
          properties: {
            maxResults: { type: 'NUMBER', description: 'Max tasks to return. Default 20.' }
          }
        }
      },
      {
        name: 'create_google_task',
        description: 'Create a new task in the user\'s Google Tasks default list.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Title of the task.' },
            notes: { type: 'STRING', description: 'Optional notes or description.' },
            due: { type: 'STRING', description: 'Optional due date in RFC 3339 format.' }
          },
          required: ['title']
        }
      },
      {
        name: 'complete_google_task',
        description: 'Mark a Google Task as completed or reopen it.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING', description: 'The task ID.' },
            status: { type: 'STRING', enum: ['completed', 'needsAction'], description: 'New status.' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_google_task',
        description: 'Permanently delete a task from Google Tasks.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING', description: 'The task ID to delete.' }
          },
          required: ['id']
        }
      },

      // Memory Tools
      {
        name: 'get_memory_items',
        description: 'Get list of user bio details, preferences, and rules stored in memory.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'add_memory_item',
        description: 'Save user preferences, instructions, or contextual facts into JARVIS memory.',
        parameters: {
          type: 'OBJECT',
          properties: {
            content: { type: 'STRING', description: 'Preference or fact statement (e.g. Pradyumna prefers meetings in afternoon).' },
            category: { 
              type: 'STRING', 
              enum: ['preference', 'bio', 'rule', 'general'],
              description: 'Classification of memory content.' 
            }
          },
          required: ['content']
        }
      }
    ]
  }
];

/**
 * Execute the backend tool call based on Gemini requests
 */
export async function executeTool(name: string, args: any): Promise<any> {
  console.log(`Executing tool on server: ${name}`, args);
  try {
    switch (name) {
      // Gmail Tools
      case 'list_emails':
        return await googleClient.listEmails(args.maxResults);
      case 'get_email_detail':
        return await googleClient.getEmailDetail(args.messageId);
      case 'send_email':
        return await googleClient.sendOrReplyEmail(args.to, args.subject, args.body, args.threadId);
      case 'archive_email':
        return await googleClient.updateEmailLabels(args.messageId, [], ['INBOX']);

      // Calendar Tools
      case 'list_calendar_events':
        return await googleClient.listCalendarEvents(args.maxResults);
      case 'create_calendar_event':
        return await googleClient.createCalendarEvent({
          summary: args.summary,
          description: args.description,
          start: args.start,
          end: args.end,
          location: args.location,
        });
      case 'delete_calendar_event':
        return await googleClient.deleteCalendarEvent(args.eventId);

      // Sheets Tools
      case 'read_spreadsheet':
        return await googleClient.readSpreadsheet(args.spreadsheetId, args.range);
      case 'update_spreadsheet_cell':
        return await googleClient.updateSpreadsheet(args.range, [[args.value]], args.spreadsheetId);
      case 'append_spreadsheet_row':
        return await googleClient.appendSpreadsheetRow(args.range, [args.values], args.spreadsheetId);

      // Drive Tools
      case 'list_drive_files':
        return await googleClient.listDriveFiles(args.maxResults);

      // Google Tasks Tools
      case 'list_google_tasks':
        return await googleClient.listGoogleTasks(args.maxResults);
      case 'create_google_task':
        return await googleClient.createGoogleTask(args.title, args.notes, args.due);
      case 'complete_google_task':
        return await googleClient.updateGoogleTask(args.id, args.status || 'completed');
      case 'delete_google_task':
        return await googleClient.deleteGoogleTask(args.id);

      // Memory Tools
      case 'get_memory_items':
        return db.getMemory();
      case 'add_memory_item':
        return db.addMemory(args.content, args.category);

      default:
        throw new Error(`Tool ${name} not found`);
    }
  } catch (error: any) {
    console.error(`Error executing tool ${name}:`, error);
    return { error: error.message || 'Tool execution failed' };
  }
}

/**
 * Get the configured Gemini generative model
 */
export function getJarvisModel(modelName = DEFAULT_MODEL) {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
  }, { apiVersion: 'v1beta' }); // Use v1beta for advanced function calling
}
