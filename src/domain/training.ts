import { ACCOUNT, money, type CompanyData, type TrainingBaseline } from './model';
import { reports } from './erp';

export type TrainingStepKind = 'action' | 'answer';
export interface TrainingStep {
  id: string;
  text: string;
  kind: TrainingStepKind;
  answerLabel?: string;
  inputType?: 'text' | 'number';
  placeholder?: string;
}
export interface TrainingScenario {
  id: string;
  title: string;
  module: string;
  route: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  minutes: number;
  scenario: string;
  instructions: string[];
  learningGoals: string[];
  steps: TrainingStep[];
  explanation: string;
}
export interface StepResult {
  id: string;
  text: string;
  ok: boolean;
  hint: string;
  mistake?: string;
}
export interface ScenarioResult {
  scenarioId: string;
  steps: StepResult[];
  passed: number;
  total: number;
  score: number;
  completed: boolean;
}

const action = (id: string, text: string): TrainingStep => ({ id, text, kind: 'action' });
const answer = (id: string, text: string, answerLabel: string, inputType: 'text' | 'number' = 'text', placeholder = ''): TrainingStep => ({ id, text, kind: 'answer', answerLabel, inputType, placeholder });

export const trainingScenarios: TrainingScenario[] = [
  {
    id: 'journal-entry-rent', title: 'Record Rent with a Journal Entry', module: 'Finance', route: '/finance', difficulty: 'Beginner', minutes: 10,
    scenario: 'The company pays $5,000 office rent in cash. Record it before month-end.',
    instructions: ['Open Finance and create a journal entry.', 'Debit an expense account for $5,000 and credit Cash for $5,000.', 'Post the balanced entry and inspect the ledger.'],
    learningGoals: ['Double-entry bookkeeping', 'Debits equal credits', 'Posting updates the ledger'],
    steps: [action('posted', 'Create and post a new journal entry.'), action('balanced', 'Make sure the posted entry balances.'), action('accounts', 'Debit an expense and credit Cash for $5,000.'), action('reference', 'Post it with a source reference.')],
    explanation: 'Rent expense increases with a debit; Cash, an asset, decreases with a credit. Posting moves both lines into the general ledger.',
  },
  {
    id: 'accounts-payable-payment', title: 'Pay a Supplier Invoice', module: 'Procurement', route: '/procurement', difficulty: 'Beginner', minutes: 10,
    scenario: 'Settle an open supplier invoice and keep Accounts Payable accurate.',
    instructions: ['Choose an invoice that was open when this exercise started.', 'Record payment for its entire outstanding balance.', 'Confirm it is Paid and inspect the matching journal.'],
    learningGoals: ['Settling payables', 'Invoice status lifecycle', 'Liabilities and cash'],
    steps: [action('payment', 'Record a supplier payment against a previously open invoice.'), action('full', 'Settle the invoice in full so its status is Paid.'), action('journal', 'Post a balanced debit to Payables and credit to Cash.')],
    explanation: 'A full payment reduces both Accounts Payable and Cash. Partial payments leave the remaining liability open.',
  },
  {
    id: 'accounts-receivable-invoice', title: 'Invoice a Customer and Collect', module: 'Sales', route: '/sales', difficulty: 'Intermediate', minutes: 15,
    scenario: 'Sell an available item on credit, then collect the resulting receivable.',
    instructions: ['Post an invoice for an available item; the invoice total is calculated from its price and quantity.', 'Record a receipt for the full outstanding amount.', 'Review the invoice and the linked accounting entries.'],
    learningGoals: ['Revenue recognition', 'Receivables lifecycle', 'Collections'],
    steps: [action('invoice', 'Create a new customer invoice from available stock.'), action('revenue', 'Verify the invoice posts Receivable and Revenue.'), action('payment', 'Collect payment in full so the invoice becomes Paid.'), action('collection', 'Verify a balanced Cash debit / Receivable credit.')],
    explanation: 'Revenue is recognized when the invoice is posted, not when cash arrives. Collection later swaps Accounts Receivable for Cash.',
  },
  {
    id: 'purchase-order-receive', title: 'Create a Purchase Order and Receive Goods', module: 'Procurement', route: '/procurement', difficulty: 'Intermediate', minutes: 15,
    scenario: 'Replenish a product, approve the order, and record the delivery.',
    instructions: ['Create a purchase order with a supplier, product, and positive quantity.', 'Approve it before receiving.', 'Receive the full quantity and inspect the stock movement.'],
    learningGoals: ['Purchase approvals', 'Goods receipt', 'Inventory movements'],
    steps: [action('po', 'Create a new purchase order with valid lines.'), action('approved', 'Approve the order before receiving goods.'), action('received', 'Receive the full ordered quantity.'), action('stock', 'Confirm stock and its receipt movement both updated.')],
    explanation: 'Approvals control spending authority. Receiving increases stock and records inventory against Goods Received Not Invoiced (GRNI).',
  },
  {
    id: 'supplier-invoice-match', title: 'Match a Supplier Invoice to a Receipt', module: 'Procurement', route: '/procurement', difficulty: 'Advanced', minutes: 15,
    scenario: 'Match a supplier invoice to a received purchase order before recognizing the payable.',
    instructions: ['Receive goods against a purchase order.', 'Register the supplier invoice for the received amount.', 'Check that the payable is linked to the same order and the journal is balanced.'],
    learningGoals: ['Order/receipt/invoice matching', 'Liability recognition', 'GRNI clearing'],
    steps: [action('linked', 'Register a new supplier invoice linked to a purchase order.'), action('match', 'Match the invoice amount to the received quantity and agreed cost.'), action('journal', 'Verify the journal debits GRNI and credits Accounts Payable.')],
    explanation: 'This simulator debits GRNI when stock is received, then clears GRNI when the supplier invoice transfers the amount to Accounts Payable.',
  },
  {
    id: 'inventory-adjustment', title: 'Record an Inventory Adjustment', module: 'Inventory', route: '/inventory', difficulty: 'Beginner', minutes: 10,
    scenario: 'A physical stock count differs from the book quantity. Record a traceable adjustment.',
    instructions: ['Open Inventory and choose a product.', 'Post a nonzero whole-unit adjustment that does not make stock negative.', 'Review the resulting movement and valuation.'],
    learningGoals: ['Stock adjustments', 'Movement history', 'Inventory valuation'],
    steps: [action('movement', 'Post a new inventory adjustment movement.'), action('quantity', 'Make sure the product quantity reflects recorded stock movements.')],
    explanation: 'An adjustment reconciles book stock to a physical count. Each quantity change is recorded, and the corresponding value is posted to the ledger.',
  },
  {
    id: 'record-expense', title: 'Record an Operating Expense', module: 'Finance', route: '/finance', difficulty: 'Beginner', minutes: 8,
    scenario: 'The company pays a $1,200 utilities bill. Record the expense in the books.',
    instructions: ['Record a $1,200 expense with a category and description.', 'Inspect the linked posted journal.', 'Review its effect on the Income Statement.'],
    learningGoals: ['Expense classification', 'Journal linkage', 'Net income'],
    steps: [action('expense', 'Record a new expense for $1,200.'), action('category', 'Include a category and link the expense to an expense account.'), action('journal', 'Verify it has a balanced posted journal.')],
    explanation: 'Expenses reduce net income. A linked, balanced journal keeps the expense record and ledger in agreement.',
  },
  {
    id: 'financial-statements', title: 'Prepare the Financial Statements', module: 'Reports', route: '/reports', difficulty: 'Advanced', minutes: 20,
    scenario: 'At month-end, open the statements and report key balances.',
    instructions: ['Open Reports & Analytics to review the trial balance and financial statements.', 'Enter Net Income and Total Assets exactly as displayed.'],
    learningGoals: ['Reading financial statements', 'Net income versus assets', 'Accounting equation'],
    steps: [action('viewed', 'Open the reports containing the Trial Balance, Income Statement, and Balance Sheet.'), answer('netIncome', 'Enter the current Net Income.', 'Net Income ($)', 'number', 'e.g. 540.00'), answer('totalAssets', 'Enter Total Assets from the Balance Sheet.', 'Total Assets ($)', 'number', 'e.g. 64542.00'), action('equation', 'Confirm the Trial Balance and Balance Sheet balance.')],
    explanation: 'Net income is revenue less expenses and is included in equity. The accounting equation is Assets = Liabilities + Equity including current earnings.',
  },
  {
    id: 'review-reports', title: 'Review Reports and Stock Alerts', module: 'Reports', route: '/reports', difficulty: 'Intermediate', minutes: 10,
    scenario: 'A manager asks which expense account is largest and how many products are below reorder level.',
    instructions: ['Open Reports & Analytics and compare expense account balances.', 'Inspect the Inventory module for products at or below reorder level.', 'Enter both answers.'],
    learningGoals: ['Using reports for decisions', 'Expense analysis', 'Reorder thresholds'],
    steps: [action('viewed', 'Open the Income Statement report.'), answer('topExpense', 'Name the account with the largest expense balance.', 'Largest expense account', 'text', 'Account name or code'), answer('lowCount', 'Count products at or below their reorder level.', 'Low-stock product count', 'number', '0')],
    explanation: 'Financial reports help identify cost drivers. A product is low-stock when its on-hand quantity is less than or equal to its reorder level.',
  },
  {
    id: 'record-to-report', title: 'Complete Record to Report', module: 'Finance & Reports', route: '/finance', difficulty: 'Intermediate', minutes: 15,
    scenario: 'Post a valid accounting adjustment, then review the resulting reports.',
    instructions: ['Post a new balanced journal entry.', 'Open Reports & Analytics and inspect the Trial Balance and statements.', 'Verify that the books still balance.'],
    learningGoals: ['Close-cycle discipline', 'Ledger and report linkage', 'Reconciliation'],
    steps: [action('journal', 'Post a new balanced journal entry in Finance.'), action('reports', 'Open the reports after posting the entry.'), action('balanced', 'Confirm the Trial Balance and Balance Sheet are balanced.')],
    explanation: 'Record to Report connects source activity, posted journal entries, reconciled balances, and financial statements.',
  },
  {
    id: 'procure-to-pay-cycle', title: 'Complete Procure to Pay', module: 'Procurement', route: '/procurement', difficulty: 'Advanced', minutes: 20,
    scenario: 'Complete one new purchase from approved order through receipt, invoice, and full payment.',
    instructions: ['Create and approve a purchase order.', 'Receive the full quantity and register the supplier invoice.', 'Pay that invoice in full.'],
    learningGoals: ['End-to-end purchasing', 'Inventory and payable linkage', 'Supplier settlement'],
    steps: [action('order', 'Create and approve a new purchase order.'), action('receipt', 'Receive its full quantity and record the stock movement.'), action('invoice', 'Register a supplier invoice against that purchase order.'), action('paid', 'Pay the same invoice in full.')],
    explanation: 'The same purchase order links authorization, physical receipt, the supplier liability, and settlement in Cash and Accounts Payable.',
  },
  {
    id: 'payroll-simulation', title: 'Simulate and Review Payroll', module: 'HR & Payroll', route: '/hr', difficulty: 'Intermediate', minutes: 12,
    scenario: 'Calculate gross pay for active fictional employees and post the training payroll entry.',
    instructions: ['Review the active employee roster and monthly training salaries.', 'Run payroll for a month that has not already been posted.', 'Inspect the linked journal in Finance and Payroll Report.'],
    learningGoals: ['Payroll simulation', 'Expense recognition', 'Balanced posting'],
    steps: [action('run', 'Create a new posted payroll run.'), action('gross', 'Use the current active headcount and salary total.'), action('journal', 'Verify the linked balanced Payroll Expense / Cash journal.')],
    explanation: 'This educational simulation posts gross fictional salaries only. It does not calculate tax, benefits, deductions, or initiate real payments.',
  },
];

