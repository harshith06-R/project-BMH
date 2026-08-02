#!/usr/bin/env python3
"""
Backend API Test Suite for LateTrack AI
Tests all backend endpoints with comprehensive scenarios
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Base URL for API
BASE_URL = "http://localhost:3000/api"

# Test data storage
created_student_id = None
created_student_id_2 = None

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    return success

def validate_uuid(value, field_name):
    """Validate that a value is a valid UUID format"""
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)
    if not uuid_pattern.match(str(value)):
        print(f"❌ FAIL: {field_name} is not a valid UUID: {value}")
        return False
    return True

def check_no_mongo_id(obj, path=""):
    """Recursively check that no _id fields exist in response"""
    if isinstance(obj, dict):
        if '_id' in obj:
            print(f"❌ FAIL: Found _id field at {path}")
            return False
        for key, value in obj.items():
            if not check_no_mongo_id(value, f"{path}.{key}"):
                return False
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if not check_no_mongo_id(item, f"{path}[{i}]"):
                return False
    return True

# ============================================================================
# TEST 1: POST /api/students - Create student
# ============================================================================
def test_create_student():
    global created_student_id
    print_test_header("1. POST /api/students - Create student")
    
    try:
        # Generate 128-length float array for face descriptor
        face_descriptor = [float(i % 100) / 100.0 for i in range(128)]
        
        payload = {
            "rollNumber": "CS2024001",
            "fullName": "Arjun Kumar",
            "department": "CSE",
            "year": "2",
            "parentEmail": "arjun.parent@example.com",
            "parentMobile": "+91-9876543210",
            "faceDescriptor": face_descriptor,
            "photoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
        
        response = requests.post(f"{BASE_URL}/students", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 201:
            return print_result(False, f"Expected status 201, got {response.status_code}")
        
        data = response.json()
        
        # Check structure
        if 'student' not in data:
            return print_result(False, "Response missing 'student' field")
        
        student = data['student']
        
        # Validate UUID
        if 'id' not in student:
            return print_result(False, "Student missing 'id' field")
        
        if not validate_uuid(student['id'], 'student.id'):
            return print_result(False, "Invalid UUID format")
        
        # Check no _id field
        if not check_no_mongo_id(data):
            return print_result(False, "_id field found in response")
        
        # Verify all fields
        if student['rollNumber'] != payload['rollNumber']:
            return print_result(False, f"rollNumber mismatch")
        
        if student['fullName'] != payload['fullName']:
            return print_result(False, f"fullName mismatch")
        
        if len(student['faceDescriptor']) != 128:
            return print_result(False, f"faceDescriptor should have 128 elements, got {len(student['faceDescriptor'])}")
        
        created_student_id = student['id']
        return print_result(True, f"Student created successfully with UUID: {created_student_id}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 2: POST /api/students - Duplicate rollNumber (409)
# ============================================================================
def test_duplicate_student():
    print_test_header("2. POST /api/students - Duplicate rollNumber (expect 409)")
    
    try:
        face_descriptor = [float(i % 100) / 100.0 for i in range(128)]
        
        payload = {
            "rollNumber": "CS2024001",  # Same as test 1
            "fullName": "Different Name",
            "department": "ECE",
            "year": "1",
            "parentEmail": "different@example.com",
            "parentMobile": "+91-9999999999",
            "faceDescriptor": face_descriptor,
            "photoUrl": ""
        }
        
        response = requests.post(f"{BASE_URL}/students", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 409:
            return print_result(False, f"Expected status 409 for duplicate, got {response.status_code}")
        
        data = response.json()
        if 'error' not in data:
            return print_result(False, "Expected error message in response")
        
        return print_result(True, "Duplicate rollNumber correctly rejected with 409")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 3: GET /api/students - List all students
# ============================================================================
def test_get_students():
    global created_student_id_2
    print_test_header("3. GET /api/students - List all students")
    
    try:
        # First create another student for better testing
        face_descriptor = [float(i % 100) / 100.0 for i in range(128)]
        payload = {
            "rollNumber": "EC2024002",
            "fullName": "Priya Sharma",
            "department": "ECE",
            "year": "1",
            "parentEmail": "priya.parent@example.com",
            "parentMobile": "+91-9876543211",
            "faceDescriptor": face_descriptor,
            "photoUrl": ""
        }
        create_resp = requests.post(f"{BASE_URL}/students", json=payload, timeout=10)
        if create_resp.status_code == 201:
            created_student_id_2 = create_resp.json()['student']['id']
            print(f"Created second student: {created_student_id_2}")
        
        # Now get all students
        response = requests.get(f"{BASE_URL}/students", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: Found {len(data.get('students', []))} students")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        if 'students' not in data:
            return print_result(False, "Response missing 'students' field")
        
        students = data['students']
        
        if len(students) < 2:
            return print_result(False, f"Expected at least 2 students, got {len(students)}")
        
        # Check first student has required fields
        student = students[0]
        required_fields = ['id', 'rollNumber', 'fullName', 'department', 'year', 'lateCount', 'totalCount']
        for field in required_fields:
            if field not in student:
                return print_result(False, f"Student missing required field: {field}")
        
        # Validate UUID
        if not validate_uuid(student['id'], 'student.id'):
            return print_result(False, "Invalid UUID in student list")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return print_result(False, "_id field found in response")
        
        return print_result(True, f"Retrieved {len(students)} students with lateCount and totalCount")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 4: GET /api/students with filters
# ============================================================================
def test_get_students_filters():
    print_test_header("4. GET /api/students - Test filters (q, department, year)")
    
    all_passed = True
    
    try:
        # Test 4a: Filter by partial name
        print("\n--- Test 4a: Filter by name (q=Arjun) ---")
        response = requests.get(f"{BASE_URL}/students?q=Arjun", timeout=10)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        students = data.get('students', [])
        print(f"Found {len(students)} students")
        
        if response.status_code != 200:
            all_passed = False
            print_result(False, f"Expected status 200, got {response.status_code}")
        elif len(students) == 0:
            all_passed = False
            print_result(False, "Expected to find student with name 'Arjun'")
        else:
            found = any('Arjun' in s.get('fullName', '') for s in students)
            if found:
                print_result(True, f"Name filter working: found {len(students)} student(s)")
            else:
                all_passed = False
                print_result(False, "Name filter not working correctly")
        
        # Test 4b: Filter by department
        print("\n--- Test 4b: Filter by department (department=CSE) ---")
        response = requests.get(f"{BASE_URL}/students?department=CSE", timeout=10)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        students = data.get('students', [])
        print(f"Found {len(students)} students")
        
        if response.status_code != 200:
            all_passed = False
            print_result(False, f"Expected status 200, got {response.status_code}")
        elif len(students) == 0:
            all_passed = False
            print_result(False, "Expected to find CSE students")
        else:
            all_cse = all(s.get('department') == 'CSE' for s in students)
            if all_cse:
                print_result(True, f"Department filter working: found {len(students)} CSE student(s)")
            else:
                all_passed = False
                print_result(False, "Department filter returned non-CSE students")
        
        # Test 4c: Filter by year
        print("\n--- Test 4c: Filter by year (year=1) ---")
        response = requests.get(f"{BASE_URL}/students?year=1", timeout=10)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        students = data.get('students', [])
        print(f"Found {len(students)} students")
        
        if response.status_code != 200:
            all_passed = False
            print_result(False, f"Expected status 200, got {response.status_code}")
        else:
            # Year filter should work
            print_result(True, f"Year filter executed: found {len(students)} student(s)")
        
        return all_passed
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 5: GET /api/students/{id} - Get student by ID
# ============================================================================
def test_get_student_by_id():
    print_test_header("5. GET /api/students/{id} - Get student by ID")
    
    if not created_student_id:
        return print_result(False, "No student ID available from previous tests")
    
    try:
        response = requests.get(f"{BASE_URL}/students/{created_student_id}", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)[:500]}...")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        data = response.json()
        
        if 'student' not in data:
            return print_result(False, "Response missing 'student' field")
        
        if 'history' not in data:
            return print_result(False, "Response missing 'history' field")
        
        student = data['student']
        history = data['history']
        
        if student['id'] != created_student_id:
            return print_result(False, f"Student ID mismatch")
        
        if not isinstance(history, list):
            return print_result(False, "History should be an array")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return print_result(False, "_id field found in response")
        
        return print_result(True, f"Retrieved student with {len(history)} history records")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 6: POST /api/attendance - Log attendance (ON_TIME)
# ============================================================================
def test_attendance_on_time():
    print_test_header("6a. POST /api/attendance - ON_TIME scenario")
    
    if not created_student_id:
        return print_result(False, "No student ID available")
    
    try:
        # Arrival at 08:30 (before 09:00 cutoff)
        arrival_time = datetime.now().replace(hour=8, minute=30, second=0, microsecond=0)
        
        payload = {
            "studentId": created_student_id,
            "arrivalTime": arrival_time.isoformat(),
            "cutoffMinutes": 540,  # 09:00
            "capturedImage": "data:image/png;base64,captured123"
        }
        
        response = requests.post(f"{BASE_URL}/attendance", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        data = response.json()
        
        if 'log' not in data or 'student' not in data:
            return print_result(False, "Response missing 'log' or 'student' field")
        
        log = data['log']
        
        # Validate UUID
        if not validate_uuid(log['id'], 'log.id'):
            return print_result(False, "Invalid UUID in log")
        
        # Check status
        if log['status'] != 'ON_TIME':
            return print_result(False, f"Expected status ON_TIME, got {log['status']}")
        
        # Check lateDurationMinutes
        if log['lateDurationMinutes'] != 0:
            return print_result(False, f"Expected lateDurationMinutes 0, got {log['lateDurationMinutes']}")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return print_result(False, "_id field found in response")
        
        return print_result(True, f"ON_TIME attendance logged correctly (lateDurationMinutes: 0)")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 7: POST /api/attendance - Log attendance (LATE)
# ============================================================================
def test_attendance_late():
    print_test_header("6b. POST /api/attendance - LATE scenario")
    
    if not created_student_id_2:
        return print_result(False, "No second student ID available")
    
    try:
        # Arrival at 09:24 (24 minutes after 09:00 cutoff)
        arrival_time = datetime.now().replace(hour=9, minute=24, second=0, microsecond=0)
        
        payload = {
            "studentId": created_student_id_2,
            "arrivalTime": arrival_time.isoformat(),
            "cutoffMinutes": 540,  # 09:00
            "capturedImage": "data:image/png;base64,captured456"
        }
        
        response = requests.post(f"{BASE_URL}/attendance", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        data = response.json()
        
        if 'log' not in data or 'student' not in data:
            return print_result(False, "Response missing 'log' or 'student' field")
        
        log = data['log']
        
        # Check status
        if log['status'] != 'LATE':
            return print_result(False, f"Expected status LATE, got {log['status']}")
        
        # Check lateDurationMinutes (should be 24)
        if log['lateDurationMinutes'] != 24:
            return print_result(False, f"Expected lateDurationMinutes 24, got {log['lateDurationMinutes']}")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return print_result(False, "_id field found in response")
        
        return print_result(True, f"LATE attendance logged correctly (lateDurationMinutes: 24)")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 8: POST /api/attendance - Duplicate same day
# ============================================================================
def test_attendance_duplicate():
    print_test_header("7. POST /api/attendance - Duplicate same day")
    
    if not created_student_id:
        return print_result(False, "No student ID available")
    
    try:
        # Try to log attendance for same student again today
        arrival_time = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)
        
        payload = {
            "studentId": created_student_id,
            "arrivalTime": arrival_time.isoformat(),
            "cutoffMinutes": 540,
            "capturedImage": "data:image/png;base64,duplicate"
        }
        
        response = requests.post(f"{BASE_URL}/attendance", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        data = response.json()
        
        if 'duplicate' not in data or data['duplicate'] != True:
            return print_result(False, "Expected duplicate:true in response")
        
        return print_result(True, "Duplicate detection working correctly")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 9: GET /api/attendance - List attendance logs
# ============================================================================
def test_get_attendance():
    print_test_header("8. GET /api/attendance - List attendance logs")
    
    try:
        response = requests.get(f"{BASE_URL}/attendance", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: Found {len(data.get('logs', []))} logs")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        if 'logs' not in data:
            return print_result(False, "Response missing 'logs' field")
        
        logs = data['logs']
        
        if len(logs) < 2:
            return print_result(False, f"Expected at least 2 logs, got {len(logs)}")
        
        # Check first log has student joined
        log = logs[0]
        if 'student' not in log:
            return print_result(False, "Log missing joined 'student' field")
        
        if log['student'] is None:
            return print_result(False, "Student should be joined, got null")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return print_result(False, "_id field found in response")
        
        return print_result(True, f"Retrieved {len(logs)} logs with student data joined")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 10: GET /api/attendance with filters
# ============================================================================
def test_get_attendance_filters():
    print_test_header("9. GET /api/attendance - Test filters (status, department)")
    
    all_passed = True
    
    try:
        # Test 10a: Filter by status=LATE
        print("\n--- Test 10a: Filter by status=LATE ---")
        response = requests.get(f"{BASE_URL}/attendance?status=LATE", timeout=10)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        logs = data.get('logs', [])
        print(f"Found {len(logs)} LATE logs")
        
        if response.status_code != 200:
            all_passed = False
            print_result(False, f"Expected status 200, got {response.status_code}")
        elif len(logs) == 0:
            all_passed = False
            print_result(False, "Expected to find LATE logs")
        else:
            all_late = all(log.get('status') == 'LATE' for log in logs)
            if all_late:
                print_result(True, f"Status filter working: found {len(logs)} LATE log(s)")
            else:
                all_passed = False
                print_result(False, "Status filter returned non-LATE logs")
        
        # Test 10b: Filter by department=CSE
        print("\n--- Test 10b: Filter by department=CSE ---")
        response = requests.get(f"{BASE_URL}/attendance?department=CSE", timeout=10)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        logs = data.get('logs', [])
        print(f"Found {len(logs)} logs for CSE department")
        
        if response.status_code != 200:
            all_passed = False
            print_result(False, f"Expected status 200, got {response.status_code}")
        else:
            # Check that all logs have CSE students
            all_cse = all(log.get('student', {}).get('department') == 'CSE' for log in logs if log.get('student'))
            if all_cse and len(logs) > 0:
                print_result(True, f"Department filter working: found {len(logs)} CSE log(s)")
            elif len(logs) == 0:
                print_result(True, "Department filter executed (no CSE logs found)")
            else:
                all_passed = False
                print_result(False, "Department filter returned non-CSE logs")
        
        return all_passed
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 11: GET /api/stats
# ============================================================================
def test_get_stats():
    print_test_header("10. GET /api/stats - Statistics endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        data = response.json()
        
        required_fields = ['totalStudents', 'todayLate', 'todayOnTime', 'peakArrivalTime', 'repeatOffenders']
        for field in required_fields:
            if field not in data:
                return print_result(False, f"Response missing required field: {field}")
        
        # Validate data types
        if not isinstance(data['totalStudents'], int):
            return print_result(False, "totalStudents should be integer")
        
        if not isinstance(data['todayLate'], int):
            return print_result(False, "todayLate should be integer")
        
        if not isinstance(data['todayOnTime'], int):
            return print_result(False, "todayOnTime should be integer")
        
        if not isinstance(data['repeatOffenders'], int):
            return print_result(False, "repeatOffenders should be integer")
        
        print(f"Stats: {data['totalStudents']} students, {data['todayLate']} late today, {data['todayOnTime']} on-time today")
        
        return print_result(True, "Stats endpoint returning all required fields")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 12: GET /api/analytics
# ============================================================================
def test_get_analytics():
    print_test_header("11. GET /api/analytics - Analytics endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/analytics", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        required_fields = ['dailyTrend', 'departmentData', 'topOffenders']
        for field in required_fields:
            if field not in data:
                return print_result(False, f"Response missing required field: {field}")
        
        # Validate dailyTrend
        daily_trend = data['dailyTrend']
        if not isinstance(daily_trend, list):
            return print_result(False, "dailyTrend should be array")
        
        if len(daily_trend) != 7:
            return print_result(False, f"dailyTrend should have 7 items, got {len(daily_trend)}")
        
        if len(daily_trend) > 0:
            day = daily_trend[0]
            if 'date' not in day or 'late' not in day or 'onTime' not in day:
                return print_result(False, "dailyTrend items missing required fields")
        
        # Validate departmentData
        dept_data = data['departmentData']
        if not isinstance(dept_data, list):
            return print_result(False, "departmentData should be array")
        
        # Validate topOffenders
        offenders = data['topOffenders']
        if not isinstance(offenders, list):
            return print_result(False, "topOffenders should be array")
        
        if len(offenders) > 10:
            return print_result(False, f"topOffenders should have max 10 items, got {len(offenders)}")
        
        print(f"Analytics: {len(daily_trend)} days, {len(dept_data)} departments, {len(offenders)} top offenders")
        
        return print_result(True, "Analytics endpoint returning all required data structures")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# TEST 13: DELETE /api/students/{id}
# ============================================================================
def test_delete_student():
    print_test_header("12. DELETE /api/students/{id} - Delete student and logs")
    
    if not created_student_id:
        return print_result(False, "No student ID available")
    
    try:
        # Delete the student
        response = requests.delete(f"{BASE_URL}/students/{created_student_id}", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            return print_result(False, f"Expected status 200, got {response.status_code}")
        
        # Verify student is deleted - should get 404
        print("\nVerifying student is deleted...")
        get_response = requests.get(f"{BASE_URL}/students/{created_student_id}", timeout=10)
        print(f"GET Status Code: {get_response.status_code}")
        
        if get_response.status_code != 404:
            return print_result(False, f"Expected 404 after deletion, got {get_response.status_code}")
        
        return print_result(True, "Student and associated logs deleted successfully")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print("\n" + "="*80)
    print("LATETRACK AI - BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    
    results = []
    
    # Run all tests in sequence
    results.append(("Create Student", test_create_student()))
    results.append(("Duplicate Student (409)", test_duplicate_student()))
    results.append(("Get Students List", test_get_students()))
    results.append(("Get Students with Filters", test_get_students_filters()))
    results.append(("Get Student by ID", test_get_student_by_id()))
    results.append(("Attendance ON_TIME", test_attendance_on_time()))
    results.append(("Attendance LATE", test_attendance_late()))
    results.append(("Attendance Duplicate", test_attendance_duplicate()))
    results.append(("Get Attendance Logs", test_get_attendance()))
    results.append(("Get Attendance with Filters", test_get_attendance_filters()))
    results.append(("Get Stats", test_get_stats()))
    results.append(("Get Analytics", test_get_analytics()))
    results.append(("Delete Student", test_delete_student()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed")
    print(f"{'='*80}\n")
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
