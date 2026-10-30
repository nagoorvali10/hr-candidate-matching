-- =====================================================
-- Human Resources - Intelligent Candidate Matching System
-- MySQL Database Setup Script
-- =====================================================

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS job;

-- Use the database
USE job;

-- =====================================================
-- Create Candidates Table
-- =====================================================
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
);

-- =====================================================
-- Verify table structure
-- =====================================================
DESCRIBE candidates;

-- =====================================================
-- Sample query to view all candidates
-- =====================================================
-- SELECT * FROM candidates ORDER BY created_at DESC;
