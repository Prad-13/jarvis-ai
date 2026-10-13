import { NextRequest, NextResponse } from 'next/server';
import { listGoogleTasks, createGoogleTask, updateGoogleTask, deleteGoogleTask } from '@/lib/google/client';

export async function GET() {
  try {
    const tasks = await listGoogleTasks(20);
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, notes, due } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const task = await createGoogleTask(title.trim(), notes, due);
    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }
    const googleStatus = status === 'completed' ? 'completed' : 'needsAction';
    const task = await updateGoogleTask(id, googleStatus);
    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }
    const result = await deleteGoogleTask(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}
