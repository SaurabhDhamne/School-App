import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabaseClient';
import { getHomeworkAiExplanation, saveHomeworkAiExplanation } from '@/lib/homeworkStore';

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

// Helper to clean up raw ugly camera/scanner filenames into clean titles
function sanitizeResourceName(rawName, topic, subject) {
  if (!rawName) return `${topic || subject} Practice Worksheet`;
  let clean = rawName.trim();
  // Remove file extension if present (.png, .jpg, .pdf, etc.)
  clean = clean.replace(/\.[a-zA-Z0-9]{2,5}$/, '');
  // Clean separators
  clean = clean.replace(/[_\-]+/g, ' ').trim();
  // If filename is camera/scanner/stock/generic, replace with topic worksheet
  if (/^(IMG|WhatsApp|scan|Photo|document|attachment|[0-9\s]+|Playful|Elementary|Maths|Math|Worksheet)/i.test(clean)) {
    return `${topic || subject} Practice Worksheet`;
  }
  return clean || `${topic || subject} Practice Worksheet`;
}

// Helper to extract topic, exercise, and resource details from homework text
function extractHomeworkDetails(homework) {
  const message = (homework.message || '').trim();
  const subject = homework.subject || 'General';
  const allAtts = Array.isArray(homework.attachments) && homework.attachments.length > 0
    ? homework.attachments
    : (homework.attachment ? [homework.attachment] : []);
  const hasAttachment = allAtts.length > 0 || !!homework.imageUrl;
  
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
  const exMatch = message.match(/(exercise\s+[0-9\.]+(?:\s*\([^\)]+\))?|chapter\s+[0-9]+|questions?\s+[0-9\s,to\-]+|worksheet\s+[0-9]+)/i);
  if (exMatch) {
    task = exMatch[1].trim();
  } else {
    task = message.length > 60 ? message.substring(0, 60) + '...' : message;
  }

  const rawName = allAtts.map(a => a.name).filter(Boolean)[0] || '';
  const attachmentName = sanitizeResourceName(rawName, topic, subject);

  return { subject, message, topic, task, hasAttachment, attachmentName };
}

