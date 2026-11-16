import { NextResponse } from 'next/server';
import { 
  getSharedCustomHolidays, 
  addSharedCustomHoliday, 
  deleteSharedCustomHoliday, 
  resetSharedCustomHolidays 
} from '@/lib/holidaysStore';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // If Supabase table `school_holidays` exists, try fetching from there
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('school_holidays')
          .select('*')
          .order('date', { ascending: true });
        
        if (!error && Array.isArray(data) && data.length > 0) {
          return NextResponse.json({ success: true, data });
        }
      } catch (e) {
        // Table may not exist yet, fallback smoothly
      }
    }

    const holidays = getSharedCustomHolidays();
    return NextResponse.json({ success: true, data: holidays });
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
    const { action, holiday, id } = body;

    if (action === 'create' || action === 'add') {
      if (!holiday || !holiday.date) {
        return NextResponse.json(
          { success: false, error: 'Date is required for holiday' },
          { status: 400 }
        );
      }

      // Try Supabase insert
      if (supabase) {
        try {
          await supabase.from('school_holidays').upsert([{
            date: holiday.date,
            name: holiday.name || 'School Holiday',
            declared_by: holiday.declaredBy || 'School Administrator'
          }], { onConflict: 'date' });
        } catch (e) {}
      }

      const updated = addSharedCustomHoliday(holiday);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
      }

      if (supabase) {
        try {
          await supabase.from('school_holidays').delete().eq('id', id);
        } catch (e) {}
      }

      const updated = deleteSharedCustomHoliday(id);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'reset_demo') {
      const updated = resetSharedCustomHolidays();
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

