from flask import Flask, request, jsonify, send_from_directory
import requests
import xml.etree.ElementTree as ET
import re
from mysql.connector import pooling
from dotenv import load_dotenv
import os
import time

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
def raw_course_data(year, semester, department, courseNumber, params=None):
    """
    Fetch course data from University of Illinois API
    Fixed URL structure and added proper error handling
    """
    try:
        # Correct base URL with cisapp/explorer path
        base_url = "http://courses.illinois.edu/cisapp/explorer/schedule"
        
        # Ensure semester is lowercase as required by API
        semester = semester.lower()
        
        # Construct URL with .xml extension
        courseUrl = f"{base_url}/{year}/{semester}/{department}/{courseNumber}.xml"
        print(f"Requesting course data from: {courseUrl}")
        
        # Add headers to mimic browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        
        # Add a small delay to be respectful to the API
        time.sleep(0.5)
        
        response = requests.get(courseUrl, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"Course {department} {courseNumber} not found for {semester} {year}")
            return None
        elif e.response.status_code == 403:
            print(f"Access forbidden to course data. This might be due to rate limiting or API restrictions.")
            return None
        else:
            print(f"HTTP error fetching course data: {str(e)}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching course data: {str(e)}")
        return None

def extract_tag(rawData, tag):
    """Extract specific tag from XML data"""
    try:
        root = ET.fromstring(rawData)
        element = root.find(f".//{tag}")
        return element.text if element is not None else None
    except ET.ParseError as e:
        print(f"Error parsing XML: {str(e)}")
        return None

def get_prerequisite(sectionInformation):
    """Extract prerequisite courses from section information"""
    if not sectionInformation:
        return None
    range_match = re.search(r"Prerequisite:(.*?)[.]", sectionInformation, re.IGNORECASE)
    if range_match:
        sectionInformation = range_match.group(1).strip()
    return re.findall(r"\b[A-Z]{2,4} \d{3}\b", sectionInformation)

def get_gpa(subject, number):
    """Get GPA data from database"""
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
@app.route('/course', methods=['GET'])
def get_course_info():
    """Get course information from University of Illinois API"""
    year = request.args.get('year', '2024')
    semester = request.args.get('semester', 'fall')  # Default to lowercase
    department = request.args.get('department', '').upper()
    courseNumber = request.args.get('courseNumber', '')

    if not department or not courseNumber:
        return jsonify({"error": "Missing department or courseNumber"}), 400

    try:
        # Fetch course data with corrected function
        courses_data = raw_course_data(year, semester, department, courseNumber)
        if not courses_data:
            return jsonify({"error": "Unable to fetch course data. This could be due to the course not being offered in the specified semester or API limitations."}), 404

        # Extract information from XML
        term = extract_tag(courses_data, "term")
        title = extract_tag(courses_data, "label")
        description = extract_tag(courses_data, "description")
        sectionInformation = extract_tag(courses_data, "courseSectionInformation")
        creditHours = extract_tag(courses_data, "creditHours")
        
        # Parse prerequisites if available
        prerequisite_courses = None
        if sectionInformation:
            prerequisite_courses = get_prerequisite(sectionInformation)
        
        # Get GPA information from database
        gpa = get_gpa(department, courseNumber)

        return jsonify({
            "term": term,
            "title": title,
            "description": description,
            "creditHours": creditHours,
            "prerequisite": sectionInformation or "No prerequisites information available",
            "prerequisite_courses": prerequisite_courses,
            "average_gpa": gpa if gpa else "No GPA data found"
        })
        
    except Exception as e:
        print(f"Error processing course info: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/test-api', methods=['GET'])
def test_api():
    """Test endpoint to verify API connectivity"""
    try:
        # Test with a known course
        test_data = raw_course_data("2024", "fall", "CS", "173")
        if test_data:
            return jsonify({
                "status": "success",
                "message": "API is working",
                "sample_data_length": len(test_data)
            })
        else:
            return jsonify({
                "status": "error",
                "message": "API test failed"
            }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"API test error: {str(e)}"
        }), 500

@app.route('/available-years', methods=['GET'])
def get_available_years():
    """Get available years from the API"""
    try:
        url = "http://courses.illinois.edu/cisapp/explorer/schedule.xml"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse XML to extract years
        root = ET.fromstring(response.text)
        years = []
        for year_elem in root.findall(".//year"):
            year_id = year_elem.get('id')
            if year_id:
                years.append(year_id)
        
        return jsonify({"years": years})
        
    except Exception as e:
        print(f"Error fetching available years: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/course-search', methods=['GET'])
def search_courses():
    """Search for courses by keyword or code"""
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 2:
        return jsonify({"error": "Search query must be at least 2 characters"}), 400
    
    if not db_pool:
        return jsonify([])
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
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
        
        search_param = f"%{query}%"
        cursor.execute(search_query, (search_param, search_param, search_param, search_param))
        courses = cursor.fetchall()
        
        for course in courses:
            if isinstance(course["credits"], str):
                try:
                    credit_match = re.search(r'(\d+)', course["credits"])
                    if credit_match:
                        course["credits"] = int(credit_match.group(1))
                    else:
                        course["credits"] = int(course["credits"])
                except (ValueError, TypeError):
                    course["credits"] = 3
            elif course["credits"] is None:
                course["credits"] = 3
            
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

@app.route('/majors', methods=['GET'])
def get_majors():
    """Get the list of all majors from the database"""
    if not db_pool:
        return jsonify([])
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
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
    """Get the grade distribution for a specific course"""
    department = request.args.get('department', '').upper()
    course_number = request.args.get('courseNumber', '')
    
    if not department or not course_number:
        return jsonify({"error": "Missing department or course number"}), 400
        
    if not db_pool:
        return jsonify({"error": "Database connection not available"}), 500
        
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
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