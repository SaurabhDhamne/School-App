import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to get active Gemini API key from environment or .env.local
function getGeminiApiKey() {
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

const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)'
};

// Helper to extract topic, exercise, and resource details from homework text
function extractHomeworkDetails(homework) {
  const message = (homework.message || '').trim();
  const subject = homework.subject || 'General';
  const allAtts = Array.isArray(homework.attachments) && homework.attachments.length > 0
    ? homework.attachments
    : (homework.attachment ? [homework.attachment] : []);
  const hasAttachment = allAtts.length > 0 || !!homework.imageUrl;
  const attachmentName = allAtts.map(a => a.name).filter(Boolean).join(', ') || (hasAttachment ? 'Worksheet' : '');

  // Extract topic (e.g. "Linear Equations", "Cellular Structure", or quotes)
  let topic = '';
  const onMatch = message.match(/(?:on|topic[:\s]+|chapter\s+\d+\s+on)\s+([A-Za-z0-9\s\-]+?)(?=\.|\band\b|\brefer\b|\bfor\b|\bin\b|$)/i);
  if (onMatch && onMatch[1] && onMatch[1].trim().length > 2) {
    topic = onMatch[1].trim();
  } else {
    const quoteMatch = message.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) topic = quoteMatch[1].trim();
  }
  if (!topic) topic = subject;

  // Extract specific exercise or question range
  let task = '';
  const exMatch = message.match(/(exercise\s+[0-9\.]+(?:\s*\([^\)]+\))?|chapter\s+[0-9]+|questions?\s+[0-9\s,to\-]+)/i);
  if (exMatch) {
    task = exMatch[1].trim();
  } else {
    task = message.length > 60 ? message.substring(0, 60) + '...' : message;
  }

  return { subject, message, topic, task, hasAttachment, attachmentName };
}

