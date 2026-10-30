# Human Resources - Intelligent Candidate Matching and Interview Automation

This system demonstrates AI-based intelligent candidate matching using keyword extraction and rule-based scoring techniques integrated with database storage.

## Project Structure

```
RR/
├── backend/
│   ├── database.sql    # MySQL database setup script
│   ├── server.js       # Node.js + Express backend server
│   └── package.json    # Backend dependencies
├── frontend/
│   ├── index.html      # Main dashboard HTML
│   ├── style.css      # Professional HR styling
│   └── script.js       # Frontend JavaScript
└── README.md           # This file
```

## Prerequisites

1. **Node.js** - Download and install from https://nodejs.org
2. **MySQL** - Download and install from https://www.mysql.com or use XAMPP/WAMP

## Installation & Setup

### Step 1: Set Up MySQL Database

1. Start MySQL server
2. Open MySQL Workbench or any MySQL client
3. Run the SQL commands from `backend/database.sql`:

```sql
CREATE DATABASE hr_system;
USE hr_system;

CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    job_role VARCHAR(100) NOT NULL,
    resume_text TEXT,
    match_score INT DEFAULT 0,
    interview_score INT DEFAULT 0,
    final_recommendation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Note:** If your MySQL has a password, update the password in `backend/server.js`:
```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'YOUR_PASSWORD',  // Update this
    database: 'hr_system'
});
```

### Step 2: Install Backend Dependencies

Open a terminal and run:

```bash
cd backend
npm install
```

This will install:
- express (Web framework)
- mysql2 (MySQL database driver)
- cors (Cross-origin resource sharing)
- body-parser (Request body parsing)

### Step 3: Start the Backend Server

```bash
npm start
```

The server will start on http://localhost:3000

### Step 4: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## How to Use

### 1. Candidate Information
- Fill in the candidate's name, email, and select a job role
- Paste the candidate's resume or skills summary in the text area
- Click "Analyze Resume"

### 2. Resume Match Analysis
- View the match score (0-100%)
- See matched skills (green)
- See missing skills (gray)
- The system uses keyword matching to identify skills

### 3. Interview Section
- Answer the 5 automated interview questions
- Click "Evaluate Candidate" when done

### 4. Final Result
- View resume match score
- View interview score
- Get final recommendation:
  - ≥80%: Strongly Recommended
  - 60-79%: Recommended
  - 40-59%: Consider
  - <40%: Not Recommended

### 5. Admin View
- Click "Load All Candidates" to view stored candidates
- See all candidates with their scores and recommendations

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Analyze resume and calculate match score |
| `/evaluate` | POST | Evaluate interview and store candidate |
| `/candidates` | GET | Fetch all stored candidates |
| `/job-roles` | GET | Get available job roles |

## Job Roles Available

1. **Frontend Developer** - HTML, CSS, JavaScript, React, etc.
2. **Backend Developer** - Node.js, Express, Database, API, etc.
3. **Data Analyst** - Python, SQL, Excel, Data Visualization, etc.
4. **HR Manager** - Communication, Recruitment, Payroll, etc.

## Troubleshooting

### MySQL Connection Error
- Make sure MySQL is running
- Check the password in server.js
- Verify the database exists

### Port Already in Use
- Change the port in server.js
- Or stop any other process using port 3000

### CORS Errors
- Ensure CORS is properly configured in server.js

## Features

✓ Resume parsing and skill extraction
✓ Keyword-based matching algorithm
✓ Automated interview question generation
✓ Interview answer scoring
✓ Weighted final recommendation (40% resume, 60% interview)
✓ MySQL database storage
✓ Professional HR dashboard UI
✓ Responsive design
✓ Admin candidate database view

## License

ISC
