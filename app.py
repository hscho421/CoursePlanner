from flask import Flask, request, jsonify, send_from_directory
import requests
import xml.etree.ElementTree as ET
import re
from mysql.connector import pooling
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='.')

# Configure database connection pool
try:
    db_pool = pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        host=os.getenv("HOST"),
        user=os.getenv("NAME"),
        password=os.getenv("PASSWORD"),
        database=os.getenv("DATABASE")
    )
    print("Database connection pool created successfully")
except Exception as e:
    print(f"Error creating database pool: {str(e)}")
    db_pool = None

# Helper functions
def raw_course_data(url, year, semester, department, courseNumber, params=None):
    try:
        courseUrl = f"{url}/{year}/{semester}/{department}/{courseNumber}.xml"
        print(f"Requesting course data from: {courseUrl}")
        response = requests.get(courseUrl, params=params)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching course data: {str(e)}")
        return None

def extract_tag(rawData, tag):
    try:
        root = ET.fromstring(rawData)
        element = root.find(f".//{tag}")
        return element.text if element is not None else None
    except ET.ParseError as e:
        print(f"Error parsing XML: {str(e)}")
        return None

def get_prerequisite(sectionInformation):
    if not sectionInformation:
        return None
    range_match = re.search(r"Prerequisite:(.*?)[.]", sectionInformation, re.IGNORECASE)
    if range_match:
        sectionInformation = range_match.group(1).strip()
    return re.findall(r"\b[A-Z]{2,4} \d{3}\b", sectionInformation)

