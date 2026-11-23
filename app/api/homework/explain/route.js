import { NextResponse } from 'next/server';
import { generateAndSaveExplanation } from '@/lib/homeworkExplainer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const homework = body.homework || {};
    const lang = body.targetLanguage || 'en';
    const forceRefresh = Boolean(body.forceRefresh);

    if (!homework || (!homework.message && !homework.id)) {
      return NextResponse.json({ error: 'Homework data is required' }, { status: 400 });
    }

    const result = await generateAndSaveExplanation(homework, lang, forceRefresh);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Homework explain route error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