// Smart Explanation Engine in 4 languages (English, Hindi, Marathi, Gujarati)
function generateSmartFallback(homework, lang = 'en') {
  const { subject, message, topic, task, hasAttachment, attachmentName } = extractHomeworkDetails(homework);
  const teacher = homework.teacherName || 'Teacher';

  if (lang === 'hi') {
    const summary = hasAttachment
      ? `यह गृहकार्य '${topic}' विषय पर है। इसमें ${task} को हल करना है और साथ में संलग्न वर्कशीट '${attachmentName}' से अतिरिक्त अभ्यास पूरा करना है।`
      : `यह गृहकार्य '${topic}' विषय पर है। शिक्षक (${teacher}) ने ${task} को अपनी नोटबुक में पूरा करने का निर्देश दिया है।`;

    return {
      summary,
      explanation: summary,
      topic: topic || subject,
      task: task || 'दिए गए प्रश्नों को हल करना',
      resource: hasAttachment ? `संलग्न वर्कशीट: ${attachmentName}` : 'पाठ्यपुस्तक व नोटबुक',
      keyPoints: [
        `📌 विषय (Topic): ${topic || subject}`,
        `📝 मुख्य कार्य (Task): ${task}`,
        `📎 संलग्न सामग्री (Resource): ${hasAttachment ? `वर्कशीट '${attachmentName}'` : 'कक्षा नोटबुक'}`
      ]
    };
  }

  if (lang === 'mr') {
    const summary = hasAttachment
      ? `हा गृहपाठ '${topic}' या घटकावर आधारित आहे. यामध्ये ${task} सोडवायचे असून सोबत जोडलेल्या '${attachmentName}' या वर्कशीटमधील अतिरिक्त गणिते/प्रश्न वहीत सोडवायचे आहेत.`
      : `हा गृहपाठ '${topic}' या घटकावर आधारित आहे. शिक्षकांनी (${teacher}) ${task} मधील अभ्यास वहीत पूर्ण करण्यास सांगितले आहे.`;

    return {
      summary,
      explanation: summary,
      topic: topic || subject,
      task: task || 'दिलेले प्रश्न सोडवणे',
      resource: hasAttachment ? `जोडलेली वर्कशीट: ${attachmentName}` : 'पाठ्यपुस्तक व वही',
      keyPoints: [
        `📌 घटक (Topic): ${topic || subject}`,
        `📝 मुख्य काम (Task): ${task}`,
        `📎 जोडलेली सामग्री (Resource): ${hasAttachment ? `वर्कशीट '${attachmentName}'` : 'वर्ग वही'}`
      ]
    };
  }

  if (lang === 'gu') {
    const summary = hasAttachment
      ? `આ હોમવર્ક '${topic}' પ્રકરણ પર છે. તેમાં ${task} ના પ્રશ્નો અને સાથે જોડેલ '${attachmentName}' વર્કશીટમાંથી વધારાના દાખલા નોટબુકમાં ગણવાના રહેશે.`
      : `આ હોમવર્ક '${topic}' પ્રકરણ પર છે. શિક્ષકે (${teacher}) ${task} નોટબુકમાં પૂર્ણ કરવાની સૂચના આપી છે.`;

    return {
      summary,
      explanation: summary,
      topic: topic || subject,
      task: task || 'આપેલ પ્રશ્નો ગણવા',
      resource: hasAttachment ? `જોડેલ વર્કશીટ: ${attachmentName}` : 'પાઠ્યપુસ્તક અને નોટબુક',
      keyPoints: [
        `📌 વિષય (Topic): ${topic || subject}`,
        `📝 મુખ્ય કાર્ય (Task): ${task}`,
        `📎 જોડેલ સાધન (Resource): ${hasAttachment ? `વર્કશીટ '${attachmentName}'` : 'નોટબુક'}`
      ]
    };
  }

  // Default: English
  const summary = hasAttachment
    ? `This homework covers '${topic}'. Students are assigned ${task}, along with the attached worksheet '${attachmentName}' for extra practice to be completed in their subject notebook.`
    : `This homework covers '${topic}'. The teacher (${teacher}) has assigned ${task} to be completed in the subject notebook.`;

  return {
    summary,
    explanation: summary,
    topic: topic || subject,
    task: task || 'Complete the assigned work',
    resource: hasAttachment ? `Attached Worksheet: ${attachmentName}` : 'Textbook & Notebook',
    keyPoints: [
      `📌 Topic: ${topic || subject}`,
      `📝 Required Task: ${task}`,
      `📎 Attached Resource: ${hasAttachment ? `Worksheet '${attachmentName}'` : 'Subject Notebook'}`
    ]
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { homework, targetLanguage = 'en' } = body;

    if (!homework || !homework.message) {
      return NextResponse.json({ error: 'Homework data is required' }, { status: 400 });
    }

    const lang = targetLanguage || 'en';
    const langLabel = LANGUAGE_LABELS[lang] || 'English';
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      const fallback = generateSmartFallback(homework, lang);
      return NextResponse.json({
        success: true,
        source: 'smart_engine',
        language: lang,
        data: fallback
      });
    }

    const prompt = `You are a helpful school assistant for parents in India.
Your job is to summarize and explain what is given in this homework message/notice and any attached worksheet/PDF or image in simple, clear everyday language for parents.
Explain:
1. What topic or concept is being studied.
2. What specific task, exercise, or questions the student must do.
3. What the attached PDF/image resource contains and how it relates to the homework.

Homework Details:
- Subject: ${homework.subject || 'General'}
- Teacher: ${homework.teacherName || 'Teacher'}
- Message/Instructions: "${homework.message}"
- Deadline: ${homework.deadlineDate || 'None'}
- Attached Resource: ${homework.attachments?.map(a => a.name).join(', ') || homework.attachment?.name || (homework.imageUrl ? 'Image Worksheet' : 'None')}

TARGET LANGUAGE: ${langLabel}.
Write your entire answer in natural, polite ${langLabel} (everyday spoken language easily understood by an Indian parent).

Output ONLY valid JSON with this exact schema:
{
  "summary": "2-3 simple sentences summarizing what is given in the message and attached PDF/image in plain words",
  "explanation": "Clear explanation of the homework and worksheet contents in plain words",
  "topic": "The main topic or lesson name",
  "task": "The specific exercise or questions the student needs to complete",
  "resource": "What the attached worksheet or notice is for",
  "keyPoints": [
    "📌 Topic: ...",
    "📝 Task: ...",
    "📎 Attached Resource: ..."
  ]
}`;

    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: "application/json"
      }
    };

    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.5-flash',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-latest'
    ];

    let aiResult = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.summary || parsed.explanation) {
              aiResult = {
                summary: parsed.summary || parsed.explanation,
                explanation: parsed.explanation || parsed.summary,
                topic: parsed.topic || homework.subject || 'General',
                task: parsed.task || homework.message,
                resource: parsed.resource || (homework.attachment?.name || 'Attached Resource'),
                keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 
                  ? parsed.keyPoints 
                  : [
                      `📌 Topic: ${parsed.topic || homework.subject || 'General'}`,
                      `📝 Task: ${parsed.task || homework.message}`,
                      `📎 Resource: ${parsed.resource || 'Worksheet'}`
                    ]
              };
              break;
            }
          }
        }
      } catch (err) {}
    }

    if (aiResult) {
      return NextResponse.json({
        success: true,
        source: 'gemini_ai',
        language: lang,
        data: aiResult
      });
    }

    // Fallback
    const fallback = generateSmartFallback(homework, lang);
    return NextResponse.json({
      success: true,
      source: 'smart_engine',
      language: lang,
      data: fallback
    });

  } catch (error) {
    console.error('Homework explain error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
