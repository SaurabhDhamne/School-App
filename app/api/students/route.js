import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Fallback in-memory database: Exactly 10 Students for Class 8-A in MySchool
let fallbackStudentsDB = [
  {
    rollNo: '01',
    name: 'Aakash Verma',
    className: 'Class 8-A',
    parentEmail: 'parent.verma@example.com',
    parentPhone: '9876543201',
    attendance: 'P',
    emailed: false,
    marks: { maths: 21, science: 23, english: 20, social: 19, hindi: 22 }
  },
  {
    rollNo: '02',
    name: 'Ananya Gupta',
    className: 'Class 8-A',
    parentEmail: 'parent.gupta@example.com',
    parentPhone: '9876543202',
    attendance: 'P',
    emailed: false,
    marks: { maths: 25, science: 25, english: 24, social: 23, hindi: 24 }
  },
  {
    rollNo: '03',
    name: 'Devendra Patel',
    className: 'Class 8-A',
    parentEmail: 'parent.patel@example.com',
    parentPhone: '9876543203',
    attendance: 'A',
    emailed: false,
    marks: { maths: 15, science: 16, english: 14, social: 15, hindi: 17 }
  },
  {
    rollNo: '04',
    name: 'Diya Sen',
    className: 'Class 8-A',
    parentEmail: 'parent.sen@example.com',
    parentPhone: '9876543204',
    attendance: 'P',
    emailed: false,
    marks: { maths: 23, science: 22, english: 24, social: 21, hindi: 23 }
  },
  {
    rollNo: '05',
    name: 'Ishaan Reddy',
    className: 'Class 8-A',
    parentEmail: 'parent.reddy@example.com',
    parentPhone: '9876543205',
    attendance: 'A',
    emailed: false,
    marks: { maths: 12, science: 13, english: 15, social: 11, hindi: 14 }
  },
  {
    rollNo: '06',
    name: 'Kavya Nair',
    className: 'Class 8-A',
    parentEmail: 'parent.nair@example.com',
    parentPhone: '9876543206',
    attendance: 'P',
    emailed: false,
    marks: { maths: 22, science: 24, english: 23, social: 22, hindi: 21 }
  },
  {
    rollNo: '07',
    name: 'Manish Kumar',
    className: 'Class 8-A',
    parentEmail: 'parent.kumar@example.com',
    parentPhone: '9876543207',
    attendance: 'P',
    emailed: false,
    marks: { maths: 18, science: 19, english: 17, social: 18, hindi: 20 }
  },
  {
    rollNo: '08',
    name: 'Meera Iyer',
    className: 'Class 8-A',
    parentEmail: 'parent.iyer@example.com',
    parentPhone: '9876543208',
    attendance: 'P',
    emailed: false,
    marks: { maths: 24, science: 25, english: 23, social: 24, hindi: 25 }
  },
  {
    rollNo: '09',
    name: 'Rohan Joshi',
    className: 'Class 8-A',
    parentEmail: 'parent.joshi@example.com',
    parentPhone: '9876543209',
    attendance: 'P',
    emailed: false,
    marks: { maths: 19, science: 20, english: 18, social: 19, hindi: 21 }
  },
  {
    rollNo: '10',
    name: 'Tanvi Deshmukh',
    className: 'Class 8-A',
    parentEmail: 'parent.deshmukh@example.com',
    parentPhone: '9876543210',
    attendance: 'P',
    emailed: false,
    marks: { maths: 23, science: 24, english: 22, social: 23, hindi: 24 }
  }
];

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

