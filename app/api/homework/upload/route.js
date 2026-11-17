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

    const originalName = file.name || 'attachment';
    const isPdf = file.type === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
    const type = isPdf ? 'pdf' : 'image';
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${Date.now()}_${cleanName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const formattedSize = formatFileSize(file.size);

    // 1. Try uploading to Supabase Storage Bucket ('homework-attachments') with 1.5s timeout
    try {
      const uploadWithTimeout = Promise.race([
        (async () => {
          try {
            await supabase.storage.createBucket('homework-attachments', { public: true });
          } catch (e) {}

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('homework-attachments')
            .upload(storagePath, fileBuffer, {
              contentType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
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
        new Promise((_, reject) => setTimeout(() => reject(new Error('Bucket upload timed out')), 1500))
      ]);

      const result = await uploadWithTimeout;
      if (result) {
        return NextResponse.json(result);
      }
    } catch (sbErr) {
      // Supabase bucket upload timed out or failed -> fall through to immediate data URI fallback
    }

    // 2. Safe Fallback: base64 data URI if bucket network is unreachable
    const base64Str = `data:${file.type || (isPdf ? 'application/pdf' : 'image/jpeg')};base64,${fileBuffer.toString('base64')}`;
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

