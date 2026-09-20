CREATE TABLE patients (
 id UUID PRIMARY KEY,
 patient_code VARCHAR(50) UNIQUE NOT NULL,
 name VARCHAR(150) NOT NULL,
 age INTEGER,
 sex VARCHAR(20),
 diagnosis VARCHAR(150),
 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devices (
 id UUID PRIMARY KEY,
 device_id VARCHAR(100) UNIQUE NOT NULL,
 name VARCHAR(150),
 status VARCHAR(30) DEFAULT 'offline',
 last_seen TIMESTAMPTZ
);

CREATE TABLE assessment_sessions (
 id UUID PRIMARY KEY,
 session_code VARCHAR(100) UNIQUE NOT NULL,
 patient_id UUID NOT NULL REFERENCES patients(id),
 started_at TIMESTAMPTZ DEFAULT NOW(),
 completed_at TIMESTAMPTZ,
 target_measurements INTEGER DEFAULT 20
);

CREATE TABLE measurements (
 id BIGSERIAL PRIMARY KEY,
 session_id UUID NOT NULL REFERENCES assessment_sessions(id),
 patient_id UUID NOT NULL REFERENCES patients(id),
 device_id UUID REFERENCES devices(id),
 measurement_no INTEGER NOT NULL,
 measured_at TIMESTAMPTZ DEFAULT NOW(),
 heart_rate NUMERIC,
 spo2 NUMERIC,
 temperature NUMERIC,
 raw_payload JSONB,
 UNIQUE(session_id, measurement_no)
);
