import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json({ success: true, status: 'OCR Vision API operational' });
}

// Helper to get active Gemini API key from environment or .env.local on disk
function getGeminiApiKey(requestKey) {
  if (requestKey && requestKey.trim().length > 5) return requestKey.trim();
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.warn('Could not read .env.local on disk:', err.message);
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { imageBase64, mode = 'marksheet', subject = 'maths', apiKey: userApiKey } = body;

    const apiKey = getGeminiApiKey(userApiKey);

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google Gemini API key not found. Please set GEMINI_API_KEY in .env.local' 
      }, { status: 401 });
    }

    if (!imageBase64) {
      return NextResponse.json({ 
        error: 'No image provided. Please capture or upload an answer sheet or register photo.' 
      }, { status: 400 });
    }

    // Extract real MIME type (jpeg, png, webp, pdf, etc.)
    const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+);base64,/);
    let rawMime = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
    let cleanMime = 'image/jpeg';
    if (rawMime.includes('png')) cleanMime = 'image/png';
    else if (rawMime.includes('webp')) cleanMime = 'image/webp';
    else if (rawMime.includes('pdf')) cleanMime = 'application/pdf';
    else if (rawMime.includes('jpeg') || rawMime.includes('jpg')) cleanMime = 'image/jpeg';

    const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

    // Highly specific, token-optimized prompts strictly separated by scan mode
    const prompt = mode === 'attendance'
      ? `Task: Extract school attendance register ledger.
Extract each student row: roll number, student name, and attendance status ('P' for Present, 'A' for Absent).
Return JSON format:
{
  "sheetType": "Attendance Register",
  "records": [
    { "rollNo": "01", "name": "Student Name", "status": "P" }
  ]
}`
      : `Task: Extract single student exam answer sheet for subject "${subject}".
Extract:
1. Student name (from "Name : ____" or paper header)
2. Roll number (from circle/brackets or roll field)
3. Total marks obtained and maximum marks (e.g. from teacher's circled fraction like 16/20, 17/20, 20/20, 18/20, 10/25)
4. Verify question score arithmetic sum
Return ONLY the single student detected on this paper.
Return JSON format:
{
  "sheetType": "Single Student Test Paper",
  "detectedSubject": "${subject}",
  "records": [
    { "rollNo": "01", "name": "Student Name", "mark": 18, "maxMark": 20 }
  ],
  "arithmeticChecks": [
    { "student": "Student Name", "status": "Verified", "note": "Question score sum matches circled total" }
  ]
}`;

    // Tight maxOutputTokens saves token quota and accelerates response
    const maxTokens = mode === 'marksheet' ? 600 : 1200;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json"
      }
    };

    let successfulData = null;
    let modelUsed = null;
    let lastError = null;

    // 1. Discover models supported by this API key
    let candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash-002', 'gemini-1.5-pro-latest'];
    
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (listRes.ok) {
        const listJson = await listRes.json();
        if (listJson.models && Array.isArray(listJson.models)) {
          const validModelNames = listJson.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));
          if (validModelNames.length > 0) {
            candidateModels = [
              ...candidateModels.filter(m => validModelNames.includes(m)),
              ...validModelNames.filter(m => m.includes('flash')),
              ...validModelNames
            ];
            candidateModels = Array.from(new Set(candidateModels));
          }
        }
      }
    } catch (e) {
      console.warn('Model list discovery error:', e.message);
    }

    // 2. Call generateContent with candidate models
    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(12000)
        });

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanJson = text.replace(/^```(json)?\s*/i, '').replace(/```\s*$/i, '').trim();
            successfulData = JSON.parse(cleanJson);
            modelUsed = modelName;
            break;
          }
        } else {
          const errTxt = await response.text();
          lastError = `${modelName}: ${errTxt}`;
          console.warn(`Model ${modelName} returned error:`, errTxt);
        }
      } catch (err) {
        lastError = `${modelName}: ${err.message}`;
        console.warn(`Fetch error for ${modelName}:`, err.message);
      }
    }

    // 3. If live AI succeeded, return REAL data
    if (successfulData && successfulData.records) {
      return NextResponse.json({
        success: true,
        model: modelUsed,
        data: successfulData
      });
    }

    // 4. REAL ERROR REPORTING - NO FAKE MOCKS
    console.error('OCR processing failed:', lastError);
    return NextResponse.json({
      success: false,
      error: lastError 
        ? `AI Scanner Error: ${lastError}`
        : 'Could not extract handwriting from image. Please ensure photo is well-lit and legible, and retry.'
    }, { status: 422 });

  } catch (error) {
    console.error('OCR Route Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process document' 
    }, { status: 500 });
  }
}
