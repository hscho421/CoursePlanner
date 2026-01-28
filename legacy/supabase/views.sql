
create or replace view public.gpa_raw_public as
select
  "Subject" as subject,
  "Number" as number,
  "Course Title" as course_title,
  "A+" as a_plus,
  "A" as a,
  "A-" as a_minus,
  "B+" as b_plus,
  "B" as b,
  "B-" as b_minus,
  "C+" as c_plus,
  "C" as c,
  "C-" as c_minus,
  "D+" as d_plus,
  "D" as d,
  "D-" as d_minus,
  "F" as f,
  "W" as w,
  "Total Students" as total_students,
  "GPA" as gpa
from public.gpa_raw;

grant select on public.gpa_raw_public to anon;