def get_gpa(subject, number):
    if not db_pool:
        print("Database pool is not available")
        return None
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT `GPA`
            FROM gpa_raw
            WHERE Subject = %s AND Number = %s;
        """
        cursor.execute(query, (subject, number))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Database error: {str(e)}")
        return None

# Serve HTML files
@app.route('/html/<path:path>')
def serve_html(path):
    return send_from_directory('html', path)

# Serve CSS files
@app.route('/css/<path:path>')
def serve_css(path):
    return send_from_directory('css', path)

# Serve asset files (like logo images)
@app.route('/asset/<path:path>')
def serve_asset(path):
    return send_from_directory('asset', path)

# Root route redirects to main page
@app.route('/')
def index():
    return send_from_directory('html', 'mainpage.html')

# Flask API routes
# Update the get_course_info route in backend.py to extract and return credit hours
@app.route('/course', methods=['GET'])
def get_course_info():
    base_url = "http://courses.illinois.edu/cisapp/explorer/schedule"
    year = request.args.get('year', '2024')
    semester = request.args.get('semester', 'Fall')
    department = request.args.get('department', '').upper()
    courseNumber = request.args.get('courseNumber', '')

    if not department or not courseNumber:
        return jsonify({"error": "Missing department or courseNumber"}), 400

    try:
        courses_data = raw_course_data(base_url, year, semester, department, courseNumber)
        if not courses_data:
            return jsonify({"error": "Unable to fetch course data"}), 404

        term = extract_tag(courses_data, "term")
        title = extract_tag(courses_data, "label")
        description = extract_tag(courses_data, "description")
        sectionInformation = extract_tag(courses_data, "courseSectionInformation")
        
        # Extract credit hours
        creditHours = extract_tag(courses_data, "creditHours")
        
        # Parse prerequisites if needed
        prerequisite_courses = None
        if sectionInformation:
            prerequisite_courses = get_prerequisite(sectionInformation)
        
        # Get GPA information
        gpa = get_gpa(department, courseNumber)

        return jsonify({
            "term": term,
            "title": title,
            "description": description,
            "creditHours": creditHours,  # Added credit hours to the response
            "prerequisite": sectionInformation or "No prerequisites information available",
            "prerequisite_courses": prerequisite_courses,
            "average_gpa": gpa if gpa else "No GPA data found"
        })
    except Exception as e:
        print(f"Error processing course info: {str(e)}")
        return jsonify({"error": str(e)}), 500








# Add these routes to your backend.py file

@app.route('/major-requirements', methods=['GET'])
def get_major_requirements():
    """
    Get the requirements for a specific major and track (if applicable)
    """
    major = request.args.get('major', '').strip()
    track = request.args.get('track', '').strip()
    
    if not major:
        return jsonify({"error": "Missing major parameter"}), 400
    
    # In a production app, this would come from a database
    # For now, we're using hardcoded data for demo purposes
    
    # Define some sample requirements by major
    major_requirements = {
        "Computer Science": {
            "core": [
                {"name": "CS Core", "credits": 28},
                {"name": "Math Courses", "credits": 12},
                {"name": "Science Courses", "credits": 8}
            ],
            "technical": [
                {"name": "CS Technical Electives", "credits": 12},
                {"name": "Free Electives", "credits": 6}
            ],
            "genEd": [
                {"name": "Humanities", "credits": 6},
                {"name": "Social Sciences", "credits": 6},
                {"name": "Composition", "credits": 4},
                {"name": "Advanced Composition", "credits": 3}
            ],
            "total_credits": 128
        },
        "Electrical Engineering": {
            "core": [
                {"name": "EE Core", "credits": 32},
                {"name": "Math Courses", "credits": 16},
                {"name": "Physics Courses", "credits": 8}
            ],
            "technical": [
                {"name": "EE Technical Electives", "credits": 12},
                {"name": "Free Electives", "credits": 6}
            ],
            "genEd": [
                {"name": "Humanities", "credits": 6},
                {"name": "Social Sciences", "credits": 6},
                {"name": "Composition", "credits": 4},
                {"name": "Advanced Composition", "credits": 3}
            ],
            "total_credits": 128
        }
    }
    
    # Default for unknown majors
    default_requirements = {
        "core": [
            {"name": "Major Core Courses", "credits": 24},
            {"name": "Math Courses", "credits": 12},
            {"name": "Science Courses", "credits": 8}
        ],
        "technical": [
            {"name": "Technical Electives", "credits": 12},
            {"name": "Free Electives", "credits": 6}
        ],
        "genEd": [
            {"name": "Humanities", "credits": 6},
            {"name": "Social Sciences", "credits": 6},
            {"name": "Composition", "credits": 4},
            {"name": "Advanced Composition", "credits": 3}
        ],
        "total_credits": 128
    }
    
    # Get the requirements for the requested major, or use default if not found
    requirements = major_requirements.get(major, default_requirements)
    
    # If there's a track, we could customize requirements here
    if track:
        # Example: For CS majors with a Data Science track, modify technical electives
        if major == "Computer Science" and track == "Data Science":
            requirements["technical"] = [
                {"name": "Data Science Electives", "credits": 12},
                {"name": "Free Electives", "credits": 6}
            ]
    
    # Now let's add some recommended courses by looking up courses in the database
    requirements["recommended_courses"] = {"core": [], "technical": [], "genEd": []}
    
    # Only attempt to add recommended courses if we have a database connection
    if db_pool:
        try:
            conn = db_pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Example query to get core courses for a major
            # Adjust this query based on your actual database schema
            query = """
                SELECT 
                    CONCAT(Subject, ' ', Number) as code,
                    Title as title,
                    Description as description,
                    Credit_Hours as credits
                FROM courses
                WHERE Major = %s
                AND Is_Core = 1
                LIMIT 6
            """
            
            # This assumes your database has fields for Major and Is_Core
            # Adjust the query based on your actual schema
            cursor.execute(query, (major,))
            core_courses = cursor.fetchall()
            
            for course in core_courses:
                if course:
                    # Add category for frontend display
                    course["category"] = "core"
                    requirements["recommended_courses"]["core"].append(course)
            
            # You could add similar queries for technical and genEd courses
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"Database error fetching recommended courses: {str(e)}")
    
    return jsonify(requirements)

@app.route('/recommended-courses', methods=['GET'])
def get_recommended_courses():
    """
    Get recommended courses for a semester based on major, year, and term
    """
    major = request.args.get('major', '').strip()
    year = request.args.get('year', '1').strip()
    term = request.args.get('term', 'Fall').strip()
    
    if not major:
        return jsonify({"error": "Missing major parameter"}), 400
    
    # Convert year to int for comparison
    try:
        year_num = int(year)
    except ValueError:
        return jsonify({"error": "Invalid year parameter"}), 400
    
    # Default recommendations in case database lookup fails
    default_recommendations = [
        {"code": "MATH 220", "title": "Calculus I", "credits": 4, "category": "core"},
        {"code": "RHET 105", "title": "Writing and Research", "credits": 4, "category": "genEd"},
        {"code": "Science Elective", "title": "Science Course", "credits": 4, "category": "core"},
        {"code": "Humanities Elective", "title": "Humanities Gen Ed", "credits": 3, "category": "genEd"}
    ]
    
    # If we don't have a database connection, return default recommendations
    if not db_pool:
        return jsonify(default_recommendations)
    
    # Look up recommendations from the database
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Example query to get recommended courses from a database
        # Adjust this query based on your actual database schema
        query = """
            SELECT 
                CONCAT(Subject, ' ', Number) as code,
                Title as title,
                Description as description,
                Credit_Hours as credits,
                Course_Type as category
            FROM recommended_courses
            WHERE Major = %s
            AND Year = %s
            AND Term = %s
        """
        
        # This assumes you have a recommended_courses table
        # If you don't have this exact schema, you'll need to adjust the query
        cursor.execute(query, (major, year_num, term))
        courses = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # If we found courses, return them, otherwise use defaults
        if courses and len(courses) > 0:
            return jsonify(courses)
        else:
            return jsonify(default_recommendations)
            
    except Exception as e:
        print(f"Database error fetching recommended courses: {str(e)}")
        return jsonify(default_recommendations)

@app.route('/course-search', methods=['GET'])
def search_courses():
    """
    Search for courses by keyword or code
    """
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 2:
        return jsonify({"error": "Search query must be at least 2 characters"}), 400
    
    # If we don't have a database connection, return an empty list
    if not db_pool:
        return jsonify([])
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Search for courses in the database
        search_query = """
            SELECT 
                CONCAT(Subject, ' ', Number) as code,
                Title as title,
                Description as description,
                Credit_Hours as credits
            FROM courses
            WHERE 
                Subject LIKE %s OR
                Number LIKE %s OR
                Title LIKE %s OR
                Description LIKE %s
            LIMIT 20
        """
        
        # Use wildcards to search for the query in different fields
        search_param = f"%{query}%"
        cursor.execute(search_query, (search_param, search_param, search_param, search_param))
        courses = cursor.fetchall()
        
        # Add a category field to each course for frontend display
        # In a real app, this might come from the database
        for course in courses:
            # Ensure credits is properly formatted as a number
            if isinstance(course["credits"], str):
                try:
                    # Try to extract just the number part if it has text like "3 hours"
                    credit_match = re.search(r'(\d+)', course["credits"])
                    if credit_match:
                        course["credits"] = int(credit_match.group(1))
                    else:
                        course["credits"] = int(course["credits"])
                except (ValueError, TypeError):
                    course["credits"] = 3  # Default if parsing fails
            elif course["credits"] is None:
                course["credits"] = 3  # Default if null
            
            # Simplified logic to categorize courses - adjust based on your needs
            if course["code"].startswith(("MATH", "PHYS", "CHEM")):
                course["category"] = "core"
            elif course["code"].startswith(("RHET", "ENGL", "HIST", "PSYC")):
                course["category"] = "genEd"
            else:
                course["category"] = "technical"
        
        cursor.close()
        conn.close()
        
        return jsonify(courses)
        
    except Exception as e:
        print(f"Database error searching courses: {str(e)}")
        return jsonify([])

@app.route('/course-plan-recommendations', methods=['GET'])
def get_course_plan_recommendations():
    """
    Get recommended courses for a course plan based on major, track, and academic year
    """
    major = request.args.get('major', '').strip()
    track = request.args.get('track', '').strip()
    academic_year = request.args.get('academicYear', '').strip()
    grad_year = request.args.get('gradYear', '').strip()
    
    if not major or not academic_year:
        return jsonify({"error": "Missing required parameters"}), 400
    
    # Calculate how many semesters to plan for
    current_year = 2025  # Update this to current year in production
    graduation_year = int(grad_year)
    years_left = graduation_year - current_year + 1
    
    # Map academic_year to numeric value
    year_mapping = {
        'freshman': 1,
        'sophomore': 2,
        'junior': 3,
        'senior': 4
    }
    
    start_year = year_mapping.get(academic_year.lower(), 1)
    
    # Build a course plan
    course_plan = {}
    
    # Default recommendations for different years and semesters
    default_recommendations = {
        1: {  # Freshman
            'Fall': [
                {"code": "MATH 220", "title": "Calculus I", "credits": 4, "category": "core"},
                {"code": "RHET 105", "title": "Writing and Research", "credits": 4, "category": "genEd"},
                {"code": "CS 101", "title": "Intro to Computing", "credits": 3, "category": "core"},
                {"code": "PHYS 211", "title": "University Physics: Mechanics", "credits": 4, "category": "core"}
            ],
            'Spring': [
                {"code": "MATH 221", "title": "Calculus II", "credits": 4, "category": "core"},
                {"code": "CS 125", "title": "Intro to Computer Science", "credits": 4, "category": "core"},
                {"code": "PHYS 212", "title": "University Physics: Elec & Mag", "credits": 4, "category": "core"},
                {"code": "GenEd Elective", "title": "Humanities/Social Science", "credits": 3, "category": "genEd"}
            ]
        },
        2: {  # Sophomore
            'Fall': [
                {"code": "MATH 231", "title": "Calculus III", "credits": 3, "category": "core"},
                {"code": "CS 225", "title": "Data Structures", "credits": 4, "category": "core"},
                {"code": "ECE 120", "title": "Intro to Computing", "credits": 4, "category": "core"},
                {"code": "GenEd Elective", "title": "Humanities/Social Science", "credits": 3, "category": "genEd"}
            ],
            'Spring': [
                {"code": "MATH 241", "title": "Differential Equations", "credits": 3, "category": "core"},
                {"code": "CS 233", "title": "Computer Architecture", "credits": 4, "category": "core"},
                {"code": "ECE 220", "title": "Computer Systems & Programming", "credits": 4, "category": "core"},
                {"code": "GenEd Elective", "title": "Humanities/Social Science", "credits": 3, "category": "genEd"}
            ]
        },
        3: {  # Junior
            'Fall': [
                {"code": "CS 241", "title": "System Programming", "credits": 4, "category": "core"},
                {"code": "CS 357", "title": "Numerical Methods", "credits": 3, "category": "core"},
                {"code": "Technical Elective", "title": "Technical Elective", "credits": 3, "category": "technical"},
                {"code": "GenEd Elective", "title": "Humanities/Social Science", "credits": 3, "category": "genEd"}
            ],
            'Spring': [
                {"code": "CS 374", "title": "Algorithms & Models of Computation", "credits": 4, "category": "core"},
                {"code": "CS 421", "title": "Programming Languages", "credits": 3, "category": "core"},
                {"code": "Technical Elective", "title": "Technical Elective", "credits": 3, "category": "technical"},
                {"code": "Free Elective", "title": "Free Elective", "credits": 3, "category": "technical"}
            ]
        },
        4: {  # Senior
            'Fall': [
                {"code": "CS 411", "title": "Database Systems", "credits": 3, "category": "core"},
                {"code": "CS 431", "title": "Embedded Systems", "credits": 3, "category": "core"},
                {"code": "Technical Elective", "title": "Technical Elective", "credits": 3, "category": "technical"},
                {"code": "Free Elective", "title": "Free Elective", "credits": 3, "category": "technical"}
            ],
            'Spring': [
                {"code": "CS 461", "title": "Computer Security", "credits": 4, "category": "core"},
                {"code": "Technical Elective", "title": "Technical Elective", "credits": 3, "category": "technical"},
                {"code": "Technical Elective", "title": "Technical Elective", "credits": 3, "category": "technical"},
                {"code": "Free Elective", "title": "Free Elective", "credits": 3, "category": "technical"}
            ]
        }
    }
    
    # Check if we have major-specific recommendations in the database
    has_db_recommendations = False
    
    if db_pool:
        try:
            conn = db_pool.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Check if we have recommendations for this major
            query = """
                SELECT COUNT(*) as count
                FROM recommended_courses
                WHERE Major = %s
            """
            cursor.execute(query, (major,))
            result = cursor.fetchone()
            
            has_db_recommendations = result and result['count'] > 0
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Database error checking for recommendations: {str(e)}")
    
    # Build course plan
    for year in range(start_year, min(start_year + years_left, 5)):
        for term in ['Fall', 'Spring']:
            # Key for the semester in the plan
            current_year_num = current_year + (year - start_year)
            if term == 'Spring':
                current_year_num += 1
                
            semester_key = f"{term.lower()}-{current_year_num}"
            
            # Get recommendations from database if available
            if has_db_recommendations and db_pool:
                try:
                    conn = db_pool.get_connection()
                    cursor = conn.cursor(dictionary=True)
                    
                    query = """
                        SELECT 
                            CONCAT(Subject, ' ', Number) as code,
                            Title as title,
                            Credit_Hours as credits,
                            Course_Type as category
                        FROM recommended_courses
                        WHERE Major = %s
                        AND Year = %s
                        AND Term = %s
                    """
                    
                    if track:
                        query += " AND (Track = %s OR Track IS NULL OR Track = '')"
                        cursor.execute(query, (major, year, term, track))
                    else:
                        query += " AND (Track IS NULL OR Track = '')"
                        cursor.execute(query, (major, year, term))
                        
                    courses = cursor.fetchall()
                    
                    if courses and len(courses) > 0:
                        course_plan[semester_key] = courses
                    else:
                        # Fallback to default if no specific recommendations
                        course_plan[semester_key] = default_recommendations.get(year, {}).get(term, [])
                    
                    cursor.close()
                    conn.close()
                except Exception as e:
                    print(f"Database error fetching plan recommendations: {str(e)}")
                    # Fallback to default recommendations
                    course_plan[semester_key] = default_recommendations.get(year, {}).get(term, [])
            else:
                # Use default recommendations
                course_plan[semester_key] = default_recommendations.get(year, {}).get(term, [])
    
    return jsonify(course_plan)




# Add this route to your backend.py file

@app.route('/majors', methods=['GET'])
def get_majors():
    """
    Get the list of all majors from the database
    """
    # If we don't have a database connection, return an empty list
    if not db_pool:
        return jsonify([])
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Query to get all majors from the Majors table
        query = """
            SELECT major_id, major_name
            FROM coursepilot.Majors
            ORDER BY major_name
        """
        
        cursor.execute(query)
        majors = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(majors)
        
    except Exception as e:
        print(f"Database error fetching majors: {str(e)}")
        return jsonify([])
    
@app.route('/grade-distribution', methods=['GET'])
def get_grade_distribution():
    """
    Get the grade distribution for a specific course
    """
    department = request.args.get('department', '').upper()
    course_number = request.args.get('courseNumber', '')
    
    if not department or not course_number:
        return jsonify({"error": "Missing department or course number"}), 400
        
    if not db_pool:
        return jsonify({"error": "Database connection not available"}), 500
        
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Query to get grade distribution for the specific course
        query = """
            SELECT 
                `Subject`, `Number`, `Course Title`,
                `A+`, `A`, `A-`, 
                `B+`, `B`, `B-`, 
                `C+`, `C`, `C-`, 
                `D+`, `D`, `D-`, 
                `F`, `W`, 
                `Total Students`, `GPA`
            FROM gpa_raw
            WHERE `Subject` = %s AND `Number` = %s
        """
        
        cursor.execute(query, (department, course_number))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not result:
            return jsonify({"error": "No grade data found for this course"}), 404
            
        # Process the data for easier visualization
        grades = [
            {"grade": "A+", "count": result["A+"]},
            {"grade": "A", "count": result["A"]},
            {"grade": "A-", "count": result["A-"]},
            {"grade": "B+", "count": result["B+"]},
            {"grade": "B", "count": result["B"]},
            {"grade": "B-", "count": result["B-"]},
            {"grade": "C+", "count": result["C+"]},
            {"grade": "C", "count": result["C"]},
            {"grade": "C-", "count": result["C-"]},
            {"grade": "D+", "count": result["D+"]},
            {"grade": "D", "count": result["D"]},
            {"grade": "D-", "count": result["D-"]},
            {"grade": "F", "count": result["F"]},
            {"grade": "W", "count": result["W"]}
        ]
        
        return jsonify({
            "course": f"{result['Subject']} {result['Number']}: {result['Course Title']}",
            "grades": grades,
            "total_students": result["Total Students"],
            "gpa": result["GPA"]
        })
        
    except Exception as e:
        print(f"Database error fetching grade distribution: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
# Run the app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5500))
    app.run(debug=True, host='0.0.0.0', port=port)