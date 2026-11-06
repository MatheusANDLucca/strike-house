// Tipos e Interfaces de Domínio do Strike House

export type UserRole = 'ADMIN' | 'PROFESSOR';
export type ProfessorStatus = 'ACTIVE' | 'INACTIVE';
export type AgeGroup = 'CHILD' | 'ADULT' | 'MIXED';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type EnrollmentStatus = 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
export type MonthlyBillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'MONEY' | 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD';

// Entidade: Usuário
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export type UserPublic = Omit<User, 'password_hash'>;

// Sessão de Usuário
export interface UserSession {
  token: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

// Contexto do Usuário Autenticado na Requisição
export interface AuthContext {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  professorId: number | null;
}

export interface LoginResponseDTO {
  token: string;
  user: UserPublic & { professor_id: number | null };
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active?: number;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password_hash?: string;
  role?: UserRole;
  is_active?: number;
}

// Entidade: Professor
export interface Professor {
  id: number;
  user_id: number | null;
  name: string;
  phone: string;
  email: string;
  status: ProfessorStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProfessorDTO {
  user_id?: number | null;
  name: string;
  phone?: string;
  email?: string;
  status?: ProfessorStatus;
}

export interface UpdateProfessorDTO {
  user_id?: number | null;
  name?: string;
  phone?: string;
  email?: string;
  status?: ProfessorStatus;
}

// Entidade: Arte Marcial
export interface MartialArt {
  id: number;
  name: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMartialArtDTO {
  name: string;
  description?: string;
  is_active?: number;
}

export interface UpdateMartialArtDTO {
  name?: string;
  description?: string;
  is_active?: number;
}

// Entidade: Turma (Class)
export interface ClassEntity {
  id: number;
  name: string;
  martial_art_id: number;
  professor_id: number;
  age_group: AgeGroup;
  week_days: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  monthly_fee: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ClassWithDetails extends ClassEntity {
  martial_art_name?: string;
  professor_name?: string;
  enrolled_count?: number;
}

export interface CreateClassDTO {
  name: string;
  martial_art_id: number;
  professor_id: number;
  age_group: AgeGroup;
  week_days: string;
  start_time: string;
  end_time: string;
  max_capacity?: number;
  monthly_fee: number;
  is_active?: number;
}

export interface UpdateClassDTO {
  name?: string;
  martial_art_id?: number;
  professor_id?: number;
  age_group?: AgeGroup;
  week_days?: string;
  start_time?: string;
  end_time?: string;
  max_capacity?: number;
  monthly_fee?: number;
  is_active?: number;
}

// Entidade: Aluno (Student)
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
  updated_at: string;
}

export interface CreateStudentDTO {
  name: string;
  birth_date: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: StudentStatus;
  notes?: string;
}

export interface UpdateStudentDTO {
  name?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: StudentStatus;
  notes?: string;
}

// Entidade: Responsável (Guardian)
export interface Guardian {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  notes: string;
  created_at: string;
}

export interface CreateGuardianDTO {
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  notes?: string;
}

export interface StudentWithGuardians extends Student {
  guardians: Guardian[];
}

// Entidade: Matrícula (Enrollment)
export interface Enrollment {
  id: number;
  student_id: number;
  class_id: number;
  due_day: number;
  custom_price: number | null;
  start_date: string;
  end_date: string | null;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentWithDetails extends Enrollment {
  student_name?: string;
  class_name?: string;
  martial_art_name?: string;
  professor_name?: string;
}

export interface CreateEnrollmentDTO {
  student_id: number;
  class_id: number;
  due_day?: number;
  custom_price?: number | null;
  start_date: string;
  end_date?: string | null;
  status?: EnrollmentStatus;
}

export interface UpdateEnrollmentDTO {
  due_day?: number;
  custom_price?: number | null;
  end_date?: string | null;
  status?: EnrollmentStatus;
}

// Entidade: Mensalidade (MonthlyBill)
export interface MonthlyBill {
  id: number;
  enrollment_id: number;
  competence: string;
  nominal_amount: number;
  due_date: string;
  status: MonthlyBillStatus;
  created_at: string;
  updated_at: string;
}

export interface MonthlyBillWithDetails extends MonthlyBill {
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

export interface CreateMonthlyBillDTO {
  enrollment_id: number;
  competence: string;
  nominal_amount: number;
  due_date: string;
  status?: MonthlyBillStatus;
}

export interface UpdateMonthlyBillDTO {
  nominal_amount?: number;
  due_date?: string;
  status?: MonthlyBillStatus;
}

// Entidade: Pagamento (Payment)
export interface Payment {
  id: number;
  monthly_bill_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method: PaymentMethod;
  received_by_user_id: number;
  reference_code: string;
  notes: string;
  created_at: string;
}

export interface CreatePaymentDTO {
  monthly_bill_id: number;
  amount_paid: number;
  payment_date?: string;
  payment_method: PaymentMethod;
  received_by_user_id: number;
  reference_code?: string;
  notes?: string;
}

// Entidade: Graduação (Graduation)
export interface Graduation {
  id: number;
  student_id: number;
  martial_art_id: number;
  previous_grade: string;
  new_grade: string;
  awarded_at: string;
  professor_id: number;
  notes: string;
  created_at: string;
}

export interface GraduationWithDetails extends Graduation {
  student_name?: string;
  martial_art_name?: string;
  professor_name?: string;
}

export interface CreateGraduationDTO {
  student_id: number;
  martial_art_id: number;
  previous_grade?: string;
  new_grade: string;
  awarded_at: string;
  professor_id: number;
  notes?: string;
}

// Entidade: Despesa (Expense)
export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
  created_by_user_id: number;
  created_at: string;
}

export interface ExpenseWithUser extends Expense {
  created_by_user_name?: string;
}

export interface CreateExpenseDTO {
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
  created_by_user_id: number;
}

// Filtros e Resumos
export interface BillingFilterOptions {
  status?: MonthlyBillStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
  professorId?: number;
  classId?: number;
  studentId?: number;
  competence?: string;
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
