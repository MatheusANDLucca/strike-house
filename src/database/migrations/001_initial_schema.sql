-- Migração 001: Schema Inicial do Strike House

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'PROFESSOR')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS martial_arts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    martial_art_id INTEGER NOT NULL REFERENCES martial_arts(id),
    professor_id INTEGER NOT NULL REFERENCES professors(id),
    age_group TEXT NOT NULL CHECK(age_group IN ('CHILD', 'ADULT', 'MIXED')),
    week_days TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_capacity INTEGER DEFAULT 30,
    monthly_fee REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guardians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    relationship TEXT DEFAULT 'Responsável',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_guardians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id INTEGER NOT NULL REFERENCES guardians(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    due_day INTEGER NOT NULL DEFAULT 10,
    custom_price REAL DEFAULT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT DEFAULT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    competence TEXT NOT NULL,
    nominal_amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monthly_bill_id INTEGER NOT NULL REFERENCES monthly_bills(id) ON DELETE RESTRICT,
    amount_paid REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('MONEY', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD')),
    received_by_user_id INTEGER NOT NULL REFERENCES users(id),
    reference_code TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS graduations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    martial_art_id INTEGER NOT NULL REFERENCES martial_arts(id) ON DELETE RESTRICT,
    previous_grade TEXT DEFAULT '',
    new_grade TEXT NOT NULL,
    awarded_at TEXT NOT NULL,
    professor_id INTEGER NOT NULL REFERENCES professors(id),
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    expense_date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- Índices de Otimização e Integridade
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_classes_prof ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_classes_art ON classes(martial_art_id);
CREATE INDEX IF NOT EXISTS idx_enroll_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enroll_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON monthly_bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due ON monthly_bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_comp ON monthly_bills(competence);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_enrollment_comp ON monthly_bills(enrollment_id, competence) WHERE status != 'CANCELLED';
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(monthly_bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_recv ON payments(received_by_user_id);
CREATE INDEX IF NOT EXISTS idx_grad_student ON graduations(student_id);