export function createTrainingBaseline(c: CompanyData): TrainingBaseline {
  return {
    companyId: c.company.id,
    journalIds: c.journals.map(x => x.id),
    purchaseOrderIds: c.purchaseOrders.map(x => x.id),
    supplierInvoiceIds: c.supplierInvoices.map(x => x.id),
    salesInvoiceIds: c.salesInvoices.map(x => x.id),
    expenseIds: c.expenses.map(x => x.id),
    payrollRunIds: c.payrollRuns.map(x => x.id),
    stockMovementIds: c.stockMovements.map(x => x.id),
    productQuantities: Object.fromEntries(c.products.map(p => [p.id, p.qty])),
    supplierInvoices: Object.fromEntries(c.supplierInvoices.map(i => [i.id, { amount: i.amount, paidAmount: i.paidAmount, status: i.status }])),
    reportViews: [...(c.training.reportViews ?? [])],
    employeeCount: c.employees.filter(e => e.active).length,
    payrollGross: c.employees.filter(e => e.active).reduce((n, e) => n + e.salary, 0),
  };
}

export function startTrainingScenario(c: CompanyData, scenarioId: string): CompanyData {
  if (!trainingScenarios.some(s => s.id === scenarioId)) throw new Error('Unknown training scenario.');
  const baselines = { ...(c.training.baselines ?? {}), [scenarioId]: createTrainingBaseline(c) };
  const answers = { ...(c.training.answers ?? {}), [scenarioId]: {} };
  return { ...c, training: { ...c.training, baselines, answers } };
}

