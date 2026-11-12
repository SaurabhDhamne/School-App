import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, mode = 'marksheet', subject = 'maths', apiKey: userApiKey } = body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided. Please capture or upload a photo.' }, { status: 400 });
    }

    // Extract real MIME type (jpeg, png, webp)
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    // Token-efficient, concise instructions for Gemini Vision
    const prompt = mode === 'attendance'
      ? `You are an OCR assistant for school registers. Extract student roll numbers and attendance status from this photo.
Return strictly valid JSON with no markdown formatting:
{
  "sheetType": "Handwritten Attendance Register",
  "records": [
    { "rollNo": "01", "name": "Student Name", "status": "P", "confidence": "98%" }
  ]
}
Use status "P" for Present and "A" for Absent. If name is unclear, provide the roll number.`
      : `You are an OCR assistant for school exam answer sheets. Extract roll numbers and marks for subject: "${subject}" (Max Marks: 25).
Also verify if question-wise marks sum up to the total score.
Return strictly valid JSON with no markdown formatting:
{
  "sheetType": "Exam Marksheet",
  "subject": "${subject}",
  "records": [
    { "rollNo": "01", "name": "Student Name", "mark": 21, "confidence": "97%" }
  ],
  "arithmeticChecks": []
}`;

    // Call Gemini 2.0 Flash (fastest, lowest token usage)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini 2.0 Flash call failed, falling back to Gemini 1.5 Flash:', errText);
      
      // Fallback to gemini-1.5-flash
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          })
        }
      );

      if (!fallbackRes.ok) {
        const fallbackErr = await fallbackRes.text();
        return NextResponse.json({ error: `AI Vision Error: ${fallbackErr}` }, { status: fallbackRes.status });
      }

      const fbResult = await fallbackRes.json();
      const fbCandidateText = fbResult.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = (fbCandidateText || '{}').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({ success: true, data: parsedData });
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = (candidateText || '{}').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
