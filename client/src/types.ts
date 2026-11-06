export type UserRole = 'ADMIN' | 'PROFESSOR';
export type AgeGroup = 'CHILD' | 'ADULT' | 'MIXED';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type EnrollmentStatus = 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
export type MonthlyBillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'MONEY' | 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: number;
  professor_id?: number | null;
}

export interface Guardian {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  notes: string;
  created_at?: string;
}

export interface Student {
  id: number;
  name: string;
  birth_date: string;
  phone: string;
  email: string;
  address: string;
  status: StudentStatus;
  notes: string;
  created_at: string;
  guardians?: Guardian[];
}

export interface MartialArt {
  id: number;
  name: string;
  description: string;
  is_active: number;
}

export interface Professor {
  id: number;
  user_id: number | null;
  name: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ClassItem {
  id: number;
  name: string;
  martial_art_id: number;
  martial_art_name?: string;
  professor_id: number;
  professor_name?: string;
  age_group: AgeGroup;
  week_days: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  monthly_fee: number;
  is_active: number;
  enrolled_count?: number;
}

export interface Enrollment {
  id: number;
  student_id: number;
  student_name?: string;
  class_id: number;
  class_name?: string;
  martial_art_name?: string;
  professor_name?: string;
  due_day: number;
  custom_price: number | null;
  start_date: string;
  end_date: string | null;
  status: EnrollmentStatus;
  created_at: string;
}

export interface MonthlyBill {
  id: number;
  enrollment_id: number;
  competence: string;
  nominal_amount: number;
  due_date: string;
  status: MonthlyBillStatus;
  student_id?: number;
  student_name?: string;
  class_id?: number;
  class_name?: string;
  professor_id?: number;
  professor_name?: string;
  amount_paid?: number | null;
  payment_date?: string | null;
  payment_method?: PaymentMethod | null;
}

export interface Graduation {
  id: number;
  student_id: number;
  student_name?: string;
  martial_art_id: number;
  martial_art_name?: string;
  previous_grade: string;
  new_grade: string;
  awarded_at: string;
  professor_id: number;
  professor_name?: string;
  notes: string;
}

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
  created_by_user_id: number;
  created_by_user_name?: string;
}

export interface FinancialSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalExpenses: number;
  netBalance: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  activeClassesCount: number;
  activeEnrollmentsCount: number;
  financialSummary: FinancialSummary;
}

export interface DashboardData {
  user: User;
  metrics: DashboardMetrics;
  classes: ClassItem[];
  recentOverdueBills: MonthlyBill[];
  recentPendingBills: MonthlyBill[];
}
