# CoursePlanner 🎓

**CoursePilot** is a responsive and interactive fullstack web application designed to help university students efficiently plan their academic journey. It combines a course explorer, a four-year course planner, and an academic calendar tailored for engineering majors at UIUC.

## 🌟 Features

### 🔍 Course Explorer
- Search for any course by department and number.
- View term offerings, descriptions, prerequisites, and average GPA.
- Grade distribution visualized with Chart.js.
- Real-time data fetched from a Flask-based backend API.

### 🧭 Course Planner
- Drag-and-drop interface to organize courses by semester.
- Displays real-time progress toward major, minor, and general education requirements.
- Supports transfer credit input.
- Save and export course plans as PDF.

### 📆 Academic Calendar
- Semester-specific events with category filters (registration, deadlines, academic events, holidays).
- UI-enhanced calendar section with responsive design.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python Flask
- **Database**: AWS MySQL RDS
- **Visualization**: Chart.js (for GPA distribution)
- **PDF Export**: jsPDF + html2canvas
- **UX Enhancements**: Dynamic styling, animations, responsive layout

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Python 3.x
- Flask

### 💻 Local Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/hscho421/courseplanner.git
   cd courseplanner
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python app.py
   ```

4. Open `html/mainpage.html` in your browser to explore the app.

> 🔧 Make sure your Flask server is running to fetch course data and grade distributions.

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