// GET: Fetch all students from Supabase (or fallback)
export async function GET() {
  try {
    const today = getTodayDateStr();

    // Fetch from Supabase
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, roll_no, name, parent_email, parent_phone, class_name')
      .order('roll_no', { ascending: true });

    if (!studentsError && studentsData && studentsData.length > 0) {
      // Fetch marks
      const { data: marksData } = await supabase
        .from('marks')
        .select('student_id, subject, score');

      // Fetch today's attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('date', today);

      const attendanceMap = {};
      if (attendanceData) {
        attendanceData.forEach(a => {
          attendanceMap[a.student_id] = a.status;
        });
      }

      const marksMap = {};
      if (marksData) {
        marksData.forEach(m => {
          if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
          marksMap[m.student_id][m.subject] = Number(m.score);
        });
      }

      const formatted = studentsData.map(s => ({
        id: s.id,
        rollNo: s.roll_no,
        name: s.name,
        className: s.class_name || 'Class 8-A',
        parentEmail: s.parent_email || '',
        parentPhone: s.parent_phone || '',
        attendance: attendanceMap[s.id] || 'P',
        emailed: false,
        marks: {
          maths: marksMap[s.id]?.maths ?? 0,
          science: marksMap[s.id]?.science ?? 0,
          english: marksMap[s.id]?.english ?? 0,
          social: marksMap[s.id]?.social ?? 0,
          hindi: marksMap[s.id]?.hindi ?? 0,
        }
      }));

      return NextResponse.json({ success: true, data: formatted, source: 'supabase' });
    }
  } catch (err) {
    console.warn('Supabase not reachable yet, falling back to local memory:', err.message);
  }

  return NextResponse.json({ success: true, data: fallbackStudentsDB, source: 'memory' });
}