// Smart Explanation Engine in 4 languages (English, Hindi, Marathi, Gujarati)
function generateSmartFallback(homework, lang = 'en') {
  const { subject, message, topic, task, hasAttachment } = extractHomeworkDetails(homework);
  const teacher = homework.teacherName || 'Teacher';

  if (lang === 'hi') {
    const summary = hasAttachment
      ? `यह गृहकार्य '${topic}' विषय पर है। विद्यार्थियों को ${task} पूरा करना है और साथ में दी गई अभ्यास वर्कशीट का अध्ययन करके कार्य नोटबुक में हल करना है।`
      : `यह गृहकार्य '${topic}' विषय पर है। शिक्षक (${teacher}) ने ${task} को अपनी नोटबुक में पूरा करने का निर्देश दिया है।`;

    return {
      contentTitle: `${topic} अभ्यास वर्कशीट`,
      summary,
      explanation: summary,
      topic: topic || subject,
      task: task || 'दिए गए प्रश्नों को हल करना',
      resource: hasAttachment ? `${topic || subject} अभ्यास सामग्री` : 'पाठ्यपुस्तक व नोटबुक',
      parentTip: 'सलाह: जांचें कि बच्चे ने सभी प्रश्न अपनी नोटबुक में हल किए हैं और लिखावट साफ़ है।',
      keyPoints: [
        `📌 विषय (Topic): ${topic || subject}`,
        `📝 मुख्य कार्य (Task): ${task}`,
        `💡 माता-पिता के लिए सुझाव: बच्चे से पूरा काम नोटबुक में लिखवाएं।`
      ]
    };
  }

  if (lang === 'mr') {
    const summary = hasAttachment
      ? `हा गृहपाठ '${topic}' या घटकावर आधारित आहे. यामध्ये ${task} सोडवायचे असून सोबत जोडलेल्या सराव वर्कशीटमधील अभ्यास वहीत पूर्ण करायचा आहे.`
      : `हा गृहपाठ '${topic}' या घटकावर आधारित आहे. शिक्षकांनी (${teacher}) ${task} मधील अभ्यास वहीत पूर्ण करण्यास सांगितले आहे.`;

    return {
      contentTitle: `${topic} सराव वर्कशीट`,
      summary,
      explanation: summary,
      topic: topic || subject,
      task: task || 'दिलेले प्रश्न सोडवणे',
      resource: hasAttachment ? `${topic || subject} सराव साहित्य` : 'पाठ्यपुस्तक व वही',
      parentTip: 'पालकांसाठी टीप: मुलाने वहीत सर्व प्रश्नांची उत्तरे खाडाखोड न करता व्यवस्थित लिहिली आहेत का ते तपासा.',
      keyPoints: [
        `📌 घटक (Topic): ${topic || subject}`,
        `📝 मुख्य काम (Task): ${task}`,
        `💡 पालकांसाठी मार्गदर्शन: मुलाकडून पायरी-पायरीने काम पूर्ण करून घ्या.`
      ]
    };
  }

  if (lang === 'gu') {
    const summary = hasAttachment
      ? `આ હોમવર્ક '${topic}' પ્રકરણ પર છે. તેમાં ${task} ના પ્રશ્નો અને સાથે જોડેલ વર્કશીટમાંથી દાખલા નોટબુકમાં ગણવાના રહેશે.`
      : `આ હોમવર્ક '${topic}' પ્રકરણ પર છે. શિક્ષકે (${teacher}) ${task} નોટબુકમાં પૂર્ણ કરવાની સૂચના આપી છે.`;

    return {
      contentTitle: `${topic} વર્કશીટ`,
      summary,
      explanation: summary,
      topic: topic || subject,
      task: task || 'આપેલ પ્રશ્નો ગણવા',
      resource: hasAttachment ? `${topic || subject} અભ્યાસ સામગ્રી` : 'પાઠ્યપુસ્તક અને નોટબુક',
      parentTip: 'વાલીઓ માટે સલાહ: ખાતરી કરો કે બાળક બધા પ્રશ્નોના જવાબો પોતાની નોટબુકમાં સ્પષ્ટ રીતે લખે.',
      keyPoints: [
        `📌 વિષય (Topic): ${topic || subject}`,
        `📝 મુખ્ય કાર્ય (Task): ${task}`,
        `💡 વાલી માર્ગદર્શન: હોમવર્ક પૂર્ણ થયા પછી નોટબુક ચકાસો.`
      ]
    };
  }

  // Default: English
  const summary = hasAttachment
    ? `This homework covers '${topic}'. Students are assigned to ${task}, and complete the attached practice worksheet in their subject notebook.`
    : `This homework covers '${topic}'. The teacher (${teacher}) has assigned ${task} to be completed in the subject notebook.`;

  return {
    contentTitle: `${topic} Practice Worksheet`,
    summary,
    explanation: summary,
    topic: topic || subject,
    task: task || 'Complete the assigned work',
    resource: hasAttachment ? `${topic || subject} Practice Worksheet` : 'Textbook & Notebook',
    parentTip: 'Parent Tip: Ensure your child writes down the answers step-by-step in their subject notebook.',
    keyPoints: [
      `📌 Topic: ${topic || subject}`,
      `📝 Task: ${task}`,
      `💡 Parent Guidance: Verify completed answers in child's notebook.`
    ]
  };
}

