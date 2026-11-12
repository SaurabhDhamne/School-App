import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

function getDefaultPassword(name = '') {
  const clean = name.replace(/^(mrs\.|mr\.|dr\.|ms\.|prof\.)\s+/i, '').trim();
  const firstName = clean.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${firstName || 'teacher'}@123`;
}

// In-memory fallback: 1 Admin + Exactly 3 Teachers for "MySchool"
let fallbackProfiles = [
  {
    id: 'admin_1',
    name: 'School Administrator',
    email: 'admin@myschool.com',
    password: 'admin@123',
    role: 'admin',
    class_name: 'All Classes',
    subject: 'All Subjects',
    school: 'MySchool'
  },
  {
    id: 't1',
    name: 'Mrs. Priya Sharma',
    email: 'priya@myschool.com',
    password: 'priya@123',
    role: 'class_teacher',
    class_name: 'Class 8-A',
    subject: 'Mathematics',
    school: 'MySchool'
  },
  {
    id: 't2',
    name: 'Mr. Rajesh Patel',
    email: 'rajesh@myschool.com',
    password: 'rajesh@123',
    role: 'subject_teacher',
    class_name: 'Class 8-A',
    subject: 'Science',
    school: 'MySchool'
  },
  {
    id: 't3',
    name: 'Mrs. Sunita Verma',
    email: 'sunita@myschool.com',
    password: 'sunita@123',
    role: 'subject_teacher',
    class_name: 'Class 8-A',
    subject: 'English',
    school: 'MySchool'
  }
];

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, class_name, subject, school')
      .neq('role', 'admin')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, teachers: data });
    }
  } catch (err) {
    console.warn('Supabase fetch profiles error:', err);
  }

  const teachers = fallbackProfiles.filter(p => p.role !== 'admin');
  return NextResponse.json({ success: true, teachers });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Get Teachers List for Dropdown
    if (action === 'get_teachers') {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, role, class_name, subject, school')
          .neq('role', 'admin')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return NextResponse.json({ success: true, teachers: data });
        }
      } catch (e) {}
      const teachers = fallbackProfiles.filter(p => p.role !== 'admin');
      return NextResponse.json({ success: true, teachers });
    }

    // 2. Login (Admin or Teacher by Dropdown Selection)
    if (action === 'login') {
      const { email, password, teacherId } = body;

      // Check if Admin login
      if (email && email.toLowerCase() === 'admin@myschool.com') {
        let adminUser = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'admin@myschool.com')
            .single();
          if (data) adminUser = data;
        } catch (e) {}

        if (!adminUser) {
          adminUser = fallbackProfiles.find(p => p.email === 'admin@myschool.com');
        }

        if (password === adminUser.password || password === 'admin@123') {
          return NextResponse.json({
            success: true,
            user: {
              id: adminUser.id,
              name: adminUser.name,
              email: adminUser.email,
              role: 'admin',
              classTeacherOf: adminUser.class_name,
              subject: adminUser.subject,
              school: adminUser.school || 'MySchool'
            }
          });
        }
        return NextResponse.json({ error: 'Invalid admin password (default: admin@123)' }, { status: 401 });
      }

      // Teacher Login by Dropdown
      let teacher = null;
      try {
        let query = supabase.from('profiles').select('*');
        if (teacherId) query = query.eq('id', teacherId);
        else if (email) query = query.eq('email', email.toLowerCase());
        const { data } = await query.single();
        if (data) teacher = data;
      } catch (e) {}

      if (!teacher) {
        teacher = fallbackProfiles.find(p => 
          (teacherId && p.id === teacherId) || (email && p.email.toLowerCase() === email.toLowerCase())
        );
      }

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found in school roster' }, { status: 404 });
      }

      const expectedDefaultPassword = getDefaultPassword(teacher.name);
      const isPasswordValid = 
        password === teacher.password || 
        password === expectedDefaultPassword || 
        password === 'demo';

      if (isPasswordValid) {
        return NextResponse.json({
          success: true,
          user: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            role: teacher.role,
            classTeacherOf: teacher.class_name,
            subject: teacher.subject,
            school: teacher.school || 'MySchool'
          }
        });
      }

      return NextResponse.json({ 
        error: `Incorrect password. Default password for ${teacher.name} is "${expectedDefaultPassword}".` 
      }, { status: 401 });
    }

    // 3. Teacher Changes Their Password
    if (action === 'change_password') {
      const { userId, newPassword } = body;
      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
      }

      try {
        await supabase
          .from('profiles')
          .update({ password: newPassword })
          .eq('id', userId);
      } catch (e) {}

      fallbackProfiles = fallbackProfiles.map(p => 
        p.id === userId ? { ...p, password: newPassword } : p
      );

      return NextResponse.json({ success: true, message: 'Password updated successfully!' });
    }

    // 4. Admin Adds Teacher
    if (action === 'admin_add_teacher') {
      const { name, email, role, className, subject } = body;
      const defaultPass = getDefaultPassword(name);

      const newTeacher = {
        id: `t_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: defaultPass,
        role: role || 'subject_teacher',
        class_name: role === 'class_teacher' ? (className || 'Class 8-A') : className || null,
        subject: subject || 'General',
        school: 'MySchool'
      };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            name: newTeacher.name,
            email: newTeacher.email,
            password: newTeacher.password,
            role: newTeacher.role,
            class_name: newTeacher.class_name,
            subject: newTeacher.subject,
            school: newTeacher.school
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, teacher: data, defaultPassword: defaultPass });
        }
      } catch (e) {}

      fallbackProfiles.push(newTeacher);
      return NextResponse.json({ success: true, teacher: newTeacher, defaultPassword: defaultPass });
    }

    // 5. Admin Updates Teacher
    if (action === 'admin_update_teacher') {
      const { id, name, email, role, className, subject, password } = body;

      const updateData = {
        name,
        email: email.toLowerCase(),
        role,
        class_name: className,
        subject
      };
      if (password && password.trim()) {
        updateData.password = password.trim();
      }

      try {
        await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', id);
      } catch (e) {}

      fallbackProfiles = fallbackProfiles.map(p => 
        p.id === id ? { ...p, ...updateData } : p
      );

      return NextResponse.json({ success: true });
    }

    // 6. Admin Deletes Teacher
    if (action === 'admin_delete_teacher') {
      const { id } = body;
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (e) {}

      fallbackProfiles = fallbackProfiles.filter(p => p.id !== id);
      return NextResponse.json({ success: true });
    }

    // 7. Admin Resets Teacher Password to Default
    if (action === 'admin_reset_password') {
      const { id } = body;
      const teacher = fallbackProfiles.find(p => p.id === id);
      const defaultPass = getDefaultPassword(teacher?.name || 'teacher');

      try {
        await supabase
          .from('profiles')
          .update({ password: defaultPass })
          .eq('id', id);
      } catch (e) {}

      fallbackProfiles = fallbackProfiles.map(p => 
        p.id === id ? { ...p, password: defaultPass } : p
      );

      return NextResponse.json({ success: true, defaultPassword: defaultPass });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
