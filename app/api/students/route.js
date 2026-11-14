import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { 
  getSharedStudents, 
  setSharedStudents, 
  clearAllSharedStudents, 
  resetToDemoStudents, 
  DEMO_STUDENTS 
} from '@/lib/studentsStore';

// Fallback in-memory database synced across routes
let fallbackStudentsDB = getSharedStudents();

// In-memory fallback history per date (YYYY-MM-DD -> { [rollNo]: 'P' | 'A' })
let fallbackAttendanceHistory = {};

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

// Seed today's initial record in fallback history
(() => {
  const t = getTodayDateStr();
  fallbackAttendanceHistory[t] = {};
  fallbackStudentsDB.forEach(s => {
    fallbackAttendanceHistory[t][s.rollNo] = s.attendance || 'P';
  });
})();

// GET: Fetch all students and full date-based attendance history
export async function GET() {
  try {
    const today = getTodayDateStr();

    // Fetch from Supabase
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, roll_no, name, parent_email, parent_phone, class_name')
      .order('roll_no', { ascending: true });

    // When Supabase responds without error:
    // If the school has 0 students (clean database), return an empty array [] without falling back to demo data!
    if (!studentsError && Array.isArray(studentsData)) {
      if (studentsData.length === 0) {
        return NextResponse.json({ 
          success: true, 
          data: [], 
          attendanceHistory: {},
          source: 'supabase' 
        });
      }

      // Fetch marks
      const { data: marksData } = await supabase
        .from('marks')
        .select('student_id, subject, score');

      // Fetch all attendance history
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, date, status');

      const studentIdToRoll = {};
      studentsData.forEach(s => {
        studentIdToRoll[s.id] = s.roll_no;
      });

      const attendanceMap = {};
      const historyMap = {};
      if (attendanceData) {
        attendanceData.forEach(a => {
          const roll = studentIdToRoll[a.student_id];
          if (a.date === today) {
            attendanceMap[a.student_id] = a.status;
          }
          if (roll && a.date) {
            if (!historyMap[a.date]) historyMap[a.date] = {};
            historyMap[a.date][roll] = a.status;
          }
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

      return NextResponse.json({ 
        success: true, 
        data: formatted, 
        attendanceHistory: historyMap,
        source: 'supabase' 
      });
    }
  } catch (err) {
    console.warn('Supabase not reachable yet, falling back to local memory:', err.message);
  }

  return NextResponse.json({ 
    success: true, 
    data: fallbackStudentsDB, 
    attendanceHistory: fallbackAttendanceHistory,
    source: 'memory' 
  });
}

// POST: Update marks, attendance, or Admin Student Management
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, updates, students, student } = body;
    const today = getTodayDateStr();

    // 0. Clean Slate: Clear all students & records (for new school onboarding)
    if (action === 'admin_clear_all_students') {
      try {
        await supabase.from('attendance').delete().neq('status', '__never_match__');
        await supabase.from('marks').delete().neq('subject', '__never_match__');
        await supabase.from('students').delete().neq('roll_no', '__never_match__');
      } catch (e) {
        console.warn('Supabase clear all students error:', e);
      }

      fallbackStudentsDB = [];
      clearAllSharedStudents();
      fallbackAttendanceHistory = {};

      return NextResponse.json({ 
        success: true, 
        count: 0, 
        message: 'All student records, marks, and attendance cleared. Ready for fresh onboarding!' 
      });
    }

    // 0.5 Restore Demo Students (for quick sales demos)
    if (action === 'admin_load_demo_students') {
      fallbackStudentsDB = [...DEMO_STUDENTS];
      resetToDemoStudents();
      fallbackAttendanceHistory = {};
      const t = getTodayDateStr();
      fallbackAttendanceHistory[t] = {};
      fallbackStudentsDB.forEach(s => {
        fallbackAttendanceHistory[t][s.rollNo] = s.attendance || 'P';
      });

      return NextResponse.json({ 
        success: true, 
        count: fallbackStudentsDB.length, 
        data: fallbackStudentsDB,
        message: 'Demo students restored successfully.' 
      });
    }

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

    // 1.5 Admin Bulk Add Students (Multiple students for any class)
    if (action === 'admin_bulk_add_students' && Array.isArray(body.students)) {
      const incoming = body.students;
      for (const st of incoming) {
        try {
          const { data } = await supabase
            .from('students')
            .upsert({
              roll_no: st.rollNo,
              name: st.name,
              class_name: st.className || 'Class 8-A',
              parent_email: st.parentEmail || '',
              parent_phone: st.parentPhone || ''
            }, { onConflict: 'roll_no' })
            .select()
            .single();

          if (data) {
            const defaultSubjects = ['maths', 'science', 'english', 'social', 'hindi'];
            for (const sub of defaultSubjects) {
              await supabase.from('marks').upsert({
                student_id: data.id,
                subject: sub,
                exam: 'Unit Test 1',
                score: st.marks?.[sub] ?? 0,
                max_score: 25
              }, { onConflict: 'student_id,subject,exam' });
            }
          }
        } catch (e) {}

        const existsIdx = fallbackStudentsDB.findIndex(s => s.rollNo === st.rollNo && (s.className || 'Class 8-A') === (st.className || 'Class 8-A'));
        const newRecord = {
          rollNo: st.rollNo,
          name: st.name,
          className: st.className || 'Class 8-A',
          parentEmail: st.parentEmail || '',
          parentPhone: st.parentPhone || '',
          attendance: 'P',
          emailed: false,
          marks: st.marks || { maths: 0, science: 0, english: 0, social: 0, hindi: 0 }
        };
        if (existsIdx !== -1) {
          fallbackStudentsDB[existsIdx] = newRecord;
        } else {
          fallbackStudentsDB.push(newRecord);
        }
      }

      return NextResponse.json({ success: true, count: incoming.length });
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

    // 5. Update single student or attendance
    if ((action === 'update_single' || action === 'update_attendance') && updates) {
      const targetDate = updates.date || body.date || today;
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
              date: targetDate,
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
        console.warn('Supabase update_single/update_attendance error:', err);
      }

      // Update in-memory date history
      if (updates.attendance) {
        if (!fallbackAttendanceHistory[targetDate]) fallbackAttendanceHistory[targetDate] = {};
        fallbackAttendanceHistory[targetDate][updates.rollNo] = updates.attendance;
      }

      fallbackStudentsDB = fallbackStudentsDB.map(s => {
        if (s.rollNo === updates.rollNo) {
          return {
            ...s,
            ...(targetDate === today && updates.attendance ? { attendance: updates.attendance } : {}),
            ...(updates.marks ? { marks: { ...s.marks, ...updates.marks } } : {}),
            ...(updates.emailed !== undefined ? { emailed: updates.emailed } : {})
          };
        }
        return s;
      });

      return NextResponse.json({ 
        success: true, 
        data: fallbackStudentsDB, 
        attendanceHistory: fallbackAttendanceHistory 
      });
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
      const targetDate = body.date || today;
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
              date: item.date || targetDate,
              status: item.status
            }, { onConflict: 'student_id,date' });
          }
        }
      } catch (err) {
        console.warn('Supabase apply_ocr_attendance error:', err);
      }

      updates.forEach(item => {
        const student = fallbackStudentsDB.find(s => s.rollNo === item.rollNo);
        const itemDate = item.date || targetDate;
        if (!fallbackAttendanceHistory[itemDate]) fallbackAttendanceHistory[itemDate] = {};
        if (item.status) {
          fallbackAttendanceHistory[itemDate][item.rollNo] = item.status;
        }
        if (student && item.status && itemDate === today) {
          student.attendance = item.status;
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: fallbackStudentsDB, 
        attendanceHistory: fallbackAttendanceHistory 
      });
    }

    return NextResponse.json({ success: true, data: fallbackStudentsDB });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
