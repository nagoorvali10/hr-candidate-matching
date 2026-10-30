

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// Middleware Configuration
// =====================================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =====================================================
// Multer Configuration for File Uploads
// =====================================================
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// =====================================================
// MySQL Database Connection
// =====================================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nagoorvali@786',
    database: 'job'
});

// Connect and create database/table if not exist
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        // Try connecting without database to create it
        const dbInit = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Abhi@2005'
        });
        dbInit.connect((err2) => {
            if (err2) {
                console.error('Cannot connect to MySQL at all:', err2.message);
                return;
            }
            console.log('Connected to MySQL, creating database...');
            dbInit.query('CREATE DATABASE IF NOT EXISTS job', (err3) => {
                if (err3) {
                    console.error('Error creating database:', err3.message);
                    return;
                }
                console.log('Database "job" created or already exists');
                dbInit.query('USE job', (err4) => {
                    const createTable = `
                        CREATE TABLE IF NOT EXISTS candidates (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            email VARCHAR(100) NOT NULL,
                            job_role VARCHAR(100) NOT NULL,
                            resume_text TEXT,
                            match_score INT DEFAULT 0,
                            interview_score INT DEFAULT 0,
                            final_recommendation VARCHAR(100),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `;
                    dbInit.query(createTable, (err5) => {
                        if (err5) {
                            console.error('Error creating table:', err5.message);
                        } else {
                            console.log('Table "candidates" created or already exists');
                        }
                        dbInit.end();
                    });
                });
            });
        });
    } else {
        console.log('Connected to MySQL database: job');
        // Create table if not exists
        db.query(`CREATE TABLE IF NOT EXISTS candidates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            job_role VARCHAR(100) NOT NULL,
            resume_text TEXT,
            match_score INT DEFAULT 0,
            interview_score INT DEFAULT 0,
            final_recommendation VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Table "candidates" ready');
            }
        });
    }
});

// =====================================================
// Job Roles and Required Skills Database
// =====================================================
const jobRoles = {
    'Frontend Developer': {
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design', 'TypeScript', 'Vue', 'Angular', 'Bootstrap', 'SASS', 'Webpack', 'REST API', 'Git'],
        questions: [
            'Describe your experience with HTML5 and CSS3. What are the new features in HTML5?',
            'Explain the React component lifecycle and state management.',
            'How do you ensure responsive design works across different devices?',
            'What is your experience with JavaScript ES6+ features?',
            'Describe a challenging frontend bug you solved and how you approached it.'
        ]
    },
    'Backend Developer': {
        skills: ['Node.js', 'Express', 'Database', 'API', 'Authentication', 'Python', 'Java', 'SQL', 'MongoDB', 'REST', 'GraphQL', 'Docker', 'AWS', 'Git'],
        questions: [
            'Explain the difference between SQL and NoSQL databases. When would you use each?',
            'Describe your experience with RESTful API design and best practices.',
            'How do you handle authentication and authorization in your applications?',
            'What is your experience with Node.js and Express framework?',
            'Describe a scenario where you optimized database queries for better performance.'
        ]
    },
    'Data Analyst': {
        skills: ['Python', 'SQL', 'Excel', 'Data Visualization', 'Statistics', 'Tableau', 'Power BI', 'Pandas', 'NumPy', 'Machine Learning', 'R', 'Data Mining'],
        questions: [
            'Describe your experience with Python for data analysis. What libraries do you use?',
            'How do you create effective data visualizations? What tools do you prefer?',
            'Explain the difference between correlation and causation in data analysis.',
            'What is your experience with SQL and complex queries?',
            'Describe a data analysis project where you derived actionable insights.'
        ]
    },
    'HR Manager': {
        skills: ['Communication', 'Recruitment', 'Payroll', 'Employee Relations', 'Leadership', 'Training', 'Compliance', 'Performance Management', 'HRIS', 'Conflict Resolution'],
        questions: [
            'Describe your experience with full-cycle recruitment and talent acquisition.',
            'How do you handle employee relations issues and conflicts?',
            'Explain your approach to performance management and appraisals.',
            'What HR systems and tools have you worked with?',
            'Describe a challenging HR situation and how you resolved it.'
        ]
    }
};

// =====================================================
// AI Logic Functions
// =====================================================

// Extract skills from resume text using keyword matching
function extractSkills(resumeText, requiredSkills) {
    const foundSkills = [];
    const resumeLower = resumeText.toLowerCase();
    
    for (const skill of requiredSkills) {
        const skillLower = skill.toLowerCase();
        // Check if skill keyword appears in resume
        if (resumeLower.includes(skillLower)) {
            foundSkills.push(skill);
        }
    }
    
    return foundSkills;
}

// Calculate match score based on skills found
function calculateMatchScore(foundSkills, requiredSkills) {
    if (requiredSkills.length === 0) return 0;
    return Math.round((foundSkills.length / requiredSkills.length) * 100);
}

// Get missing skills
function getMissingSkills(foundSkills, requiredSkills) {
    return requiredSkills.filter(skill => !foundSkills.includes(skill));
}

// Generate interview questions based on job role
function getInterviewQuestions(jobRole) {
    if (jobRoles[jobRole]) {
        return jobRoles[jobRole].questions;
    }
    return [
        'Tell us about your relevant experience for this role.',
        'What are your greatest strengths and weaknesses?',
        'Why are you interested in this position?',
        'Where do you see yourself in 5 years?',
        'Do you have any questions for us?'
    ];
}

// Calculate interview score based on answer keywords
function calculateInterviewScore(answers, jobRole) {
    const requiredSkills = jobRoles[jobRole] ? jobRoles[jobRole].skills : [];
    let totalScore = 0;
    
    for (const answer of answers) {
        const answerLower = answer.toLowerCase();
        let answerScore = 0;
        
        // Check for relevant keywords in the answer
        for (const skill of requiredSkills) {
            if (answerLower.includes(skill.toLowerCase())) {
                answerScore += 20;
            }
        }
        
        // Add base score for non-empty answers
        if (answer.length > 10) {
            answerScore += 10;
        }
        
        // Cap individual answer score at 100
        answerScore = Math.min(answerScore, 100);
        totalScore += answerScore;
    }
    
    // Average score across all questions
    const averageScore = Math.round(totalScore / answers.length);
    return Math.min(averageScore, 100);
}

// Generate final recommendation based on scores
function getFinalRecommendation(matchScore, interviewScore) {
    // Weighted average: 40% resume match, 60% interview
    const finalScore = Math.round((matchScore * 0.4) + (interviewScore * 0.6));
    
    if (finalScore >= 80) {
        return 'Strongly Recommended';
    } else if (finalScore >= 60) {
        return 'Recommended';
    } else if (finalScore >= 40) {
        return 'Consider';
    } else {
        return 'Not Recommended';
    }
}

// =====================================================
// API Routes
// =====================================================

// POST /analyze - Analyze resume and calculate match score
app.post('/analyze', (req, res) => {
    try {
        const { name, email, job_role, resume_text } = req.body;
        
        if (!name || !email || !job_role || !resume_text) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        const roleData = jobRoles[job_role];
        const requiredSkills = roleData ? roleData.skills : [];
        
        // Extract skills from resume
        const foundSkills = extractSkills(resume_text, requiredSkills);
        const matchScore = calculateMatchScore(foundSkills, requiredSkills);
        const missingSkills = getMissingSkills(foundSkills, requiredSkills);
        
        // Generate interview questions
        const interviewQuestions = getInterviewQuestions(job_role);
        
        res.json({
            success: true,
            match_score: matchScore,
            matched_skills: foundSkills,
            missing_skills: missingSkills,
            interview_questions: interviewQuestions,
            total_required_skills: requiredSkills.length,
            skills_found: foundSkills.length
        });
        
    } catch (error) {
        console.error('Error in /analyze:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during analysis'
        });
    }
});

// POST /evaluate - Evaluate interview answers and store candidate
app.post('/evaluate', (req, res) => {
    try {
        const { name, email, job_role, resume_text, match_score, answers } = req.body;
        
        if (!name || !email || !job_role || !resume_text || !answers) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Calculate interview score
        const interviewScore = calculateInterviewScore(answers, job_role);
        
        // Calculate final recommendation
        const finalRecommendation = getFinalRecommendation(match_score, interviewScore);
        
        // Insert candidate into database
        const sql = `
            INSERT INTO candidates 
            (name, email, job_role, resume_text, match_score, interview_score, final_recommendation) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(sql, [name, email, job_role, resume_text, match_score, interviewScore, finalRecommendation], 
            (err, result) => {
                if (err) {
                    console.error('Error inserting candidate:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error saving candidate data'
                    });
                }
                
                // Weighted final score
                const finalScore = Math.round((match_score * 0.4) + (interviewScore * 0.6));
                
                res.json({
                    success: true,
                    candidate_id: result.insertId,
                    match_score: match_score,
                    interview_score: interviewScore,
                    final_score: finalScore,
                    final_recommendation: finalRecommendation,
                    message: 'Candidate evaluated and stored successfully'
                });
            });
        
    } catch (error) {
        console.error('Error in /evaluate:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during evaluation'
        });
    }
});

