import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  getSharedHomework, 
  setSharedHomework,
  addSharedHomework, 
  deleteSharedHomework, 
  clearAllSharedHomework, 
  resetDemoHomework,
  INITIAL_DEFAULT_POSTS
} from '@/lib/homeworkStore';
import { SAMPLE_WORKSHEET_PDF } from '@/lib/pdfUtils';

export const dynamic = 'force-dynamic';

// Helper to format a Supabase homework record into standard frontend shape
function formatSupabaseRow(h) {
  let atts = [];
  if (Array.isArray(h.attachment?.all) && h.attachment.all.length > 0) {
    atts = h.attachment.all;
  } else if (Array.isArray(h.attachments) && h.attachments.length > 0) {
    atts = h.attachments;
  } else if (h.attachment && typeof h.attachment === 'object') {
    atts = [h.attachment];
  }

  // Ensure PDF has a valid preview URL (fallback to worksheet PDF if url is null/empty)
  atts = atts.map(att => {
    if (att && att.type === 'pdf' && !att.url) {
      return { ...att, url: SAMPLE_WORKSHEET_PDF };
    }
    return att;
  });

  const primaryAtt = atts[0] || (h.attachment ? {
    ...h.attachment,
    url: (h.attachment.type === 'pdf' && !h.attachment.url) ? SAMPLE_WORKSHEET_PDF : h.attachment.url
  } : null);

  return {
    id: String(h.id),
    className: h.class_name || h.className || 'Class 8-A',
    subject: h.subject || 'General',
    teacherName: h.teacher_name || h.teacherName || 'Teacher',
    teacherRole: h.teacher_role || h.teacherRole || 'class_teacher',
    message: h.message || '',
    link: h.link || '',
    attachments: atts,
    attachment: primaryAtt,
    imageUrl: h.image_url || h.imageUrl || (atts.find(a => a.type === 'image')?.url) || null,
    postedAt: h.posted_at || h.postedAt || new Date().toLocaleString(),
    hasDeadline: h.has_deadline !== undefined ? Boolean(h.has_deadline) : Boolean(h.hasDeadline),
    deadlineDate: h.deadline_date || h.deadlineDate || null
  };
}

// GET: Fetch homework posts (Supabase as primary source of truth, disk as offline backup)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('className');

  try {
    let query = supabase.from('homework').select('*').order('created_at', { ascending: false });
    if (className && className !== 'all' && className !== 'All Classes') {
      query = query.or(`class_name.eq.${className},class_name.eq.All Classes,class_name.is.null`);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      const formatted = data.map(formatSupabaseRow);
      // Keep local disk store fresh as an offline cache
      try {
        setSharedHomework(formatted);
      } catch (e) {}

      return NextResponse.json({ 
        success: true, 
        data: formatted, 
        source: 'supabase' 
      });
    }

    if (error) {
      console.warn('Supabase homework GET error, using disk backup:', error.message);
    }
  } catch (err) {
    console.warn('Supabase offline or unreachable, serving disk backup:', err.message);
  }

  // Graceful fallback to local disk store if Supabase is offline/unreachable
  const localDiskPosts = getSharedHomework(className);
  return NextResponse.json({ 
    success: true, 
    data: localDiskPosts, 
    source: 'disk_store' 
  });
}

