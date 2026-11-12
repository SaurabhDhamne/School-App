import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, mode = 'marksheet', subject = 'maths', apiKey: userApiKey } = body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // Realistic OCR response when API key is not configured or in mock/demo mode
    if (!apiKey) {
      if (mode === 'attendance') {
        return NextResponse.json({
          success: true,
          mock: true,
          data: {
            sheetType: 'Handwritten Attendance Register',
            date: '11-Nov-2026',
            totalScanned: 10,
            presentCount: 8,
            absentCount: 2,
            records: [
              { rollNo: '01', name: 'Aakash Verma', status: 'P', confidence: '98%' },
              { rollNo: '02', name: 'Ananya Gupta', status: 'P', confidence: '99%' },
              { rollNo: '03', name: 'Devendra Patel', status: 'A', confidence: '95%' },
              { rollNo: '04', name: 'Diya Sen', status: 'P', confidence: '97%' },
              { rollNo: '05', name: 'Ishaan Reddy', status: 'A', confidence: '94%' },
              { rollNo: '06', name: 'Kavya Nair', status: 'P', confidence: '99%' },
              { rollNo: '07', name: 'Manish Kumar', status: 'P', confidence: '96%' },
              { rollNo: '08', name: 'Meera Iyer', status: 'P', confidence: '98%' },
              { rollNo: '09', name: 'Rohan Joshi', status: 'P', confidence: '92%' },
              { rollNo: '10', name: 'Tanvi Deshmukh', status: 'P', confidence: '97%' }
            ]
          }
        });
      }

      // Default mock for marksheet / answer sheet
      return NextResponse.json({
        success: true,
        mock: true,
        data: {
          sheetType: 'Paper Exam Marksheet / Booklet Cover',
          subject: subject,
          maxMarks: 25,
          totalScanned: 8,
          arithmeticChecks: [
            {
              rollNo: '03',
              name: 'Devendra Patel',
              flag: 'Arithmetic Check',
              note: 'Teacher wrote 14, but question breakdown sums to 15. Automatically corrected to 15.'
            }
          ],
          records: [
            { rollNo: '01', name: 'Aakash Verma', mark: 22, confidence: '98%', questions: [4.5, 4.5, 5, 4, 4] },
            { rollNo: '02', name: 'Ananya Gupta', mark: 25, confidence: '99%', questions: [5, 5, 5, 5, 5] },
            { rollNo: '03', name: 'Devendra Patel', mark: 15, confidence: '94%', questions: [3, 3, 4, 2, 3], correctedFrom: 14 },
            { rollNo: '04', name: 'Diya Sen', mark: 24, confidence: '97%', questions: [5, 5, 4, 5, 5] },
            { rollNo: '05', name: 'Ishaan Reddy', mark: 14, confidence: '95%', questions: [2.5, 3, 3.5, 2, 3] },
            { rollNo: '06', name: 'Kavya Nair', mark: 23, confidence: '99%', questions: [5, 4.5, 4.5, 4, 5] },
            { rollNo: '07', name: 'Manish Kumar', mark: 19, confidence: '96%', questions: [4, 4, 3, 4, 4] },
            { rollNo: '08', name: 'Meera Iyer', mark: 25, confidence: '99%', questions: [5, 5, 5, 5, 5] }
          ]
        }
      });
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = mode === 'attendance'
      ? `You are an expert school register OCR assistant.
Analyze this photo of a handwritten attendance register.
Extract the roll numbers and attendance status (P for Present, A for Absent).
Return strictly JSON format:
{
  "sheetType": "Handwritten Attendance Register",
  "records": [
    { "rollNo": "01", "name": "string", "status": "P" or "A", "confidence": "98%" }
  ]
}`
      : `You are an expert school marksheet OCR assistant.
Analyze this photo of a handwritten marksheet or exam answer booklet cover for subject: "${subject}".
Extract:
1. Roll numbers and student names
2. Marks scored per student
3. Any arithmetic discrepancies where question sums differ from written totals.

Return strictly JSON format:
{
  "sheetType": "Exam Marksheet",
  "subject": "${subject}",
  "records": [
    { "rollNo": "01", "name": "string", "mark": 21, "confidence": "97%" }
  ]
}`;

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
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: response.status });
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedData = JSON.parse(candidateText || '{}');

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
