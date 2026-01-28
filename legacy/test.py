import requests
import xml.etree.ElementTree as ET
import json
import re
from mysql.connector import pooling
from dotenv import load_dotenv
import os

load_dotenv();

db_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,  # Number of connections in the pool
    host= os.getenv("HOST"),
    user= os.getenv("NAME"),
    password= os.getenv("PASSWORD"),
    database= os.getenv("DATABASE")
)

def raw_course_data(url, year, semester, department, courseNumber, params=None): # Get all raw data
    try:
        courseUrl = f"{url}/{year}/{semester}/{department}/{courseNumber}.xml"
        response = requests.get(courseUrl, params=params)
        response.raise_for_status()  
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def extract_tag(rawData, tag): # Filter data per tag (title, credit, description, etc.)
    try:
        root = ET.fromstring(rawData)
        element = root.find(f".//{tag}")
        # Check if element exists and has text
        return element.text if element is not None else None
    except ET.ParseError as e:
        print(f"Error parsing XML: {e}")
        return None
    
def get_prerequisite(sectionInformation): # Only get prerequisite course numbers
    if not sectionInformation:
        return None
    
    range = re.search(r"Prerequisite:(.*?)[.]", sectionInformation, re.IGNORECASE)
    if range:
        sectionInformation = range.group(1).strip()
    possibleCourses = re.findall(r"\b[A-Z]{2,4} \d{3}\b", sectionInformation)
    return possibleCourses

def get_gpa(subject, number):
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
    return result[0] if result else f"No GPA found for {subject} {number}"

if __name__ == "__main__":
    base_url = "http://courses.illinois.edu/cisapp/explorer/schedule"
    department = str(input("Please enter department: ")).upper()
    courseNumber = int(input("Please enter course number: "))
    print(f"Loading data for {department} {courseNumber}...")
    courses_data = raw_course_data(base_url, "2024", "Fall", department, courseNumber)

    # courses_data = raw_course_data(base_url,"2024", "Fall", "ECE", "220")
    if courses_data:
        term = extract_tag(courses_data, "term")
        title = extract_tag(courses_data, "label")
        credit_hours = extract_tag(courses_data, "creditHours")  # Add this line
        description = extract_tag(courses_data, "description")
        sectionInformation = extract_tag(courses_data, "courseSectionInformation")
        prerequisite = get_prerequisite(sectionInformation)

        print (json.dumps({
            "term": term,
            "title": title,
            "description": description,
            "prerequisite": prerequisite,
            "average gpa": float(get_gpa(department, courseNumber)),
            "credit_hours": credit_hours
        }, indent=2))