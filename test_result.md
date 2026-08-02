#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  LateTrack AI — Smart College Late-Comers Detection & Management Web App.
  Face recognition (browser-based via @vladmandic/face-api) captures students at the campus gate,
  matches against enrolled 128-D face embeddings, calculates exact late minutes vs a cutoff (default 09:00),
  logs to MongoDB, and shows HOD analytics + directory + logs export.

backend:
  - task: "Students CRUD API (POST/GET/GET-by-id/DELETE)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/students stores student with rollNumber, fullName, department, year, parentEmail, parentMobile, 128-D faceDescriptor array and photoUrl (dataURL). GET returns list with lateCount/totalCount joined from logs. GET /api/students/{id} returns student + history. DELETE removes student and their logs. Uniqueness enforced on rollNumber."
      - working: true
        agent: "testing"
        comment: "All CRUD operations tested and working correctly. POST creates student with UUID (201), duplicate rollNumber returns 409. GET returns students list with lateCount/totalCount. Filters (q, department, year) working. GET by ID returns student + history. DELETE removes student and logs (verified with 404). All responses use UUIDs, no _id fields exposed. Fixed bug where duplicate attendance log was returning _id field."

  - task: "Attendance logging API (POST /api/attendance, GET /api/attendance)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST accepts studentId, arrivalTime (ISO), cutoffMinutes (default 540), capturedImage. Computes lateDurationMinutes = max(0, minutesOfDay - cutoff) and status LATE/ON_TIME. Duplicate prevention: same student, same day returns existing log with duplicate:true. GET returns latest 500 logs joined with student, filterable by status and department."
      - working: true
        agent: "testing"
        comment: "Attendance logging fully functional. POST correctly calculates lateDurationMinutes and status (ON_TIME for 08:30 arrival = 0 minutes late, LATE for 09:24 arrival = 24 minutes late). Duplicate detection working (returns duplicate:true for same student same day). GET returns logs with student data joined. Filters (status=LATE, department=CSE) working correctly. All responses use UUIDs."

  - task: "Stats API (GET /api/stats)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns totalStudents, todayLate, todayOnTime, peakArrivalTime (peak hour from today logs), repeatOffenders (students with >=3 LATE logs)."
      - working: true
        agent: "testing"
        comment: "Stats endpoint working correctly. Returns all required fields: totalStudents (2), todayLate (1), todayOnTime (1), peakArrivalTime (08:00), repeatOffenders (0). All data types correct (integers for counts, string for time)."

  - task: "Analytics API (GET /api/analytics)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns dailyTrend (last 7 days, late & onTime counts by date), departmentData (LATE aggregated by department), topOffenders (top 10 LATE frequency with student object attached)."
      - working: true
        agent: "testing"
        comment: "Analytics endpoint working correctly. Returns dailyTrend (7 days with date, late, onTime counts), departmentData (array of {name, value}), topOffenders (max 10 items with student object and lateCount). All data structures correct."

frontend:
  - task: "Live AI Face Scanner UI"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Full LateTrack AI app is live at https://975a1725-02c1-4a1c-a3b1-f22bbf28a7e5.preview.emergentagent.com
          Sections: Home, Live Scanner (webcam+face-api), Register (3-step), Directory, Late Logs, Analytics.
          The app is now built for production (`next build && next start`). Preview environment appears to have slow client-side hydration.
          Please test navigation between sections, the "Populate Demo Data" button on Analytics (POST /api/seed), the CSV/PDF export on Late Logs page, the Parent SMS Alert modal on Analytics (needs Twilio creds — expect 501 if not set), and the Home hero CTAs.
          NOTE: The camera-based Scanner and Register-face-capture require a real webcam, so cannot be fully tested headless; focus on UI rendering and navigation.

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Please test the backend API only. Base URL: use relative /api paths against the running Next.js server.
      Endpoints to verify:
        1. POST /api/students with a sample payload including faceDescriptor as a 128-length float array. Confirm duplicate rollNumber returns 409.
        2. GET /api/students (with & without ?q=, ?department=, ?year= filters) — must return `students[]` with lateCount/totalCount fields.
        3. GET /api/students/{id} — returns { student, history }.
        4. DELETE /api/students/{id} — removes student and logs.
        5. POST /api/attendance with studentId, arrivalTime, cutoffMinutes (test both LATE and ON_TIME by choosing arrival times relative to cutoff). Verify lateDurationMinutes and status. Verify duplicate-same-day returns duplicate:true.
        6. GET /api/attendance with ?status=LATE and ?department=CSE filters. Ensure student object is joined.
        7. GET /api/stats — returns totalStudents, todayLate, todayOnTime, peakArrivalTime, repeatOffenders.
        8. GET /api/analytics — returns dailyTrend (7 days), departmentData, topOffenders.
      Notes: MongoDB is local (mongodb://localhost:27017), DB name from env DB_NAME (default latetrack_ai). Uses UUIDs (no Mongo ObjectID exposed).
  - agent: "testing"
    message: |
      Backend testing completed successfully. All 13 tests passed (13/13).
      
      TESTED ENDPOINTS:
      ✅ POST /api/students - Creates student with UUID, returns 201
      ✅ POST /api/students (duplicate) - Returns 409 for duplicate rollNumber
      ✅ GET /api/students - Returns list with lateCount/totalCount
      ✅ GET /api/students?q=&department=&year= - All filters working
      ✅ GET /api/students/{id} - Returns student + history array
      ✅ POST /api/attendance (ON_TIME) - Correctly calculates 0 lateDurationMinutes for 08:30 arrival
      ✅ POST /api/attendance (LATE) - Correctly calculates 24 lateDurationMinutes for 09:24 arrival
      ✅ POST /api/attendance (duplicate) - Returns duplicate:true for same student same day
      ✅ GET /api/attendance - Returns logs with student joined
      ✅ GET /api/attendance?status=LATE&department=CSE - Filters working
      ✅ GET /api/stats - Returns all required fields (totalStudents, todayLate, todayOnTime, peakArrivalTime, repeatOffenders)
      ✅ GET /api/analytics - Returns dailyTrend (7 days), departmentData, topOffenders
      ✅ DELETE /api/students/{id} - Removes student and logs, verified with 404
      
      BUG FIXED:
      - Fixed _id field exposure in duplicate attendance response (line 131 in route.js). Now properly strips _id field.
      
      VALIDATION CONFIRMED:
      - All responses use UUIDs (not MongoDB ObjectIDs)
      - No _id fields in any response
      - All status codes correct (201, 200, 404, 409)
      - All data structures match specification
      - Filtering and querying working correctly
      - Date/time calculations accurate
      
      All backend APIs are fully functional and ready for production use.