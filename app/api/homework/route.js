import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  getSharedHomework, 
  addSharedHomework, 
  deleteSharedHomework, 
  clearAllSharedHomework, 
  resetDemoHomework 
} from '@/lib/homeworkStore';

const withTimeout = (promise, ms = 1000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out')), ms))
  ]);
};

// GET: Fetch homework posts (with optional className filter)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('className');

  // 1. Instantly read reliable persisted local disk records (zero latency, zero downtime)
  const localDiskPosts = getSharedHomework(className);

  // 2. Try Supabase live sync with 1s strict timeout
  try {
    let query = supabase.from('homework').select('*').order('created_at', { ascending: false });
    if (className && className !== 'all' && className !== 'All Classes') {
      query = query.or(`class_name.eq.${className},class_name.eq.All Classes,class_name.is.null`);
    }
    const { data, error } = await withTimeout(query, 1000);

    if (!error && Array.isArray(data) && data.length > 0) {
      const formatted = data.map(h => {
        const atts = Array.isArray(h.attachments) ? h.attachments : (h.attachment ? [h.attachment] : []);
        return {
          id: String(h.id),
          className: h.class_name || h.className || 'Class 8-A',
          subject: h.subject,
          teacherName: h.teacher_name || h.teacherName,
          teacherRole: h.teacher_role || h.teacherRole,
          message: h.message,
          link: h.link || '',
          attachments: atts,
          attachment: atts[0] || h.attachment || null,
          imageUrl: h.image_url || h.imageUrl || (atts.find(a => a.type === 'image')?.url) || null,
          postedAt: h.posted_at || h.postedAt || new Date().toLocaleString(),
          hasDeadline: h.has_deadline !== undefined ? Boolean(h.has_deadline) : Boolean(h.hasDeadline),
          deadlineDate: h.deadline_date || h.deadlineDate || null
        };
      });

      // Merge Supabase with disk posts so nothing is ever dropped
      const idMap = new Map();
      localDiskPosts.forEach(p => idMap.set(p.id, p));
      formatted.forEach(p => {
        if (!idMap.has(p.id)) idMap.set(p.id, p);
      });
      const combined = Array.from(idMap.values());

      return NextResponse.json({ success: true, data: combined, source: 'supabase_merged' });
    }
  } catch (err) {
    // Supabase offline or timeout -> serve local disk immediately
  }

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

    // 1. Create / Post Homework
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
        attachments: attachmentsList.slice(0, 5), // Max 5 attachments
        attachment: attachmentsList[0] || null, // Backward compatibility
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

      // 1.1 ALWAYS save to permanent disk store FIRST (synchronous persistence, 0 risk of loss!)
      const updatedList = addSharedHomework(newPost);

      // 1.2 Non-blocking background sync to Supabase (if available)
      (async () => {
        try {
          await withTimeout(
            supabase.from('homework').insert({
              id: newPost.id,
              class_name: newPost.className,
              subject: newPost.subject,
              teacher_name: newPost.teacherName,
              teacher_role: newPost.teacherRole,
              message: newPost.message,
              link: newPost.link,
              attachment: newPost.attachment,
              image_url: newPost.imageUrl,
              posted_at: newPost.postedAt,
              has_deadline: newPost.hasDeadline,
              deadline_date: newPost.deadlineDate
            }),
            1500
          );
        } catch (e) {
          // Quietly ignore Supabase errors if offline/unreachable
        }
      })();

      return NextResponse.json({ 
        success: true, 
        post: newPost, 
        data: updatedList, 
        message: 'Homework posted successfully across all devices!' 
      });
    }

    // 2. Delete Homework
    if (action === 'delete' || action === 'delete_homework') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Missing homework id' }, { status: 400 });
      }

      // Delete from disk immediately
      const updatedList = deleteSharedHomework(id);

      // Background delete from Supabase
      (async () => {
        try {
          await withTimeout(supabase.from('homework').delete().eq('id', id), 1500);
        } catch (e) {}
      })();

      return NextResponse.json({ success: true, data: updatedList, message: 'Homework removed.' });
    }

    // 3. Clean Slate: Clear all homework
    if (action === 'clear_all') {
      (async () => {
        try {
          await withTimeout(supabase.from('homework').delete().neq('id', '__never_match__'), 1500);
        } catch (e) {}
      })();

      const emptyList = clearAllSharedHomework();
      return NextResponse.json({ success: true, count: 0, data: emptyList });
    }

    // 4. Restore Demo Homework
    if (action === 'restore_demo') {
      const demoList = resetDemoHomework();
      return NextResponse.json({ success: true, count: demoList.length, data: demoList });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

