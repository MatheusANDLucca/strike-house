import {
  billingRepository,
  enrollmentRepository,
  classRepository,
} from '../database/repositories/index.js';
import type {
  AuthContext,
  BillingFilterOptions,
  FinancialSummary,
  MonthlyBillWithDetails,
  Payment,
  PaymentMethod,
} from '../types/index.js';

export interface GenerationResult {
  competence: string;
  totalActiveEnrollments: number;
  generatedCount: number;
  skippedCount: number;
}

export class BillingService {
  generateMonthlyBills(competence: string): GenerationResult {
    // Validação de formato YYYY-MM
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competence)) {
      throw new Error('Formato de competência inválido. Utilize o formato AAAA-MM (ex: 2026-11).');
    }

    const [yearStr, monthStr] = competence.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const activeEnrollments = enrollmentRepository.listActive();
    let generatedCount = 0;
    let skippedCount = 0;

    for (const enrollment of activeEnrollments) {
      const existing = billingRepository.findActiveBillByEnrollmentAndCompetence(enrollment.id, competence);
      if (existing) {
        skippedCount++;
        continue;
      }

      // Calcula dia de vencimento respeitando o limite do mês
      const rawDay = enrollment.due_day || 10;
      const day = Math.min(Math.max(1, rawDay), daysInMonth);
      const dueDate = `${yearStr}-${monthStr.padStart(2, '0')}-${String(day).padStart(2, '0')}`;


      // Determina valor nominal
      let nominalAmount = 0;
      if (enrollment.custom_price !== null && enrollment.custom_price !== undefined) {
        nominalAmount = enrollment.custom_price;
      } else {
        const classObj = classRepository.findById(enrollment.class_id);
        if (classObj) {
          nominalAmount = classObj.monthly_fee;
        }
      }

      billingRepository.createBill({
        enrollment_id: enrollment.id,
        competence,
        nominal_amount: nominalAmount,
        due_date: dueDate,
        status: 'PENDING',
      });

      generatedCount++;
    }

    return {
      competence,
      totalActiveEnrollments: activeEnrollments.length,
      generatedCount,
      skippedCount,
    };
  }

  recordPayment(
    billId: number,
    amount: number,
    method: PaymentMethod,
    receivedByUserId: number,
    notes?: string,
    referenceCode?: string
  ): Payment {
    if (amount <= 0) {
      throw new Error('O valor pago deve ser maior que zero.');
    }

    return billingRepository.recordPayment({
      monthly_bill_id: billId,
      amount_paid: amount,
      payment_method: method,
      received_by_user_id: receivedByUserId,
      notes,
      reference_code: referenceCode,
    });
  }

  getSummary(currentUser: AuthContext, periodStart?: string, periodEnd?: string): FinancialSummary {
    const professorId = currentUser.role === 'PROFESSOR' ? (currentUser.professorId ?? -1) : undefined;
    return billingRepository.getFinancialSummary(periodStart, periodEnd, professorId);
  }

  listBills(currentUser: AuthContext, filters?: BillingFilterOptions): MonthlyBillWithDetails[] {
    const resolvedFilters: BillingFilterOptions = { ...filters };
    if (currentUser.role === 'PROFESSOR') {
      resolvedFilters.professorId = currentUser.professorId ?? -1;
    }
    return billingRepository.list(resolvedFilters);
  }

  getBillById(id: number, currentUser: AuthContext): MonthlyBillWithDetails | null {
    const bill = billingRepository.findById(id);
    if (!bill) {
      return null;
    }

    if (currentUser.role === 'PROFESSOR' && bill.professor_id !== currentUser.professorId) {
      throw new Error('Acesso negado a mensalidade de outra turma.');
    }

    return bill;
  }
}

export const billingService = new BillingService();