// Helper to fetch and extract base64 inlineData for Gemini Vision / Document understanding
async function extractAttachmentInlineData(homework) {
  try {
    const allAtts = Array.isArray(homework.attachments) && homework.attachments.length > 0
      ? homework.attachments
      : (homework.attachment ? [homework.attachment] : []);

    let targetUrl = null;
    let targetMime = null;
    let targetName = null;

    if (allAtts.length > 0) {
      const att = allAtts[0];
      targetUrl = att.url;
      targetName = att.name || '';
      targetMime = att.type || (att.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    } else if (homework.imageUrl) {
      targetUrl = homework.imageUrl;
      targetName = 'Homework Photo';
      targetMime = 'image/jpeg';
    }

    if (!targetUrl || typeof targetUrl !== 'string') return null;

    // 1. If it's already a base64 data URI:
    if (targetUrl.startsWith('data:')) {
      const commaIdx = targetUrl.indexOf(',');
      if (commaIdx !== -1) {
        const header = targetUrl.substring(5, commaIdx);
        const mime = header.split(';')[0].trim().toLowerCase();
        const base64Data = targetUrl.substring(commaIdx + 1).replace(/[\r\n\s]/g, '');
        if (mime.startsWith('image/') || mime === 'application/pdf') {
          return {
            mimeType: mime,
            data: base64Data,
            targetName
          };
        }
      }
    }

    // 2. If it's a local relative file on disk (e.g. /uploads/...)
    if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
      try {
        const localPath = path.join(process.cwd(), 'public', targetUrl);
        if (fs.existsSync(localPath)) {
          const stats = fs.statSync(localPath);
          if (stats.size <= 20 * 1024 * 1024) {
            const buf = fs.readFileSync(localPath);
            const ext = path.extname(localPath).toLowerCase().replace('.', '');
            let mime = 'image/jpeg';
            if (ext === 'pdf') mime = 'application/pdf';
            else if (['png', 'webp', 'gif'].includes(ext)) mime = `image/${ext}`;
            return {
              mimeType: mime,
              data: buf.toString('base64'),
              targetName
            };
          }
        }
      } catch (e) {}
    }

    // 3. If it's an HTTPS URL (e.g. Supabase storage URL) - with strict SSRF defense:
    if (targetUrl.startsWith('https://')) {
      let parsedUrl;
      try {
        parsedUrl = new URL(targetUrl);
      } catch (e) {
        return null;
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      // Block local/private/cloud metadata hostnames (SSRF prevention)
      const isBlocked = 
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        hostname.includes('metadata') ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        (hostname.startsWith('172.') && parseInt(hostname.split('.')[1], 10) >= 16 && parseInt(hostname.split('.')[1], 10) <= 31);

      if (isBlocked) {
        console.warn('[SSRF Defense] Blocked non-public URL in explain route:', hostname);
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const fileRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { 'Accept': '*/*' }
      });
      clearTimeout(timeoutId);

      if (!fileRes.ok) return null;

      const headerType = fileRes.headers.get('content-type') || '';
      let cleanMime = headerType.split(';')[0].trim().toLowerCase();

      if (!cleanMime.startsWith('image/') && cleanMime !== 'application/pdf') {
        if (targetName.toLowerCase().endsWith('.pdf') || targetUrl.toLowerCase().includes('.pdf')) {
          cleanMime = 'application/pdf';
        } else if (targetName.toLowerCase().match(/\.(png|webp|gif|jpe?g)$/)) {
          cleanMime = `image/${RegExp.$1 === 'jpg' ? 'jpeg' : RegExp.$1}`;
        } else {
          // Non-visual document (Word, Excel, PowerPoint) - do not attach inline image bytes
          return null;
        }
      }

      const arrayBuffer = await fileRes.arrayBuffer();
      // Cap at 20MB inline for Gemini API
      if (arrayBuffer.byteLength > 20 * 1024 * 1024) {
        return null;
      }

      const base64String = Buffer.from(arrayBuffer).toString('base64');
      return {
        mimeType: cleanMime,
        data: base64String,
        targetName
      };
    }

    return null;
  } catch (err) {
    console.warn('extractAttachmentInlineData note:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { homework, targetLanguage = 'en', forceRefresh = false } = body;

    if (!homework || !homework.message) {
      return NextResponse.json({ error: 'Homework data is required' }, { status: 400 });
    }

    const lang = targetLanguage || 'en';
    const langLabel = LANGUAGE_LABELS[lang] || 'English';
    const hwId = homework.id;

    // 1. Check persistent Cloud DB / Local Disk cache first (Instant 0ms, 0 tokens)
    if (!forceRefresh && hwId) {
      // 1.1 Local disk cache check
      const diskCached = getHomeworkAiExplanation(hwId, lang);
      if (diskCached && (diskCached.summary || diskCached.explanation)) {
        logger.info('AI_EXPLAIN', `⚡ Served from local disk cache for HW ${hwId} (${langLabel})`, { hwId, lang });
        return NextResponse.json({
          success: true,
          source: 'database_cache',
          fromCache: true,
          status: 200,
          hasVisualAttachment: !!diskCached.contentTitle,
          language: lang,
          data: diskCached
        });
      }

      // 1.2 Supabase Cloud DB cache check
      try {
        const { data: sbRow } = await supabase
          .from('homework')
          .select('attachment')
          .eq('id', hwId)
          .maybeSingle();

        const sbCached = sbRow?.attachment?.aiExplanations?.[lang];
        if (sbCached && (sbCached.summary || sbCached.explanation)) {
          // Sync to local disk for fast subsequent reads
          saveHomeworkAiExplanation(hwId, lang, sbCached);
          logger.info('AI_EXPLAIN', `⚡ Served from Supabase Cloud DB cache for HW ${hwId} (${langLabel})`, { hwId, lang });
          return NextResponse.json({
            success: true,
            source: 'database_cache',
            fromCache: true,
            status: 200,
            hasVisualAttachment: !!sbCached.contentTitle,
            language: lang,
            data: sbCached
          });
        }
      } catch (sbErr) {
        // Fall through to AI generation
      }
    }

    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      const fallback = generateSmartFallback(homework, lang);
      logger.info('AI_EXPLAIN', `Explanation generated using Smart Rule Engine (${langLabel})`, { hwId: homework.id, lang });
      return NextResponse.json({
        success: true,
        source: 'smart_engine',
        fromCache: false,
        language: lang,
        data: fallback
      });
    }

    // Attempt multimodal attachment extraction (PDF or image)
    const attachmentData = await extractAttachmentInlineData(homework);
    const hasVisualAttachment = !!attachmentData?.data;

    const prompt = `You are an empathetic, highly professional school academic assistant for Indian parents.
Your task is to review the teacher's notice and ${hasVisualAttachment ? 'examine the actual document/worksheet/photo content attached' : 'the instructions'} and provide a clear, easy-to-understand summary and study plan in ${langLabel}.

CRITICAL PARENT SAFETY & CLARITY GUIDELINES:
1. Examine the actual visual content of the attached document/worksheet: identify what topic, chapter, exercise, questions, or diagrams are shown.
2. STRICT PROHIBITION ON FILENAMES: NEVER mention or quote any filename, scanner name, or file extension (e.g. NEVER write "Playful Elementary Maths Worksheet.png", "IMG_...", "WhatsApp Image...", ".pdf", ".jpg", etc.). Parents must ONLY see real educational concept descriptions!
3. Instead, produce a descriptive "contentTitle" that tells parents what this document actually is based on its visual content (e.g. "Count and Write the Number Practice Worksheet", "Linear Equations Practice Worksheet", "Plant Cell Diagram & Questions").
4. Explain clearly what concept is being studied and what specific task or notebook work the child must finish.
5. DO NOT solve the problems or give away answers! Summarize the task so parents can supervise.
6. Provide an actionable "parentTip" helping the parent check if the child has understood and completed the work.
7. TARGET LANGUAGE: ${langLabel}.
Write your entire response in polite, natural ${langLabel} (everyday vocabulary easily understood by parents).

Homework Details:
- Subject: ${homework.subject || 'General'}
- Teacher: ${homework.teacherName || 'Teacher'}
- Teacher's Instructions: "${homework.message}"
- Deadline: ${homework.deadlineDate || 'None'}
${hasVisualAttachment ? '- Attached File: A visual worksheet/document is attached for your direct analysis.' : ''}

Output ONLY valid JSON with this exact schema:
{
  "contentTitle": "Descriptive title of the worksheet/document in ${langLabel}",
  "summary": "2-3 simple sentences summarizing what is given in the notice and attached document in plain ${langLabel}",
  "explanation": "Clear explanation of the concepts and what the student is expected to do in ${langLabel}",
  "topic": "The main lesson or topic name",
  "task": "The specific exercise or questions the student needs to complete",
  "parentTip": "A practical suggestion for parents to supervise the homework in ${langLabel}",
  "keyPoints": [
    "📌 Topic: ...",
    "📝 Task: ...",
    "💡 Parent Tip: ..."
  ]
}`;

    const parts = [{ text: prompt }];
    if (hasVisualAttachment) {
      parts.push({
        inlineData: {
          mimeType: attachmentData.mimeType,
          data: attachmentData.data
        }
      });
    }

    const requestPayload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    };

    // Active Gemini models with multimodal vision support
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.1-pro-preview',
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-pro-latest'
    ];

    let aiResult = null;
    let modelUsed = null;
    const attempts = [];

    console.log(`[AI_EXPLAIN] Request received for HW ${homework.id || 'N/A'} (lang: ${langLabel}, visualAttachment: ${hasVisualAttachment})`);

    for (const model of candidateModels) {
      try {
        console.log(`[AI_EXPLAIN] 🚀 Calling Gemini API with model: ${model}...`);
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
              const defaultFallback = generateSmartFallback(homework, lang);
              aiResult = {
                contentTitle: parsed.contentTitle || defaultFallback.contentTitle,
                summary: parsed.summary || parsed.explanation,
                explanation: parsed.explanation || parsed.summary,
                topic: parsed.topic || homework.subject || 'General',
                task: parsed.task || homework.message,
                parentTip: parsed.parentTip || defaultFallback.parentTip,
                resource: parsed.contentTitle || defaultFallback.resource,
                keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 
                  ? parsed.keyPoints 
                  : [
                      `📌 Topic: ${parsed.topic || homework.subject || 'General'}`,
                      `📝 Task: ${parsed.task || homework.message}`,
                      `💡 Parent Tip: ${parsed.parentTip || defaultFallback.parentTip}`
                    ]
              };
              modelUsed = model;
              attempts.push({ model, status: 200, success: true });
              console.log(`[AI_EXPLAIN] ✅ 200 OK SUCCESS! Model: ${model} generated content.`);
              logger.info('AI_EXPLAIN', `✓ Model ${model} returned HTTP 200 OK`, { model, hwId: homework.id, lang });
              break;
            }
          }
        } else {
          const errText = await res.text().catch(() => '');
          const errSnippet = errText.substring(0, 200);
          console.warn(`[AI_EXPLAIN] ❌ Model ${model} returned HTTP ${res.status}:`, errSnippet);
          logger.warn('AI_EXPLAIN', `Model ${model} returned HTTP ${res.status}`, {
            status: res.status,
            err: errSnippet
          });
          attempts.push({ model, status: res.status, error: errSnippet });
        }
      } catch (err) {
        console.warn(`[AI_EXPLAIN] ❌ Network error for model ${model}:`, err.message);
        attempts.push({ model, status: 0, error: err.message });
      }
    }

    if (aiResult) {
      // 2. Persist to Disk Cache & Cloud Database so every other parent gets it instantly
      if (hwId) {
        saveHomeworkAiExplanation(hwId, lang, aiResult);

        // Async save to Supabase Cloud DB
        (async () => {
          try {
            const { data: currentHw } = await supabase
              .from('homework')
              .select('attachment')
              .eq('id', hwId)
              .maybeSingle();

            const existingAtt = (currentHw?.attachment && typeof currentHw.attachment === 'object') ? currentHw.attachment : {};
            const existingAi = existingAtt.aiExplanations || {};
            existingAi[lang] = aiResult;

            await supabase
              .from('homework')
              .update({
                attachment: {
                  ...existingAtt,
                  aiExplanations: existingAi
                }
              })
              .eq('id', hwId);
            logger.info('AI_EXPLAIN', `✓ Explanation cached in Supabase Cloud DB for HW ${hwId} (${langLabel})`, { hwId, lang });
          } catch (sbSaveErr) {
            console.warn('Could not cache AI explanation to Supabase:', sbSaveErr.message);
          }
        })();
      }

      return NextResponse.json({
        success: true,
        source: 'gemini_ai',
        fromCache: false,
        status: 200,
        modelUsed,
        hasVisualAttachment,
        language: lang,
        attempts,
        data: aiResult
      });
    }

    // Fallback
    console.warn(`[AI_EXPLAIN] ⚠️ All Gemini models busy or unavailable. Using Smart Rule Engine fallback.`);
    const fallback = generateSmartFallback(homework, lang);
    logger.warn('AI_EXPLAIN', `Gemini returned no candidates, used Smart Fallback Engine (${langLabel})`, { hwId: homework.id, lang, attemptsCount: attempts.length });
    return NextResponse.json({
      success: true,
      source: 'smart_engine',
      status: 200,
      modelUsed: 'smart_engine_fallback',
      hasVisualAttachment,
      language: lang,
      attempts,
      data: fallback
    });

  } catch (error) {
    console.error('Homework explain error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
