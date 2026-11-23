import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 50MB limit. Please upload a smaller file or compressed document.' }, { status: 413 });
    }

    const originalName = file.name || 'attachment';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    const WORD_EXTS = ['doc', 'docx'];
    const EXCEL_EXTS = ['xls', 'xlsx', 'csv'];
    const PPT_EXTS = ['ppt', 'pptx'];
    const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    const isPdf = file.type === 'application/pdf' || ext === 'pdf';
    const isWord = WORD_EXTS.includes(ext) || file.type?.includes('word') || file.type?.includes('officedocument.wordprocessingml');
    const isExcel = EXCEL_EXTS.includes(ext) || file.type?.includes('excel') || file.type?.includes('spreadsheetml') || ext === 'csv' || file.type === 'text/csv';
    const isPpt = PPT_EXTS.includes(ext) || file.type?.includes('powerpoint') || file.type?.includes('presentationml');
    const isImage = file.type?.startsWith('image/') || IMAGE_EXTS.includes(ext);

    // Security Validation: PDF, Word, Excel, PowerPoint, and Standard Images allowed
    if (!isPdf && !isWord && !isExcel && !isPpt && !isImage) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Allowed formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx, .csv), PowerPoint (.ppt, .pptx), and Images (JPG, PNG, WebP).' 
      }, { status: 400 });
    }

    let type = 'file';
    if (isPdf) type = 'pdf';
    else if (isWord) type = 'word';
    else if (isExcel) type = 'excel';
    else if (isPpt) type = 'ppt';
    else if (isImage) type = 'image';

    let contentType = file.type;
    if (!contentType) {
      if (isPdf) contentType = 'application/pdf';
      else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'doc') contentType = 'application/msword';
      else if (ext === 'xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === 'xls') contentType = 'application/vnd.ms-excel';
      else if (ext === 'csv') contentType = 'text/csv';
      else if (ext === 'pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === 'ppt') contentType = 'application/vnd.ms-powerpoint';
      else if (isImage) contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      else contentType = 'application/octet-stream';
    }

    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-60);
    const storagePath = `${Date.now()}_${cleanName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const formattedSize = formatFileSize(file.size);

    // 1. Upload to Supabase Storage Bucket ('homework-attachments') with realistic 20s timeout
    try {
      const uploadWithTimeout = Promise.race([
        (async () => {
          try {
            await supabase.storage.createBucket('homework-attachments', { public: true });
          } catch (e) {}

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('homework-attachments')
            .upload(storagePath, fileBuffer, {
              contentType,
              upsert: true
            });

          if (!uploadError && uploadData) {
            const { data: publicData } = supabase.storage
              .from('homework-attachments')
              .getPublicUrl(storagePath);

            if (publicData?.publicUrl) {
              return {
                success: true,
                storage: 'supabase_bucket',
                url: publicData.publicUrl,
                name: originalName,
                size: formattedSize,
                type
              };
            }
          }
          return null;
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Bucket upload timed out')), 20000))
      ]);

      const result = await uploadWithTimeout;
      if (result) {
        return NextResponse.json(result);
      }
    } catch (sbErr) {
      // Supabase bucket upload timed out or failed
    }

    // 2. Prevent massive base64 bloat: If file is larger than 1MB and bucket failed, return error
    if (file.size > 1024 * 1024) {
      return NextResponse.json({
        error: 'Cloud storage unavailable for large attachments. Please ensure Supabase storage bucket "homework-attachments" is configured.'
      }, { status: 503 });
    }

    // 3. Safe fallback: only for tiny files / lightweight documents (< 1MB)
    const base64Str = `data:${contentType};base64,${fileBuffer.toString('base64')}`;
    return NextResponse.json({
      success: true,
      storage: 'base64_fallback',
      url: base64Str,
      name: originalName,
      size: formattedSize,
      type
    });
  } catch (error) {
    console.error('File upload route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

