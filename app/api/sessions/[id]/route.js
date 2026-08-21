import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params for Next.js 15+ App Router compliance

    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID is required.' }, { status: 400 });
    }

    const session = await Session.findById(id);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { sessionName, students, minScore, minMath, minScience, minEnglish, searchQuery } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID is required.' }, { status: 400 });
    }

    if (!sessionName || String(sessionName).trim() === '') {
      return NextResponse.json({ success: false, error: 'Session name is required.' }, { status: 400 });
    }

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({ success: false, error: 'Valid students array is required.' }, { status: 400 });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      {
        sessionName: String(sessionName).trim(),
        students,
        minScore: Number(minScore) || 0,
        minMath: Number(minMath) || 0,
        minScience: Number(minScience) || 0,
        minEnglish: Number(minEnglish) || 0,
        searchQuery: String(searchQuery || '')
      },
      { new: true, runValidators: true } // Return updated doc & run validations
    );

    if (!updatedSession) {
      return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error("PUT /api/sessions/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID is required.' }, { status: 400 });
    }

    const deletedSession = await Session.findByIdAndDelete(id);

    if (!deletedSession) {
      return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedSession });
  } catch (error) {
    console.error("DELETE /api/sessions/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


