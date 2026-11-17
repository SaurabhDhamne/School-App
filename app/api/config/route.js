import { NextResponse } from 'next/server';
import { loadSchoolConfigFromDisk, saveSchoolConfigToDisk } from '@/lib/configStore';

export async function GET() {
  try {
    const config = loadSchoolConfigFromDisk();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;
    let config = loadSchoolConfigFromDisk();

    // 1. Add Exam (Max 4)
    if (action === 'add_exam') {
      const { name } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Exam name is required' }, { status: 400 });
      }

      if (config.exams && config.exams.length >= 4) {
        return NextResponse.json({
          success: false,
          error: 'limit_exceeded',
          message: 'Maximum limit reached: You can configure up to 4 exams for this academic year.'
        }, { status: 400 });
      }

      const newExam = {
        id: `exam_${Date.now()}`,
        name: name.trim()
      };
      config.exams = [...(config.exams || []), newExam];
      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config, newExam });
    }

    // 2. Rename / Update Exam
    if (action === 'rename_exam') {
      const { id, name } = body;
      if (!id || !name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Exam ID and name are required' }, { status: 400 });
      }

      config.exams = (config.exams || []).map(ex => {
        if (ex.id === id) {
          const oldName = ex.name;
          // If this was the active exam, also update activeExam
          if (config.activeExam === oldName) {
            config.activeExam = name.trim();
          }
          return { ...ex, name: name.trim() };
        }
        return ex;
      });

      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config });
    }

    // 3. Delete Exam (Ensure at least 1 remains)
    if (action === 'delete_exam') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 });
      }

      if ((config.exams || []).length <= 1) {
        return NextResponse.json({
          success: false,
          error: 'minimum_required',
          message: 'At least one exam must remain in the school calendar.'
        }, { status: 400 });
      }

      const toDelete = config.exams.find(e => e.id === id);
      config.exams = config.exams.filter(e => e.id !== id);
      if (toDelete && config.activeExam === toDelete.name) {
        config.activeExam = config.exams[0].name;
      }

      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config });
    }

    // 4. Set Active Exam
    if (action === 'set_active_exam') {
      const { examName } = body;
      if (!examName) {
        return NextResponse.json({ success: false, error: 'Exam name is required' }, { status: 400 });
      }
      config.activeExam = examName;
      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config });
    }

    // 5. Add Subject (Max 10)
    if (action === 'add_subject') {
      const { label, maxMarks = 25, assignedTeacherName = null } = body;
      if (!label || !label.trim()) {
        return NextResponse.json({ success: false, error: 'Subject name is required' }, { status: 400 });
      }

      if (config.subjects && config.subjects.length >= 10) {
        return NextResponse.json({
          success: false,
          error: 'limit_exceeded',
          message: 'Maximum limit reached: A maximum of 10 subjects can be configured.'
        }, { status: 400 });
      }

      const cleanLabel = label.trim();
      const slug = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
      const uniqueKey = `${slug}_${Date.now().toString().slice(-4)}`;

      const newSubject = {
        key: uniqueKey,
        label: cleanLabel,
        max: Math.max(1, Number(maxMarks) || 25),
        assignedTeacherName: assignedTeacherName || null
      };

      config.subjects = [...(config.subjects || []), newSubject];
      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config, newSubject });
    }

    // 6. Update Subject (label, max marks, or assigned teacher)
    if (action === 'update_subject') {
      const { key, label, maxMarks, assignedTeacherName } = body;
      if (!key) {
        return NextResponse.json({ success: false, error: 'Subject key is required' }, { status: 400 });
      }

      config.subjects = (config.subjects || []).map(sub => {
        if (sub.key === key) {
          return {
            ...sub,
            label: label ? label.trim() : sub.label,
            max: maxMarks !== undefined ? Math.max(1, Number(maxMarks) || 25) : (sub.max || 25),
            assignedTeacherName: assignedTeacherName !== undefined ? assignedTeacherName : sub.assignedTeacherName
          };
        }
        return sub;
      });

      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config });
    }

    // 7. Delete Subject (Ensure at least 1 remains)
    if (action === 'delete_subject') {
      const { key } = body;
      if (!key) {
        return NextResponse.json({ success: false, error: 'Subject key is required' }, { status: 400 });
      }

      if ((config.subjects || []).length <= 1) {
        return NextResponse.json({
          success: false,
          error: 'minimum_required',
          message: 'At least one subject must remain in the school curriculum.'
        }, { status: 400 });
      }

      config.subjects = config.subjects.filter(s => s.key !== key);
      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config });
    }

    // 8. General config save
    if (action === 'save_all' && body.config) {
      config = { ...config, ...body.config };
      saveSchoolConfigToDisk(config);
      return NextResponse.json({ success: true, config });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