export function setTrainingAnswer(c: CompanyData, scenarioId: string, stepId: string, value: string): CompanyData {
  const answers = { ...(c.training.answers ?? {}), [scenarioId]: { ...(c.training.answers?.[scenarioId] ?? {}), [stepId]: value } };
  return { ...c, training: { ...c.training, answers } };
}

const newRecords = <T extends { id: string }>(items: T[], ids: string[]) => items.filter(x => !ids.includes(x.id));
const isBalanced = (j: CompanyData['journals'][number]) => {
  if (j.status !== 'Posted' || j.lines.length < 2) return false;
  const debit = j.lines.reduce((s, l) => s + l.debit, 0);
  const credit = j.lines.reduce((s, l) => s + l.credit, 0);
  return debit > 0 && debit === credit;
};
const accountFor = (c: CompanyData, accountId: string) => c.accounts.find(a => a.id === accountId);
const accountLines = (c: CompanyData, j: CompanyData['journals'][number], type: string, side: 'debit' | 'credit', amount?: number) => j.lines.filter(l => {
  const account = accountFor(c, l.accountId);
  return account?.type === type && l[side] > 0 && (amount === undefined || l[side] === amount);
});
const passed = (): { ok: true; hint: ''; } => ({ ok: true, hint: '' });
const failed = (hint: string, mistake?: string) => ({ ok: false, hint, mistake });
const answerMoney = (raw: string | undefined): number => {
  if (!raw?.trim()) return NaN;
  const parsed = Number(raw.replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? money(parsed) : NaN;
};

function checkStep(scenarioId: string, stepId: string, c: CompanyData, b: TrainingBaseline, answers: Record<string, string>) {
  const freshJournals = newRecords(c.journals, b.journalIds).filter(isBalanced);
  const freshPos = newRecords(c.purchaseOrders, b.purchaseOrderIds);
  const freshSupplierInvoices = newRecords(c.supplierInvoices, b.supplierInvoiceIds);
  const freshSalesInvoices = newRecords(c.salesInvoices, b.salesInvoiceIds);
  const freshExpenses = newRecords(c.expenses, b.expenseIds);
  const freshPayrollRuns = newRecords(c.payrollRuns, b.payrollRunIds);
  const freshMovements = newRecords(c.stockMovements, b.stockMovementIds);
  const findPayJournal = (kind: 'supplier' | 'customer', invoiceId: string) => newRecords(c.journals, b.journalIds).find(j => j.status === 'Posted' && j.sourceRef?.startsWith(`${kind}-payment:${invoiceId}:`));

  switch (`${scenarioId}:${stepId}`) {
    case 'journal-entry-rent:posted': return newRecords(c.journals, b.journalIds).some(j => j.status === 'Posted') ? passed() : failed('No new posted journal entry yet.', 'Drafts do not change balances until they are posted.');
    case 'journal-entry-rent:balanced': return freshJournals.length ? passed() : failed('Post a balanced entry with equal debits and credits.', 'Every posted journal must balance; drafts or unbalanced entries do not update the ledger.');
    case 'journal-entry-rent:accounts': {
      const candidates = newRecords(c.journals, b.journalIds).filter(isBalanced);
      return candidates.some(j => accountLines(c, j, 'Expense', 'debit', money(5000)).length && accountLines(c, j, 'Asset', 'credit', money(5000)).some(l => accountFor(c, l.accountId)?.id === ACCOUNT.CASH))
        ? passed() : failed('Find a posted $5,000 expense debit and matching Cash credit.', 'Expenses increase with a debit; Cash is an asset, so paying it reduces the account with a credit.');
    }
    case 'journal-entry-rent:reference': return newRecords(c.journals, b.journalIds).some(j => j.status === 'Posted' && Boolean(j.sourceRef?.trim())) ? passed() : failed('The journal needs a source reference. Posted documents carry a source reference for traceability.');

    case 'accounts-payable-payment:payment': {
      const paidFromBaseline = Object.keys(b.supplierInvoices).some(id => {
        const before = b.supplierInvoices[id], now = c.supplierInvoices.find(i => i.id === id);
        return before.amount > before.paidAmount && now && now.paidAmount > before.paidAmount && Boolean(findPayJournal('supplier', id));
      });
      return paidFromBaseline ? passed() : failed('Record a supplier payment against an invoice that was open when this scenario started.');
    }
    case 'accounts-payable-payment:full': {
      const full = Object.entries(b.supplierInvoices).some(([id, before]) => {
        const now = c.supplierInvoices.find(i => i.id === id);
        return before.amount > before.paidAmount && now?.status === 'Paid' && now.paidAmount === now.amount && Boolean(findPayJournal('supplier', id));
      });
      return full ? passed() : failed('No previously open invoice has been settled in full.', 'A partial payment leaves the remaining balance in Accounts Payable.');
    }
    case 'accounts-payable-payment:journal': {
      const valid = Object.keys(b.supplierInvoices).some(id => {
        const journal = findPayJournal('supplier', id);
        return journal && isBalanced(journal) && accountLines(c, journal, 'Liability', 'debit').some(l => l.accountId === ACCOUNT.AP) && accountLines(c, journal, 'Asset', 'credit').some(l => l.accountId === ACCOUNT.CASH);
      });
      return valid ? passed() : failed('Need a balanced payment journal: debit Accounts Payable and credit Cash.', 'Paying a supplier reduces a liability (debit) and an asset (credit).');
    }

    case 'accounts-receivable-invoice:invoice': return freshSalesInvoices.some(i => i.amount > 0) ? passed() : failed('Post a new customer invoice from the Sales module.');
    case 'accounts-receivable-invoice:revenue': {
      const valid = freshSalesInvoices.some(i => newRecords(c.journals, b.journalIds).some(j => j.sourceRef === `sales:${i.id}` && isBalanced(j) && accountLines(c, j, 'Asset', 'debit', i.amount).some(l => l.accountId === ACCOUNT.AR) && accountLines(c, j, 'Revenue', 'credit', i.amount).length));
      return valid ? passed() : failed('The invoice has no valid posted Revenue / Receivable entry.', 'On a credit sale, Receivable and Revenue are recorded when the invoice is posted.');
    }
    case 'accounts-receivable-invoice:payment': {
      const settled = freshSalesInvoices.some(i => i.status === 'Paid' && i.paidAmount === i.amount && Boolean(findPayJournal('customer', i.id)));
      return settled ? passed() : failed('Collect the full amount of a new customer invoice so it is marked Paid.');
    }
    case 'accounts-receivable-invoice:collection': {
      const valid = freshSalesInvoices.some(i => {
        const j = findPayJournal('customer', i.id);
        return j && isBalanced(j) && accountLines(c, j, 'Asset', 'debit').some(l => l.accountId === ACCOUNT.CASH) && accountLines(c, j, 'Asset', 'credit').some(l => l.accountId === ACCOUNT.AR);
      });
      return valid ? passed() : failed('No balanced collection entry was found.', 'Receiving a customer payment debits Cash and credits Accounts Receivable.');
    }

    case 'purchase-order-receive:po': return freshPos.some(p => p.supplierId && p.productId && p.qty > 0) ? passed() : failed('Create a purchase order with a supplier, product, and positive quantity.');
    case 'purchase-order-receive:approved': return freshPos.some(p => p.status === 'Approved' || p.status === 'Posted') ? passed() : failed('The new order is still pending approval.', 'Approval should happen before warehouse receipt.');
    case 'purchase-order-receive:received': return freshPos.some(p => p.qty > 0 && p.receivedQty === p.qty && p.status === 'Posted') ? passed() : failed('The new purchase order has not been received in full.');
    case 'purchase-order-receive:stock': {
      const valid = freshPos.some(p => {
        const movementQty = freshMovements.filter(m => m.reference === p.id && m.kind === 'Receipt').reduce((n, m) => n + m.qty, 0);
        const before = b.productQuantities[p.productId] ?? 0;
        const after = c.products.find(x => x.id === p.productId)?.qty ?? 0;
        return p.receivedQty > 0 && movementQty === p.receivedQty && after >= before + p.receivedQty;
      });
      return valid ? passed() : failed('Stock and the receipt movement must both reflect goods received.');
    }

    case 'supplier-invoice-match:linked': return freshSupplierInvoices.some(i => i.purchaseOrderId && c.purchaseOrders.some(p => p.id === i.purchaseOrderId)) ? passed() : failed('Register a new supplier invoice linked to its purchase order.');
    case 'supplier-invoice-match:match': {
      const valid = freshSupplierInvoices.some(i => {
        const po = c.purchaseOrders.find(p => p.id === i.purchaseOrderId);
        return po && po.receivedQty > 0 && i.amount === po.receivedQty * po.unitCost;
      });
      return valid ? passed() : failed('The supplier invoice does not match the received quantity and agreed cost.', 'Investigate amount mismatches before paying; the invoice is recorded only for received goods.');
    }
    case 'supplier-invoice-match:journal': {
      const valid = freshSupplierInvoices.some(i => {
        const j = newRecords(c.journals, b.journalIds).find(x => x.sourceRef === `purchase-invoice:${i.id}`);
        return j && isBalanced(j) && accountLines(c, j, 'Liability', 'debit').some(l => l.accountId === ACCOUNT.GRNI) && accountLines(c, j, 'Liability', 'credit').some(l => l.accountId === ACCOUNT.AP);
      });
      return valid ? passed() : failed('The linked invoice journal should debit GRNI and credit Accounts Payable.', 'Inventory was recognized at receipt; the invoice clears GRNI into the supplier payable.');
    }

    case 'inventory-adjustment:movement': return freshMovements.some(m => m.kind === 'Adjustment' && m.qty !== 0) ? passed() : failed('Post a nonzero adjustment in Inventory.');
    case 'inventory-adjustment:quantity': {
      const valid = freshMovements.filter(m => m.kind === 'Adjustment').some(m => {
        const oldQty = b.productQuantities[m.productId];
        const newQty = c.products.find(p => p.id === m.productId)?.qty;
        if (oldQty === undefined || newQty === undefined) return false;
        const netMovement = c.stockMovements.filter(x => x.productId === m.productId && !b.stockMovementIds.includes(x.id)).reduce((n, x) => n + x.qty, 0);
        return newQty === oldQty + netMovement;
      });
      return valid ? passed() : failed('The on-hand quantity should equal its previous balance plus newly recorded movements.');
    }

    case 'record-expense:expense': return freshExpenses.some(e => e.amount === money(1200)) ? passed() : failed('No new expense for $1,200 found.');
    case 'record-expense:category': return freshExpenses.some(e => e.amount === money(1200) && e.category.trim() && Boolean(e.journalId)) ? passed() : failed('The $1,200 expense needs a category and linked journal.');
    case 'record-expense:journal': {
      const valid = freshExpenses.some(e => {
        const j = c.journals.find(x => x.id === e.journalId);
        return e.amount === money(1200) && j && isBalanced(j) && accountLines(c, j, 'Expense', 'debit', e.amount).length && accountLines(c, j, 'Asset', 'credit', e.amount).some(l => l.accountId === ACCOUNT.CASH);
      });
      return valid ? passed() : failed('The expense must link to a balanced expense-debit / Cash-credit journal.');
    }

    case 'financial-statements:viewed': {
      const required = ['trial_balance', 'income_statement', 'balance_sheet'];
      const missing = required.filter(x => !b.reportViews.includes(x) && !(c.training.reportViews ?? []).includes(x));
      return missing.length ? failed(`Open Reports & Analytics. Still to review: ${missing.join(', ').replaceAll('_', ' ')}.`) : passed();
    }
    case 'financial-statements:netIncome': {
      const value = answerMoney(answers.netIncome);
      return Number.isNaN(value) ? failed('Enter the Net Income shown in Reports.') : Math.abs(value - reports(c).netIncome) < 1 ? passed() : failed('Net Income does not match the report.', 'Net income equals posted revenue minus posted expenses. Recheck the Income Statement.');
    }
    case 'financial-statements:totalAssets': {
      const value = answerMoney(answers.totalAssets);
      return Number.isNaN(value) ? failed('Enter Total Assets shown in Reports.') : Math.abs(value - reports(c).assets) < 1 ? passed() : failed('Total Assets does not match the report.', 'Add the asset accounts shown on the Balance Sheet.');
    }
    case 'financial-statements:equation': return Math.abs(reports(c).balanceCheck) < 1 ? passed() : failed('The accounting equation is out of balance.', 'Review posted journals; Assets must equal Liabilities plus Equity and current earnings.');

    case 'review-reports:viewed': return (c.training.reportViews ?? []).includes('income_statement') ? passed() : failed('Open Reports & Analytics first.');
    case 'review-reports:topExpense': {
      const given = (answers.topExpense ?? '').trim().toLocaleLowerCase();
      if (!given) return failed('Enter the largest expense account name or code.');
      const expenseAccounts = c.accounts.filter(a => a.type === 'Expense');
      const bal = reports(c).balances;
      const top = expenseAccounts.sort((a, z) => (bal[z.id] ?? 0) - (bal[a.id] ?? 0))[0];
      return top && (given === top.name.toLocaleLowerCase() || given === top.code.toLocaleLowerCase()) ? passed() : failed('That is not the largest expense account.', `Compare expense balances in the report. The largest balance is ${top?.name ?? 'not available'}.`);
    }
    case 'review-reports:lowCount': {
      const value = Number(answers.lowCount);
      if (!Number.isInteger(value)) return failed('Enter a whole-number product count.');
      const expected = c.products.filter(p => p.qty <= p.reorderLevel).length;
      return value === expected ? passed() : failed('The low-stock count is incorrect.', 'Count products where on-hand quantity is less than or equal to the reorder level.');
    }

    case 'record-to-report:journal': return newRecords(c.journals, b.journalIds).some(isBalanced) ? passed() : failed('Post a new balanced journal entry first.');
    case 'record-to-report:reports': return (c.training.reportViews ?? []).some(x => ['trial_balance', 'income_statement', 'balance_sheet'].includes(x) && !b.reportViews.includes(x)) ? passed() : failed('Open Reports & Analytics after posting.');
    case 'record-to-report:balanced': return Math.abs(reports(c).balanceCheck) < 1 ? passed() : failed('The posted records do not balance.', 'Investigate the new posting before closing the period.');

    case 'procure-to-pay-cycle:order': return freshPos.some(p => ['Approved', 'Posted'].includes(p.status)) ? passed() : failed('Create and approve a new purchase order.');
    case 'procure-to-pay-cycle:receipt': return freshPos.some(p => p.status === 'Posted' && p.receivedQty === p.qty && freshMovements.some(m => m.reference === p.id && m.kind === 'Receipt' && m.qty === p.qty)) ? passed() : failed('Receive the full quantity on that order.');
    case 'procure-to-pay-cycle:invoice': return freshSupplierInvoices.some(i => {
      const po = freshPos.find(p => p.id === i.purchaseOrderId);
      return po && po.status === 'Posted' && i.amount === po.receivedQty * po.unitCost;
    }) ? passed() : failed('Register a matching invoice for the newly received order.');
    case 'procure-to-pay-cycle:paid': return freshSupplierInvoices.some(i => i.status === 'Paid' && i.paidAmount === i.amount && Boolean(findPayJournal('supplier', i.id)) && freshPos.some(p => p.id === i.purchaseOrderId)) ? passed() : failed('Pay the invoice linked to that new order in full.');

    case 'payroll-simulation:run': return freshPayrollRuns.some(r => r.status === 'Posted' && Boolean(r.journalId)) ? passed() : failed('Run payroll for a month that has not already been posted.');
    case 'payroll-simulation:gross': return freshPayrollRuns.some(r => r.status === 'Posted' && r.employeeCount === c.employees.filter(e => e.active).length && r.gross === c.employees.filter(e => e.active).reduce((n, e) => n + e.salary, 0)) ? passed() : failed('The run does not match current active employees and their salaries.');
    case 'payroll-simulation:journal': {
      const valid = freshPayrollRuns.some(r => {
        const j = c.journals.find(x => x.id === r.journalId);
        return r.status === 'Posted' && j && isBalanced(j) && accountLines(c, j, 'Expense', 'debit', r.gross).some(l => l.accountId === ACCOUNT.PAYROLL) && accountLines(c, j, 'Asset', 'credit', r.gross).some(l => l.accountId === ACCOUNT.CASH);
      });
      return valid ? passed() : failed('The run needs a balanced linked Payroll Expense / Cash journal.');
    }
    default: return failed('This scenario step is not configured.');
  }
}

export function evaluateScenario(scenarioId: string, c: CompanyData): ScenarioResult {
  const scenario = trainingScenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error('Unknown training scenario.');
  const baseline = c.training.baselines?.[scenarioId];
  const answers = c.training.answers?.[scenarioId] ?? {};
  const steps = scenario.steps.map(step => {
    if (!baseline) return { id: step.id, text: step.text, ok: false, hint: 'Start the scenario to capture a baseline. Existing demo records will not count as your work.' };
    if (baseline.companyId !== c.company.id) return { id: step.id, text: step.text, ok: false, hint: 'Start this scenario again in the current company.' };
    const result = checkStep(scenarioId, step.id, c, baseline, answers);
    return { id: step.id, text: step.text, ...result };
  });
  const passedCount = steps.filter(s => s.ok).length;
  return { scenarioId, steps, passed: passedCount, total: steps.length, score: Math.round(passedCount / steps.length * 100), completed: passedCount === steps.length };
}

export function recordScenarioResult(c: CompanyData, result: ScenarioResult): CompanyData {
  const bestScores = { ...(c.training.bestScores ?? {}), [result.scenarioId]: Math.max(c.training.bestScores?.[result.scenarioId] ?? 0, result.score) };
  const completed = result.completed ? Array.from(new Set([...c.training.completed, result.scenarioId])) : c.training.completed;
  return { ...c, training: { ...c.training, bestScores, completed } };
}

export function markTrainingReportsViewed(c: CompanyData): CompanyData {
  const required = ['trial_balance', 'income_statement', 'balance_sheet'];
  const previous = c.training.reportViews ?? [];
  const reportViews = Array.from(new Set([...previous, ...required]));
  if (reportViews.length === previous.length) return c;
  return { ...c, training: { ...c.training, reportViews } };
}
