export type DocStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Posted' | 'Partially Paid' | 'Paid' | 'Cancelled';
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export interface Account { id: string; code: string; name: string; type: AccountType; }
export interface JournalLine { accountId: string; debit: number; credit: number; memo?: string; }
export interface Journal { id: string; date: string; description: string; status: DocStatus; lines: JournalLine[]; sourceRef?: string; reversalOf?: string; }
export interface Party { id: string; name: string; email: string; phone: string; terms: string; }
export interface Product { id: string; sku: string; name: string; category: string; unitCost: number; unitPrice: number; qty: number; reorderLevel: number; }
export interface PurchaseOrder { id: string; supplierId: string; productId: string; qty: number; unitCost: number; status: DocStatus; createdAt: string; receivedQty: number; }
export interface SupplierInvoice { id: string; supplierId: string; purchaseOrderId: string; amount: number; paidAmount: number; status: DocStatus; date: string; dueDate: string; }
export interface SalesInvoice { id: string; customerId: string; productId: string; qty: number; amount: number; cogs: number; paidAmount: number; status: DocStatus; date: string; dueDate: string; }
export interface StockMovement { id: string; productId: string; qty: number; kind: 'Receipt' | 'Sale' | 'Adjustment'; reference: string; date: string; }
export interface Employee { id: string; name: string; department: string; role: string; salary: number; active: boolean; }
export interface Attendance { id: string; employeeId: string; date: string; status: 'Present' | 'Absent' | 'Leave'; }
export interface PayrollRun { id: string; month: string; gross: number; status: DocStatus; employeeCount: number; journalId?: string; }
export interface AuditEvent { id: string; at: string; operation: string; documentId: string; documentType: string; previousStatus?: DocStatus | 'New'; newStatus?: DocStatus; journalIds: string[]; note?: string; }
export interface TrainingBaseline {
  companyId: string;
  journalIds: string[];
  purchaseOrderIds: string[];
  supplierInvoiceIds: string[];
  salesInvoiceIds: string[];
  expenseIds: string[];
  payrollRunIds: string[];
  stockMovementIds: string[];
  productQuantities: Record<string, number>;
  supplierInvoices: Record<string, { amount: number; paidAmount: number; status: DocStatus }>;
  reportViews: string[];
  employeeCount: number;
  payrollGross: number;
}
export interface TrainingProgress {
  completed: string[];
  baselines?: Record<string, TrainingBaseline>;
  bestScores?: Record<string, number>;
  reportViews?: string[];
  answers?: Record<string, Record<string, string>>;
}
export interface CompanyData {
  company: { id: string; name: string; currency: string; fiscalYearStart: string; createdAt: string };
  accounts: Account[]; journals: Journal[]; suppliers: Party[]; customers: Party[]; products: Product[];
  purchaseOrders: PurchaseOrder[]; supplierInvoices: SupplierInvoice[]; salesInvoices: SalesInvoice[];
  stockMovements: StockMovement[]; employees: Employee[]; attendance: Attendance[]; payrollRuns: PayrollRun[];
  expenses: Array<{ id: string; date: string; category: string; amount: number; description: string; status: DocStatus; journalId?: string }>;
  audit: AuditEvent[]; training: TrainingProgress;
}
export interface Workspace { version: 1; currentCompanyId: string; companies: Record<string, CompanyData>; }
export const ACCOUNT = { CASH:'a-cash', AR:'a-ar', INVENTORY:'a-inventory', AP:'a-ap', GRNI:'a-grni', EQUITY:'a-equity', SALES:'a-sales', COGS:'a-cogs', EXPENSE:'a-expense', PAYROLL:'a-payroll' } as const;
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100);
export const currency = (minor: number, code = 'USD') => new Intl.NumberFormat('en-US', { style:'currency', currency:code }).format(minor / 100);
export const today = () => new Date().toISOString().slice(0, 10);
export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