// POST: Create, delete, or reset homework posts
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. CREATE HOMEWORK
    if (action === 'create' || action === 'create_homework') {
      const post = body.post || body;
      const attachmentsList = Array.isArray(post.attachments) && post.attachments.length > 0
        ? post.attachments
        : (post.attachment ? [post.attachment] : []);

      const newPost = {
        id: post.id || `hw_${Date.now()}`,
        className: post.className || 'Class 8-A',
        subject: post.subject || 'General',
        teacherName: post.teacherName || 'Teacher',
        teacherRole: post.teacherRole || 'class_teacher',
        message: post.message || '',
        link: post.link || '',
        attachments: attachmentsList.slice(0, 5),
        attachment: attachmentsList[0] || null,
        imageUrl: attachmentsList.find(a => a.type === 'image')?.url || post.imageUrl || null,
        postedAt: post.postedAt || new Date().toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        hasDeadline: Boolean(post.hasDeadline),
        deadlineDate: post.deadlineDate || null
      };

      // Bundle all attachments inside the attachment JSONB column
      const attachmentPayload = attachmentsList.length > 0 
        ? { ...(attachmentsList[0] || {}), all: attachmentsList }
        : null;

      const rowToInsert = {
        id: newPost.id,
        class_name: newPost.className,
        subject: newPost.subject,
        teacher_name: newPost.teacherName,
        teacher_role: newPost.teacherRole,
        message: newPost.message,
        link: newPost.link,
        attachment: attachmentPayload,
        image_url: newPost.imageUrl,
        posted_at: newPost.postedAt,
        has_deadline: newPost.hasDeadline,
        deadline_date: newPost.deadlineDate
      };

      // 1.1 Persist to Supabase (AWAITED - no silent unawaited drops!)
      let supabaseSuccess = false;
      try {
        const { error: insertError } = await supabase
          .from('homework')
          .insert(rowToInsert);

        if (insertError) {
          console.error('Supabase homework insert failed:', insertError.message);
        } else {
          supabaseSuccess = true;
        }
      } catch (sbErr) {
        console.error('Supabase insert network exception:', sbErr.message);
      }

      // 1.2 Always mirror to local disk backup
      const updatedList = addSharedHomework(newPost);

      return NextResponse.json({ 
        success: true, 
        post: newPost, 
        data: updatedList, 
        storage: supabaseSuccess ? 'supabase' : 'disk_store',
        message: 'Homework posted successfully!' 
      });
    }

    // 2. DELETE HOMEWORK
    if (action === 'delete' || action === 'delete_homework') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Missing homework id' }, { status: 400 });
      }

      // 2.1 Await Supabase delete
      try {
        const { error: delError } = await supabase
          .from('homework')
          .delete()
          .eq('id', id);

        if (delError) {
          console.error('Supabase delete error:', delError.message);
        }
      } catch (delErr) {
        console.error('Supabase delete exception:', delErr.message);
      }

      // 2.2 Delete from local disk backup
      const updatedList = deleteSharedHomework(id);

      return NextResponse.json({ 
        success: true, 
        data: updatedList, 
        message: 'Homework removed.' 
      });
    }

    // 3. CLEAR ALL HOMEWORK
    if (action === 'clear_all') {
      try {
        await supabase.from('homework').delete().neq('id', '__never_match__');
      } catch (e) {}

      const emptyList = clearAllSharedHomework();
      return NextResponse.json({ success: true, count: 0, data: emptyList });
    }

    // 4. RESTORE DEMO HOMEWORK
    if (action === 'restore_demo') {
      try {
        // Clear and reinsert demo posts in Supabase
        await supabase.from('homework').delete().neq('id', '__never_match__');
        for (const demoPost of INITIAL_DEFAULT_POSTS) {
          await supabase.from('homework').insert({
            id: demoPost.id,
            class_name: demoPost.className,
            subject: demoPost.subject,
            teacher_name: demoPost.teacherName,
            teacher_role: demoPost.teacherRole,
            message: demoPost.message,
            link: demoPost.link,
            attachment: demoPost.attachment ? { ...demoPost.attachment, all: [demoPost.attachment] } : null,
            image_url: demoPost.imageUrl,
            posted_at: demoPost.postedAt,
            has_deadline: demoPost.hasDeadline,
            deadline_date: demoPost.deadlineDate
          });
        }
      } catch (e) {
        console.error('Supabase restore demo error:', e.message);
      }

      const demoList = resetDemoHomework();
      return NextResponse.json({ success: true, count: demoList.length, data: demoList });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
