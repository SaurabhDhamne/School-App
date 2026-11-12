-- ==============================================================
-- MYSCHOOL WEB APP: COMPLETE SUPABASE SQL INITIALIZATION SCRIPT
-- Run this full script inside Supabase -> SQL Editor -> New Query
-- ==============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running from scratch (clean slate)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.marks CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create PROFILES Table (1 Admin + Teachers)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'teacher@123',
  role TEXT NOT NULL DEFAULT 'class_teacher' CHECK (role IN ('admin', 'class_teacher', 'subject_teacher')),
  class_name TEXT DEFAULT 'Class 8-A',
  subject TEXT DEFAULT 'Mathematics',
  school TEXT DEFAULT 'MySchool',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Create STUDENTS Table (10 Students)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  class_name TEXT DEFAULT 'Class 8-A',
  parent_email TEXT,
  parent_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Create ATTENDANCE Table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'P' CHECK (status IN ('P', 'A')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT unique_student_daily_attendance UNIQUE (student_id, date)
);

-- 6. Create MARKS Table
CREATE TABLE public.marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('maths', 'science', 'english', 'social', 'hindi')),
  exam TEXT NOT NULL DEFAULT 'Unit Test 1',
  score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  max_score NUMERIC(5, 2) NOT NULL DEFAULT 25,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT unique_student_subject_exam UNIQUE (student_id, subject, exam)
);

-- ==============================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public modify profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to marks" ON public.marks FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================
-- 8. SEED DATA: 1 ADMIN + EXACTLY 3 TEACHERS (MySchool)
-- ==============================================================
-- Admin credentials: admin@myschool.com / admin@123
-- Teacher default passwords: firstname@123
INSERT INTO public.profiles (name, email, password, role, class_name, subject, school) VALUES
  ('School Administrator', 'admin@myschool.com', 'admin@123', 'admin', 'All Classes', 'All Subjects', 'MySchool'),
  ('Mrs. Priya Sharma', 'priya@myschool.com', 'priya@123', 'class_teacher', 'Class 8-A', 'Mathematics', 'MySchool'),
  ('Mr. Rajesh Patel', 'rajesh@myschool.com', 'rajesh@123', 'subject_teacher', 'Class 8-A', 'Science', 'MySchool'),
  ('Mrs. Sunita Verma', 'sunita@myschool.com', 'sunita@123', 'subject_teacher', 'Class 8-A', 'English', 'MySchool');

-- ==============================================================
-- 9. SEED DATA: EXACTLY 10 STUDENTS (Class 8-A)
-- ==============================================================
INSERT INTO public.students (roll_no, name, class_name, parent_email, parent_phone) VALUES
  ('01', 'Aakash Verma', 'Class 8-A', 'parent.verma@example.com', '9876543201'),
  ('02', 'Ananya Gupta', 'Class 8-A', 'parent.gupta@example.com', '9876543202'),
  ('03', 'Devendra Patel', 'Class 8-A', 'parent.patel@example.com', '9876543203'),
  ('04', 'Diya Sen', 'Class 8-A', 'parent.sen@example.com', '9876543204'),
  ('05', 'Ishaan Reddy', 'Class 8-A', 'parent.reddy@example.com', '9876543205'),
  ('06', 'Kavya Nair', 'Class 8-A', 'parent.nair@example.com', '9876543206'),
  ('07', 'Manish Kumar', 'Class 8-A', 'parent.kumar@example.com', '9876543207'),
  ('08', 'Meera Iyer', 'Class 8-A', 'parent.iyer@example.com', '9876543208'),
  ('09', 'Rohan Joshi', 'Class 8-A', 'parent.joshi@example.com', '9876543209'),
  ('10', 'Tanvi Deshmukh', 'Class 8-A', 'parent.deshmukh@example.com', '9876543210');

-- ==============================================================
-- 10. SEED DATA: MARKS FOR ALL 10 STUDENTS (Unit Test 1, Max 25)
-- ==============================================================
INSERT INTO public.marks (student_id, subject, exam, score, max_score)
SELECT s.id, m.subject, 'Unit Test 1', m.score, 25
FROM public.students s
CROSS JOIN LATERAL (
  VALUES 
    ('maths', CASE s.roll_no 
      WHEN '01' THEN 21 WHEN '02' THEN 25 WHEN '03' THEN 15 WHEN '04' THEN 23 WHEN '05' THEN 12 
      WHEN '06' THEN 22 WHEN '07' THEN 18 WHEN '08' THEN 24 WHEN '09' THEN 19 WHEN '10' THEN 23 END),
    ('science', CASE s.roll_no 
      WHEN '01' THEN 23 WHEN '02' THEN 25 WHEN '03' THEN 16 WHEN '04' THEN 22 WHEN '05' THEN 13 
      WHEN '06' THEN 24 WHEN '07' THEN 19 WHEN '08' THEN 25 WHEN '09' THEN 20 WHEN '10' THEN 24 END),
    ('english', CASE s.roll_no 
      WHEN '01' THEN 20 WHEN '02' THEN 24 WHEN '03' THEN 14 WHEN '04' THEN 24 WHEN '05' THEN 15 
      WHEN '06' THEN 23 WHEN '07' THEN 17 WHEN '08' THEN 23 WHEN '09' THEN 18 WHEN '10' THEN 22 END),
    ('social', CASE s.roll_no 
      WHEN '01' THEN 19 WHEN '02' THEN 23 WHEN '03' THEN 15 WHEN '04' THEN 21 WHEN '05' THEN 11 
      WHEN '06' THEN 22 WHEN '07' THEN 18 WHEN '08' THEN 24 WHEN '09' THEN 19 WHEN '10' THEN 23 END),
    ('hindi', CASE s.roll_no 
      WHEN '01' THEN 22 WHEN '02' THEN 24 WHEN '03' THEN 17 WHEN '04' THEN 23 WHEN '05' THEN 14 
      WHEN '06' THEN 21 WHEN '07' THEN 20 WHEN '08' THEN 25 WHEN '09' THEN 21 WHEN '10' THEN 24 END)
) AS m(subject, score);

-- ==============================================================
-- 11. SEED DATA: ATTENDANCE FOR ALL 10 STUDENTS
-- ==============================================================
INSERT INTO public.attendance (student_id, date, status)
SELECT id, CURRENT_DATE, CASE WHEN roll_no IN ('03', '05') THEN 'A' ELSE 'P' END
FROM public.students;
