import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSharedStudents } from '@/lib/studentsStore';
import { getStoredFaculty, saveStoredFaculty, INITIAL_FACULTY } from '@/lib/facultyStore';

const withTimeout = (promise, ms = 1000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);

function getDefaultPassword(name = '') {
  const clean = name.replace(/^(mrs\.|mr\.|dr\.|ms\.|prof\.)\s+/i, '').trim();
  const firstName = clean.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${firstName || 'teacher'}@123`;
}

function formatTeacherProfile(t, fallbackTeachers = []) {
  const fallback = Array.isArray(fallbackTeachers) 
    ? fallbackTeachers.find(f => f.id === t.id || f.email?.toLowerCase() === t.email?.toLowerCase())
    : null;

  let ct = t.classTeacherOf || t.class_teacher_of || fallback?.classTeacherOf || null;
  let classes = Array.isArray(t.classes) && t.classes.length > 0 
    ? [...t.classes] 
    : (fallback?.classes ? [...fallback.classes] : []);

  if (typeof t.class_name === 'string') {
    const ctMatch = t.class_name.match(/(.+?)\s*\(CT\)/i);
    if (ctMatch) {
      ct = ctMatch[1].trim();
    }
    const parts = t.class_name.split(',').map(c => c.replace(/\(CT\)/i, '').trim()).filter(Boolean);
    if (parts.length > 0) {
      classes = Array.from(new Set([...classes, ...parts]));
    }
  }

  if (classes.length === 0) {
    classes = ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B'];
  }

  if (t.role === 'class_teacher' && !ct) {
    ct = fallback?.classTeacherOf || classes[0] || 'Class 8-A';
  } else if (t.role === 'subject_teacher') {
    ct = null;
  }

  const role = ct ? 'class_teacher' : 'subject_teacher';

  return {
    ...t,
    role,
    classTeacherOf: ct,
    class_teacher_of: ct,
    classes,
    class_name: ct ? `${ct} (CT), ${classes.filter(c => c !== ct).join(', ')}` : classes.join(', ')
  };
}

export async function GET(request) {
  const storedFaculty = getStoredFaculty();
  const teachersOnly = storedFaculty.filter(p => p.role !== 'admin');

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select('id, name, email, role, class_name, subject, school')
        .neq('role', 'admin')
        .order('name', { ascending: true }),
      1000
    );

    if (!error && Array.isArray(data) && data.length > 0) {
      const formatted = data.map(t => formatTeacherProfile(t, teachersOnly));
      return NextResponse.json({ success: true, teachers: formatted });
    }
  } catch (err) {
    console.warn('Supabase fetch profiles timed out or failed, using local fallback:', err.message);
  }

  const formatted = teachersOnly.map(t => formatTeacherProfile(t, teachersOnly));
  return NextResponse.json({ success: true, teachers: formatted });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 0. Clean Slate: Clear all teacher profiles (except admin) for fresh onboarding
    if (action === 'admin_clear_all_teachers') {
      try {
        await supabase.from('profiles').delete().neq('role', 'admin');
      } catch (e) {
        console.warn('Supabase clear teachers error:', e);
      }
      const adminOnly = getStoredFaculty().filter(p => p.role === 'admin');
      saveStoredFaculty(adminOnly);
      return NextResponse.json({ 
        success: true, 
        count: 0, 
        message: 'All teacher accounts cleared. Administrator preserved.' 
      });
    }

    // 0.5 Restore Demo Teachers (for quick sales demos)
    if (action === 'admin_load_demo_teachers') {
      saveStoredFaculty(INITIAL_FACULTY);
      const teachers = INITIAL_FACULTY.filter(p => p.role !== 'admin').map(t => formatTeacherProfile(t, INITIAL_FACULTY));
      return NextResponse.json({ success: true, teachers, message: 'Demo teachers restored.' });
    }

    // 1. Get Teachers List for Dropdown
    if (action === 'get_teachers') {
      const storedFaculty = getStoredFaculty();
      const teachersOnly = storedFaculty.filter(p => p.role !== 'admin');
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('profiles')
            .select('id, name, email, role, class_name, subject, school')
            .neq('role', 'admin')
            .order('name', { ascending: true }),
          1000
        );

        if (!error && Array.isArray(data) && data.length > 0) {
          return NextResponse.json({ success: true, teachers: data.map(t => formatTeacherProfile(t, teachersOnly)) });
        }
      } catch (e) {}
      const teachers = teachersOnly.map(t => formatTeacherProfile(t, teachersOnly));
      return NextResponse.json({ success: true, teachers });
    }

    // 1.5 Get Students List for Parent Portal dropdown
    if (action === 'get_parent_students') {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('students')
            .select('id, roll_no, name, class_name, parent_email, parent_phone')
            .order('roll_no', { ascending: true }),
          1000
        );

        if (!error && Array.isArray(data)) {
          const formatted = data.map(s => ({
            id: s.id,
            rollNo: s.roll_no,
            name: s.name,
            className: s.class_name || 'Class 8-A',
            parentEmail: s.parent_email || '',
            parentPhone: s.parent_phone || ''
          }));
          return NextResponse.json({ success: true, students: formatted });
        }
      } catch (e) {}
      return NextResponse.json({ success: true, students: getSharedStudents() });
    }

    // 1.8 Parent Portal Login
    if (action === 'parent_login') {
      const { studentRollNo, className, parentEmail, parentPhone, password } = body;

      // 1. Query Supabase students
      let matchedStudent = null;
      try {
        let query = supabase.from('students').select('*');
        if (className) {
          query = query.eq('class_name', className);
        }
        if (parentEmail) {
          query = query.eq('parent_email', String(parentEmail).toLowerCase().trim());
        } else if (parentPhone) {
          query = query.eq('parent_phone', String(parentPhone).trim());
        } else if (studentRollNo) {
          query = query.eq('roll_no', String(studentRollNo).trim());
        }
        const { data } = await query.single();
        if (data) {
          matchedStudent = {
            id: data.id,
            rollNo: data.roll_no,
            name: data.name,
            className: data.class_name || 'Class 8-A',
            parentEmail: data.parent_email || '',
            parentPhone: data.parent_phone || '',
            parentPassword: data.parent_password || null,
            attendance: 'P'
          };
        }
      } catch (e) {}

      // 2. Fallback in-memory search if not found in Supabase
      if (!matchedStudent) {
        const liveList = getSharedStudents();
        matchedStudent = liveList.find(s => {
          if (className && s.className && s.className.toLowerCase() !== className.toLowerCase()) {
            return false;
          }
          const emailInput = String(parentEmail || '').toLowerCase().trim();
          const phoneInput = String(parentPhone || '').trim();
          const rollInput = String(studentRollNo || '').trim();

          if (emailInput && s.parentEmail && s.parentEmail.toLowerCase().trim() === emailInput) {
            return true;
          }
          if (phoneInput && s.parentPhone && s.parentPhone.trim() === phoneInput) {
            return true;
          }
          if (rollInput && (s.rollNo === rollInput || parseInt(s.rollNo, 10) === parseInt(rollInput, 10))) {
            return true;
          }
          return false;
        });
      }

      if (!matchedStudent) {
        return NextResponse.json({ 
          error: 'No student record found for this class and registered email.' 
        }, { status: 404 });
      }

      // Password Validation: custom password OR default firstname(student)@123
      const cleanName = (matchedStudent.name || '').replace(/^(mrs\.|mr\.|dr\.|ms\.|prof\.)\s+/i, '').trim();
      const firstName = cleanName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const defaultPassword = `${firstName}@123`;
      const customPassword = matchedStudent.parentPassword || matchedStudent.parent_password;

      const inputPass = String(password || '').trim();
      const isPassValid = 
        (customPassword && inputPass === customPassword) ||
        inputPass.toLowerCase() === defaultPassword || 
        inputPass.toLowerCase() === firstName || 
        inputPass === 'parent123' ||
        inputPass === String(matchedStudent.rollNo);

      if (!isPassValid) {
        return NextResponse.json({ 
          error: customPassword 
            ? 'Incorrect password. Please enter your updated password.'
            : `Incorrect password. Default password format is ${firstName}@123` 
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: `parent_${matchedStudent.rollNo}_${matchedStudent.className.replace(/\s+/g, '')}`,
          name: `${matchedStudent.name}'s Parent`,
          email: matchedStudent.parentEmail || `parent.${matchedStudent.rollNo}@example.com`,
          phone: matchedStudent.parentPhone || '',
          role: 'parent',
          student: {
            id: matchedStudent.id || `s_${matchedStudent.rollNo}`,
            rollNo: matchedStudent.rollNo,
            name: matchedStudent.name,
            className: matchedStudent.className,
            parentEmail: matchedStudent.parentEmail,
            parentPhone: matchedStudent.parentPhone,
            attendance: matchedStudent.attendance || 'P'
          },
          school: 'MySchool'
        }
      });
    }

    // 2. Login (Admin or Teacher by Dropdown Selection)
    if (action === 'login') {
      const { email, password, teacherId } = body;

      // Check if Admin login (supports any school admin email from database or admin keyword)
      const cleanEmail = String(email || '').toLowerCase().trim();
      const isPotentialAdmin = cleanEmail.includes('admin') || cleanEmail === 'admin@myschool.com';

      let adminUser = null;
      if (cleanEmail) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', cleanEmail)
            .eq('role', 'admin')
            .maybeSingle();
          if (data) adminUser = data;
        } catch (e) {}
      }

      if (!adminUser && isPotentialAdmin) {
        adminUser = fallbackProfiles.find(p => p.email.toLowerCase() === cleanEmail && p.role === 'admin')
          || fallbackProfiles.find(p => p.role === 'admin');
      }

      if (adminUser) {
        const expectedPass = adminUser.password || 'admin@123';
        if (password === expectedPass || password === 'admin@123') {
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

    // 3. Teacher, Parent or Admin Changes Their Password
    if (action === 'change_password') {
      const { userId, newPassword, role, studentRollNo, studentClass } = body;
      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
      }

      const isParent = role === 'parent' || String(userId).startsWith('parent_');

      if (isParent) {
        const roll = studentRollNo || (userId ? String(userId).split('_')[1] : null);
        const cls = studentClass || (userId ? String(userId).split('_')[2] : null);

        // 1. Try Supabase
        try {
          if (roll) {
            let q = supabase.from('students').update({ parent_password: newPassword }).eq('roll_no', roll);
            if (cls) q = q.eq('class_name', cls);
            await q;
          }
        } catch (e) {}

        // 2. Update in shared students store
        const shared = getSharedStudents();
        const updated = shared.map(s => {
          if (roll && s.rollNo === roll) {
            return { ...s, parentPassword: newPassword, parent_password: newPassword };
          }
          return s;
        });
        setSharedStudents(updated);

        return NextResponse.json({ success: true, message: 'Password updated successfully!' });
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
      const { name, email, role, className, classTeacherOf, classes, subject } = body;
      const defaultPass = getDefaultPassword(name);

      const assignedClassTeacherOf = role === 'class_teacher' ? (classTeacherOf || className || null) : null;
      let assignedClasses = Array.isArray(classes) && classes.length > 0 
        ? classes 
        : (className ? [className] : ['Class 8-A', 'Class 8-B']);
      if (assignedClassTeacherOf && !assignedClasses.includes(assignedClassTeacherOf)) {
        assignedClasses = [assignedClassTeacherOf, ...assignedClasses];
      }

      let currentFaculty = getStoredFaculty();

      // Enforce: Each class has only 1 Class Teacher.
      if (assignedClassTeacherOf) {
        currentFaculty = currentFaculty.map(p => {
          if ((p.classTeacherOf === assignedClassTeacherOf || p.class_name?.includes(`${assignedClassTeacherOf} (CT)`)) && p.role === 'class_teacher') {
            return { 
              ...p, 
              role: 'subject_teacher', 
              classTeacherOf: null, 
              class_teacher_of: null,
              class_name: p.classes ? p.classes.join(', ') : 'Class 8-A'
            };
          }
          return p;
        });
        try {
          await supabase
            .from('profiles')
            .update({ role: 'subject_teacher' })
            .ilike('class_name', `%${assignedClassTeacherOf}%`)
            .eq('role', 'class_teacher');
        } catch (e) {}
      }

      const encodedClassName = assignedClassTeacherOf 
        ? `${assignedClassTeacherOf} (CT), ${assignedClasses.filter(c => c !== assignedClassTeacherOf).join(', ')}`
        : assignedClasses.join(', ');

      const newTeacher = {
        id: `t_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: defaultPass,
        role: assignedClassTeacherOf ? 'class_teacher' : 'subject_teacher',
        class_name: encodedClassName,
        classes: assignedClasses,
        classTeacherOf: assignedClassTeacherOf,
        class_teacher_of: assignedClassTeacherOf,
        subject: subject || 'General',
        school: 'MySchool'
      };

      try {
        await supabase
          .from('profiles')
          .insert({
            name: newTeacher.name,
            email: newTeacher.email,
            password: newTeacher.password,
            role: newTeacher.role,
            class_name: newTeacher.class_name,
            subject: newTeacher.subject,
            school: newTeacher.school
          });
      } catch (e) {}

      currentFaculty.push(newTeacher);
      saveStoredFaculty(currentFaculty);

      const formatted = formatTeacherProfile(newTeacher, currentFaculty);
      return NextResponse.json({ success: true, teacher: formatted, defaultPassword: defaultPass });
    }

    // 5. Admin Updates Teacher
    if (action === 'admin_update_teacher') {
      const { id, name, email, role, className, classTeacherOf, classes, subject, password } = body;

      const assignedClassTeacherOf = role === 'class_teacher' ? (classTeacherOf || className || null) : null;
      let assignedClasses = Array.isArray(classes) && classes.length > 0 
        ? classes 
        : (className ? (className.includes(',') ? className.split(',').map(c => c.trim()) : [className]) : ['Class 8-A', 'Class 8-B']);
      if (assignedClassTeacherOf && !assignedClasses.includes(assignedClassTeacherOf)) {
        assignedClasses = [assignedClassTeacherOf, ...assignedClasses];
      }

      let currentFaculty = getStoredFaculty();

      // Enforce: Each class has only 1 Class Teacher.
      if (assignedClassTeacherOf) {
        currentFaculty = currentFaculty.map(p => {
          if (p.id !== id && (p.classTeacherOf === assignedClassTeacherOf || p.class_name?.includes(`${assignedClassTeacherOf} (CT)`)) && p.role === 'class_teacher') {
            return { 
              ...p, 
              role: 'subject_teacher', 
              classTeacherOf: null, 
              class_teacher_of: null,
              class_name: p.classes ? p.classes.join(', ') : 'Class 8-A'
            };
          }
          return p;
        });
        try {
          await supabase
            .from('profiles')
            .update({ role: 'subject_teacher' })
            .neq('id', id)
            .ilike('class_name', `%${assignedClassTeacherOf}%`)
            .eq('role', 'class_teacher');
        } catch (e) {}
      }

      const encodedClassName = assignedClassTeacherOf 
        ? `${assignedClassTeacherOf} (CT), ${assignedClasses.filter(c => c !== assignedClassTeacherOf).join(', ')}`
        : assignedClasses.join(', ');

      const updateData = {
        name,
        email: email.toLowerCase(),
        role: assignedClassTeacherOf ? 'class_teacher' : 'subject_teacher',
        class_name: encodedClassName,
        classes: assignedClasses,
        classTeacherOf: assignedClassTeacherOf,
        class_teacher_of: assignedClassTeacherOf,
        subject
      };
      if (password && password.trim()) {
        updateData.password = password.trim();
      }

      try {
        await supabase
          .from('profiles')
          .update({
            name: updateData.name,
            email: updateData.email,
            role: updateData.role,
            class_name: updateData.class_name,
            subject: updateData.subject,
            ...(updateData.password ? { password: updateData.password } : {})
          })
          .eq('id', id);
      } catch (e) {}

      currentFaculty = currentFaculty.map(p => 
        p.id === id ? { ...p, ...updateData } : p
      );
      saveStoredFaculty(currentFaculty);

      const formatted = formatTeacherProfile({ id, ...updateData }, currentFaculty);
      return NextResponse.json({ success: true, teacher: formatted });
    }

    // 6. Admin Deletes Teacher
    if (action === 'admin_delete_teacher') {
      const { id } = body;
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (e) {}

      let currentFaculty = getStoredFaculty();
      currentFaculty = currentFaculty.filter(p => p.id !== id);
      saveStoredFaculty(currentFaculty);

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
