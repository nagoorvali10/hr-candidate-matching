// =====================================================
// Human Resources - Intelligent Candidate Matching System
// Frontend JavaScript
// =====================================================

// API Base URL
const API_URL = 'http://localhost:3000';

// =====================================================
// Global Variables
// =====================================================
let currentMatchScore = 0;
let interviewQuestions = [];

// =====================================================
// DOM Elements
// =====================================================
const candidateForm = document.getElementById('candidateForm');
const analyzeBtn = document.getElementById('analyzeBtn');
const evaluateBtn = document.getElementById('evaluateBtn');
const loadCandidatesBtn = document.getElementById('loadCandidatesBtn');
const newCandidateBtn = document.getElementById('newCandidateBtn');

// =====================================================
// Event Listeners
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    candidateForm.addEventListener('submit', handleAnalyze);
    evaluateBtn.addEventListener('click', handleEvaluate);
    loadCandidatesBtn.addEventListener('click', loadCandidates);
    newCandidateBtn.addEventListener('click', resetForm);
});

// =====================================================
// Handle Resume Analysis
// =====================================================
async function handleAnalyze(e) {
    e.preventDefault();
    
    const name = document.getElementById('candidateName').value.trim();
    const email = document.getElementById('candidateEmail').value.trim();
    const jobRole = document.getElementById('jobRole').value;
    const resumeText = document.getElementById('resumeText').value.trim();
    const resumeFile = document.getElementById('resumeFile').files[0];
    
    if (!name || !email || !jobRole) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Check if PDF file is uploaded
    if (resumeFile) {
        await handlePdfUpload(name, email, jobRole, resumeFile);
        return;
    }
    
    if (!resumeText) {
        alert('Please enter resume text or upload a PDF file');
        return;
    }
    
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    
    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                job_role: jobRole,
                resume_text: resumeText
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentMatchScore = data.match_score;
            interviewQuestions = data.interview_questions;
            
            // Display match score section
            displayMatchScore(data);
            
            // Display interview section
            displayInterviewQuestions(data.interview_questions);
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to server. Please make sure the backend is running.');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Resume';
    }
}

// =====================================================
// Handle PDF Upload and Parsing
// =====================================================
async function handlePdfUpload(name, email, jobRole, file) {
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Parsing PDF...';
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
        // Upload and parse PDF
        const response = await fetch(`${API_URL}/upload-pdf`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert('Error parsing PDF: ' + data.message);
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Resume';
            return;
        }
        
        // Now analyze the extracted text
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        
        const analyzeResponse = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                job_role: jobRole,
                resume_text: data.resume_text
            })
        });
        
        const analyzeData = await analyzeResponse.json();
        
        if (analyzeData.success) {
            currentMatchScore = analyzeData.match_score;
            interviewQuestions = analyzeData.interview_questions;
            
            // Display match score section
            displayMatchScore(analyzeData);
            
            // Display interview section
            displayInterviewQuestions(analyzeData.interview_questions);
        } else {
            alert('Error: ' + analyzeData.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to process PDF. Please make sure the backend is running.');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Resume';
    }
}

// =====================================================
// Display Match Score
// =====================================================
function displayMatchScore(data) {
    const matchScoreSection = document.getElementById('match-score-section');
    const scoreValue = document.getElementById('matchScoreValue');
    const scoreRing = document.getElementById('scoreRing');
    const matchedSkillsContainer = document.getElementById('matchedSkills');
    const missingSkillsContainer = document.getElementById('missingSkills');
    
    // Show section
    matchScoreSection.style.display = 'block';
    
    // Animate score value
    scoreValue.textContent = '0';
    animateValue(scoreValue, 0, data.match_score, 1000);
    
    // Update progress ring
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (data.match_score / 100) * circumference;
    scoreRing.style.strokeDashoffset = offset;
    
    // Set color based on score
    scoreRing.classList.remove('high', 'medium', 'low');
    if (data.match_score >= 80) {
        scoreRing.classList.add('high');
    } else if (data.match_score >= 60) {
        scoreRing.classList.add('medium');
    } else {
        scoreRing.classList.add('low');
    }
    
    // Display matched skills
    matchedSkillsContainer.innerHTML = '';
    if (data.matched_skills && data.matched_skills.length > 0) {
        data.matched_skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag matched';
            tag.textContent = skill;
            matchedSkillsContainer.appendChild(tag);
        });
    } else {
        matchedSkillsContainer.innerHTML = '<p>No matching skills found</p>';
    }
    
    // Display missing skills
    missingSkillsContainer.innerHTML = '';
    if (data.missing_skills && data.missing_skills.length > 0) {
        data.missing_skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag missing';
            tag.textContent = skill;
            missingSkillsContainer.appendChild(tag);
        });
    } else {
        const tag = document.createElement('span');
        tag.className = 'skill-tag matched';
        tag.textContent = 'All skills matched!';
        missingSkillsContainer.appendChild(tag);
    }
    
    // Scroll to match score section
    matchScoreSection.scrollIntoView({ behavior: 'smooth' });
}

