-- PostgreSQL Database Schema for SchoolAppoint

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subscription Plans Table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Starter', 'Standard', 'Premium'
    price NUMERIC(10, 2) NOT NULL,
    max_appointments_per_month INTEGER NOT NULL,
    features JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Schools Table (Tenants)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255),
    description TEXT,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    admission_status VARCHAR(20) DEFAULT 'Open', -- 'Open', 'Closed'
    max_appointments_per_day INTEGER DEFAULT 50,
    max_appointments_per_hour INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. School Admins Table
CREATE TABLE school_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- Nullable for Super Admins
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'Admin', -- 'Admin', 'SuperAdmin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_number VARCHAR(50) NOT NULL UNIQUE, -- APP-YYYY-000001
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    grade_applying_for VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Cancelled', 'WaitingList'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Waiting List Table
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Cancelled', 'Expired'
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL
);

-- 7. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    recipient VARCHAR(100) NOT NULL, -- Phone number or Email
    type VARCHAR(20) NOT NULL, -- 'SMS', 'Email'
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Sent', 'Failed'
    sent_at TIMESTAMP
);

-- 8. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES school_admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. System Settings Table (Global Config)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_appointments_school ON appointments(school_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_waiting_list_school ON waiting_list(school_id);
CREATE INDEX idx_school_admins_email ON school_admins(email);
