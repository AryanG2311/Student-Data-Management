import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    // Retrieve all sessions, sorted by newest first
    const sessions = await Session.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { sessionName, students, minScore, minMath, minScience, minEnglish, searchQuery } = body;

    if (!sessionName || String(sessionName).trim() === '') {
      return NextResponse.json({ success: false, error: 'Session name is required.' }, { status: 400 });
    }

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({ success: false, error: 'Valid students array is required.' }, { status: 400 });
    }

    // Save session in database
    const newSession = await Session.create({
      sessionName: String(sessionName).trim(),
      students,
      minScore: Number(minScore) || 0,
      minMath: Number(minMath) || 0,
      minScience: Number(minScience) || 0,
      minEnglish: Number(minEnglish) || 0,
      searchQuery: String(searchQuery || '')
    });

    return NextResponse.json({ success: true, data: newSession }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
