import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  getSharedHomework, 
  addSharedHomework, 
  deleteSharedHomework, 
  clearAllSharedHomework, 
  resetDemoHomework 
} from '@/lib/homeworkStore';

// GET: Fetch homework posts (with optional className filter)
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
      const formatted = data.map(h => ({
        id: String(h.id),
        className: h.class_name || h.className || 'Class 8-A',
        subject: h.subject,
        teacherName: h.teacher_name || h.teacherName,
        teacherRole: h.teacher_role || h.teacherRole,
        message: h.message,
        link: h.link || '',
        attachment: h.attachment || null,
        imageUrl: h.image_url || h.imageUrl || null,
        postedAt: h.posted_at || h.postedAt || new Date().toLocaleString(),
        hasDeadline: h.has_deadline !== undefined ? Boolean(h.has_deadline) : Boolean(h.hasDeadline),
        deadlineDate: h.deadline_date || h.deadlineDate || null
      }));
      return NextResponse.json({ success: true, data: formatted, source: 'supabase' });
    }
  } catch (err) {
    console.warn('Supabase homework fetch error, falling back to shared memory:', err.message);
  }

  return NextResponse.json({ 
    success: true, 
    data: getSharedHomework(className), 
    source: 'memory' 
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
      const newPost = {
        id: post.id || `hw_${Date.now()}`,
        className: post.className || 'Class 8-A',
        subject: post.subject || 'General',
        teacherName: post.teacherName || 'Teacher',
        teacherRole: post.teacherRole || 'class_teacher',
        message: post.message || '',
        link: post.link || '',
        attachment: post.attachment || null,
        imageUrl: post.imageUrl || null,
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

      // 1.1 Persist to Supabase if table is available
      try {
        await supabase.from('homework').insert({
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
        });
      } catch (err) {
        console.warn('Supabase insert homework error:', err.message);
      }

      // 1.2 Always add to server shared memory store
      const updatedList = addSharedHomework(newPost);

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

      try {
        await supabase.from('homework').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete homework error:', err.message);
      }

      const updatedList = deleteSharedHomework(id);
      return NextResponse.json({ success: true, data: updatedList, message: 'Homework removed.' });
    }

    // 3. Clean Slate: Clear all homework
    if (action === 'clear_all') {
      try {
        await supabase.from('homework').delete().neq('id', '__never_match__');
      } catch (e) {}

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