// =====================================================
// Display Interview Questions
// =====================================================
function displayInterviewQuestions(questions) {
    const interviewSection = document.getElementById('interview-section');
    const questionsContainer = document.getElementById('interviewQuestions');
    
    // Show section
    interviewSection.style.display = 'block';
    
    // Clear previous questions
    questionsContainer.innerHTML = '';
    
    // Generate question elements
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'interview-question';
        questionDiv.innerHTML = `
            <h4><span>${index + 1}</span> ${question}</h4>
            <textarea 
                id="answer${index}" 
                name="answer${index}" 
                placeholder="Type your answer here..."
                rows="3"
            ></textarea>
        `;
        questionsContainer.appendChild(questionDiv);
    });
    
    // Scroll to interview section
    interviewSection.scrollIntoView({ behavior: 'smooth' });
}

// =====================================================
// Handle Evaluation
// =====================================================
async function handleEvaluate() {
    const name = document.getElementById('candidateName').value.trim();
    const email = document.getElementById('candidateEmail').value.trim();
    const jobRole = document.getElementById('jobRole').value;
    const resumeText = document.getElementById('resumeText').value.trim();
    
    // Collect answers
    const answers = [];
    for (let i = 0; i < interviewQuestions.length; i++) {
        const answerElement = document.getElementById(`answer${i}`);
        if (answerElement) {
            answers.push(answerElement.value.trim());
        }
    }
    
    // Check if all questions are answered
    const unanswered = answers.filter(a => !a || a.length < 10);
    if (unanswered.length > 0) {
        alert('Please answer all interview questions (at least 10 characters each)');
        return;
    }
    
    // Show loading state
    evaluateBtn.disabled = true;
    evaluateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Evaluating...';
    
    try {
        const response = await fetch(`${API_URL}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                job_role: jobRole,
                resume_text: resumeText,
                match_score: currentMatchScore,
                answers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayFinalSummary(data);
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to server. Please make sure the backend is running.');
    } finally {
        evaluateBtn.disabled = false;
        evaluateBtn.innerHTML = '<i class="fas fa-check-double"></i> Evaluate Candidate';
    }
}

// =====================================================
// Display Final Summary
// =====================================================
function displayFinalSummary(data) {
    const finalSummary = document.getElementById('final-summary');
    const summaryResumeScore = document.getElementById('summaryResumeScore');
    const summaryInterviewScore = document.getElementById('summaryInterviewScore');
    const summaryRecommendation = document.getElementById('summaryRecommendation');
    const recommendationBadge = document.getElementById('recommendationBadge');
    const recommendationText = document.getElementById('recommendationText');
    
    // Update values
    summaryResumeScore.textContent = `${data.match_score}%`;
    summaryInterviewScore.textContent = `${data.interview_score}%`;
    summaryRecommendation.textContent = data.final_recommendation;
    recommendationText.textContent = data.final_recommendation;
    
    // Set recommendation badge class
    recommendationBadge.classList.remove('strongly-recommended', 'recommended', 'consider', 'not-recommended');
    
    const recClass = data.final_recommendation.toLowerCase().replace(' ', '-');
    recommendationBadge.classList.add(recClass);
    
    // Show section
    finalSummary.style.display = 'block';
    
    // Scroll to summary
    finalSummary.scrollIntoView({ behavior: 'smooth' });
}

// =====================================================
// Load All Candidates (Admin View)
// =====================================================
async function loadCandidates() {
    loadCandidatesBtn.disabled = true;
    loadCandidatesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        const response = await fetch(`${API_URL}/candidates`);
        const data = await response.json();
        
        if (data.success) {
            displayCandidatesTable(data.candidates);
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to server. Please make sure the backend is running.');
    } finally {
        loadCandidatesBtn.disabled = false;
        loadCandidatesBtn.innerHTML = '<i class="fas fa-database"></i> Load All Candidates';
    }
}

// =====================================================
// Display Candidates Table
// =====================================================
function displayCandidatesTable(candidates) {
    const tableContainer = document.getElementById('candidatesTableContainer');
    const tableBody = document.getElementById('candidatesTableBody');
    const noCandidates = document.getElementById('noCandidates');
    
    // Clear previous data
    tableBody.innerHTML = '';
    
    if (candidates.length === 0) {
        tableContainer.style.display = 'none';
        noCandidates.style.display = 'block';
        return;
    }
    
    noCandidates.style.display = 'none';
    tableContainer.style.display = 'block';
    
    // Populate table
    candidates.forEach(candidate => {
        const row = document.createElement('tr');
        
        const recClass = candidate.final_recommendation 
            ? candidate.final_recommendation.toLowerCase().replace(' ', '-')
            : '';
        
        row.innerHTML = `
            <td>${candidate.id}</td>
            <td><strong>${escapeHtml(candidate.name)}</strong></td>
            <td>${escapeHtml(candidate.email)}</td>
            <td>${escapeHtml(candidate.job_role)}</td>
            <td><span class="score-badge ${getScoreClass(candidate.match_score)}">${candidate.match_score}%</span></td>
            <td><span class="score-badge ${getScoreClass(candidate.interview_score)}">${candidate.interview_score}%</span></td>
            <td class="recommendation-cell ${recClass}">${candidate.final_recommendation || '-'}</td>
            <td>${formatDate(candidate.created_at)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// =====================================================
// Reset Form
// =====================================================
function resetForm() {
    // Reset form
    candidateForm.reset();
    
    // Clear file input
    document.getElementById('resumeFile').value = '';
    
    // Hide sections
    document.getElementById('match-score-section').style.display = 'none';
    document.getElementById('interview-section').style.display = 'none';
    document.getElementById('final-summary').style.display = 'none';
    
    // Reset variables
    currentMatchScore = 0;
    interviewQuestions = [];
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================
// Utility Functions
// =====================================================

// Animate number value
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Get score class
function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
