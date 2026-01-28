# CoursePlanner 🎓

**CoursePilot** is a responsive and interactive web application designed to help university students efficiently plan their academic journey. It combines a course explorer, a four-year course planner, and an academic calendar tailored for engineering majors at UIUC.

## 🌟 Features

### 🔍 Course Explorer
- Search for any course by department and number.
- View term offerings, descriptions, prerequisites, and average GPA.
- Grade distribution visualized with Chart.js.
- Real-time data fetched from Supabase (Postgres + Edge Function).

### 🧭 Course Planner
- Drag-and-drop interface to organize courses by semester.
- Displays real-time progress toward major, minor, and general education requirements.
- Supports transfer credit input.
- Save plans locally (localStorage).

### 📆 Academic Calendar
- Semester-specific events with category filters (registration, deadlines, academic events, holidays).
- UI-enhanced calendar section with responsive design.

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase Postgres
- **Visualization**: Chart.js (for GPA distribution)
- **UX Enhancements**: Dynamic styling, animations, responsive layout

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js + npm
- Supabase project

### 💻 Local Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/hscho421/courseplanner.git
   cd courseplanner
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Create `frontend/.env.local`:
   ```bash
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. Run the frontend:
   ```bash
   npm run dev
   ```

> 🔧 The deployed Supabase Edge Function `uiuc-course` is required for course details and credits.

### 🧩 Supabase Setup

Run these SQL scripts in Supabase:
- `supabase/views.sql` (GPA view)
- `supabase/majors.sql` (Majors seed)
- `supabase/rls.sql` (RLS policies)

Deploy the Edge Function:
```bash
supabase functions deploy uiuc-course
```

### 🗂️ Legacy Files

Legacy Python/Flask and raw database artifacts live in `legacy/` for reference.

---

## 🎨 Screenshots


---

## 📌 TODO

- Add user authentication and persistent storage
- Expand support to other majors and institutions
- Add mobile optimization and accessibility enhancements

---

## 👨‍💻 Author

**Hyunseok Cho**  
Computer Engineering @ UIUC  
[GitHub](https://github.com/hscho421) • [LinkedIn](https://linkedin.com/in/hyunseok-cho)

---

## 📝 License

This project is licensed under the [MIT License](/LICENSE.md).