// GET /candidates - Fetch all stored candidates
app.get('/candidates', (req, res) => {
    try {
        const sql = 'SELECT * FROM candidates ORDER BY created_at DESC';
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching candidates:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching candidates'
                });
            }
            
            res.json({
                success: true,
                candidates: results,
                total: results.length
            });
        });
        
    } catch (error) {
        console.error('Error in /candidates:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /job-roles - Get available job roles
app.get('/job-roles', (req, res) => {
    const roles = Object.keys(jobRoles);
    res.json({
        success: true,
        job_roles: roles
    });
});

// POST /upload-pdf - Upload and parse PDF resume
app.post('/upload-pdf', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        // Read and parse the PDF file
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        const extractedText = pdfData.text;

        // Delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            resume_text: extractedText,
            message: 'PDF parsed successfully'
        });

    } catch (error) {
        console.error('Error parsing PDF:', error);
        // Clean up file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {}
        }
        res.status(500).json({
            success: false,
            message: 'Error parsing PDF file'
        });
    }
});

// =====================================================
// Serve Frontend Static Files
// =====================================================
app.use(express.static('../frontend'));

// =====================================================
// Global Error Handler
// =====================================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// =====================================================
// Start Server
// =====================================================
app.listen(PORT, () => {
    console.log(`HR Intelligent Matching System running on http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/index.html`);
});

module.exports = app;
