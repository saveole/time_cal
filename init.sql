-- Initialization script for PostgreSQL database
-- This script is run when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE timecal_db;

-- Create user if it doesn't exist
CREATE USER timecal_user WITH ENCRYPTED PASSWORD 'timecal_password';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE timecal_db TO timecal_user;

-- Connect to the database and grant schema privileges
\c timecal_db;

-- Grant necessary privileges
GRANT ALL ON SCHEMA public TO timecal_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO timecal_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO timecal_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO timecal_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO timecal_user;