// POST: Update marks, attendance, or Admin Student Management
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, updates, students, student } = body;
    const today = getTodayDateStr();

    // 1. Admin Adds a Student
    if (action === 'admin_add_student' && student) {
      const newSt = {
        id: `s_${Date.now()}`,
        roll_no: student.rollNo,
        name: student.name,
        class_name: student.className || 'Class 8-A',
        parent_email: student.parentEmail || '',
        parent_phone: student.parentPhone || ''
      };

      try {
        const { data } = await supabase
          .from('students')
          .insert(newSt)
          .select()
          .single();

        if (data) {
          const defaultSubjects = ['maths', 'science', 'english', 'social', 'hindi'];
          for (const sub of defaultSubjects) {
            await supabase.from('marks').insert({
              student_id: data.id,
              subject: sub,
              exam: 'Unit Test 1',
              score: 0,
              max_score: 25
            });
          }
        }
      } catch (e) {}

      fallbackStudentsDB.push({
        rollNo: student.rollNo,
        name: student.name,
        className: student.className || 'Class 8-A',
        parentEmail: student.parentEmail || '',
        parentPhone: student.parentPhone || '',
        attendance: 'P',
        emailed: false,
        marks: { maths: 0, science: 0, english: 0, social: 0, hindi: 0 }
      });

      return NextResponse.json({ success: true });
    }

    // 2. Admin Updates a Student
    if (action === 'admin_update_student' && student) {
      try {
        await supabase
          .from('students')
          .update({
            name: student.name,
            parent_email: student.parentEmail,
            parent_phone: student.parentPhone,
            class_name: student.className || 'Class 8-A'
          })
          .eq('roll_no', student.rollNo);
      } catch (e) {}

      fallbackStudentsDB = fallbackStudentsDB.map(s => 
        s.rollNo === student.rollNo 
          ? { ...s, name: student.name, parentEmail: student.parentEmail, parentPhone: student.parentPhone }
          : s
      );

      return NextResponse.json({ success: true });
    }

    // 3. Admin Deletes a Student
    if (action === 'admin_delete_student' && body.rollNo) {
      try {
        await supabase.from('students').delete().eq('roll_no', body.rollNo);
      } catch (e) {}

      fallbackStudentsDB = fallbackStudentsDB.filter(s => s.rollNo !== body.rollNo);
      return NextResponse.json({ success: true });
    }

    // 4. Bulk replace / import
    if (action === 'bulk_replace' && Array.isArray(students)) {
      try {
        for (const st of students) {
          const { data: studentRow } = await supabase
            .from('students')
            .upsert({
              roll_no: st.rollNo,
              name: st.name,
              class_name: st.className || 'Class 8-A',
              parent_email: st.parentEmail,
              parent_phone: st.parentPhone
            }, { onConflict: 'roll_no' })
            .select()
            .single();

          if (studentRow && st.marks) {
            for (const [subj, val] of Object.entries(st.marks)) {
              await supabase.from('marks').upsert({
                student_id: studentRow.id,
                subject: subj,
                exam: 'Unit Test 1',
                score: Number(val) || 0,
                max_score: 25
              }, { onConflict: 'student_id,subject,exam' });
            }
          }
        }
      } catch (err) {
        console.warn('Supabase bulk upsert error:', err);
      }
      fallbackStudentsDB = students;
      return NextResponse.json({ success: true, data: fallbackStudentsDB });
    }

    // 5. Update single student
    if (action === 'update_single' && updates) {
      try {
        const { data: stRow } = await supabase
          .from('students')
          .select('id')
          .eq('roll_no', updates.rollNo)
          .single();

        if (stRow) {
          if (updates.attendance) {
            await supabase.from('attendance').upsert({
              student_id: stRow.id,
              date: today,
              status: updates.attendance
            }, { onConflict: 'student_id,date' });
          }

          if (updates.marks) {
            for (const [subj, scoreVal] of Object.entries(updates.marks)) {
              if (scoreVal !== '') {
                await supabase.from('marks').upsert({
                  student_id: stRow.id,
                  subject: subj,
                  exam: 'Unit Test 1',
                  score: Number(scoreVal),
                  max_score: 25
                }, { onConflict: 'student_id,subject,exam' });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Supabase update_single error:', err);
      }

      fallbackStudentsDB = fallbackStudentsDB.map(s => {
        if (s.rollNo === updates.rollNo) {
          return {
            ...s,
            ...(updates.attendance ? { attendance: updates.attendance } : {}),
            ...(updates.marks ? { marks: { ...s.marks, ...updates.marks } } : {}),
            ...(updates.emailed !== undefined ? { emailed: updates.emailed } : {})
          };
        }
        return s;
      });

      return NextResponse.json({ success: true, data: fallbackStudentsDB });
    }

    // 6. Apply OCR Extracted Marks
    if (action === 'apply_ocr_marks' && Array.isArray(updates)) {
      try {
        for (const item of updates) {
          const { data: stRow } = await supabase
            .from('students')
            .select('id')
            .eq('roll_no', item.rollNo)
            .single();

          if (stRow && item.subject && item.mark !== undefined) {
            await supabase.from('marks').upsert({
              student_id: stRow.id,
              subject: item.subject,
              exam: 'Unit Test 1',
              score: Number(item.mark),
              max_score: 25
            }, { onConflict: 'student_id,subject,exam' });
          }
        }
      } catch (err) {
        console.warn('Supabase apply_ocr_marks error:', err);
      }

      updates.forEach(item => {
        const student = fallbackStudentsDB.find(s => s.rollNo === item.rollNo);
        if (student && item.subject && item.mark !== undefined) {
          student.marks[item.subject] = Number(item.mark);
        }
      });

      return NextResponse.json({ success: true, data: fallbackStudentsDB });
    }

    // 7. Apply OCR Extracted Attendance
    if (action === 'apply_ocr_attendance' && Array.isArray(updates)) {
      try {
        for (const item of updates) {
          const { data: stRow } = await supabase
            .from('students')
            .select('id')
            .eq('roll_no', item.rollNo)
            .single();

          if (stRow && item.status) {
            await supabase.from('attendance').upsert({
              student_id: stRow.id,
              date: today,
              status: item.status
            }, { onConflict: 'student_id,date' });
          }
        }
      } catch (err) {
        console.warn('Supabase apply_ocr_attendance error:', err);
      }

      updates.forEach(item => {
        const student = fallbackStudentsDB.find(s => s.rollNo === item.rollNo);
        if (student && item.status) {
          student.attendance = item.status;
        }
      });

      return NextResponse.json({ success: true, data: fallbackStudentsDB });
    }

    return NextResponse.json({ success: true, data: fallbackStudentsDB });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
