import { describe, expect, it } from 'vitest';
import { ACCOUNT, money } from './model';
import {
  adjustInventory, createDemoCompany, createPurchaseOrder, createSalesInvoice, invoiceSupplier,
  paySupplierInvoice, postJournal, receiveCustomerPayment,
  receivePurchaseOrder, recordExpense, reports, runPayroll, setPurchaseOrderStatus,
} from './erp';
import {
  evaluateScenario, markTrainingReportsViewed as markReports, recordScenarioResult,
  setTrainingAnswer, startTrainingScenario, trainingScenarios,
} from './training';

const begin = (...scenarioIds: string[]) => {
  let c = createDemoCompany();
  for (const id of scenarioIds) c = startTrainingScenario(c, id);
  return c;
};
const result = (c: ReturnType<typeof createDemoCompany>, id: string) => evaluateScenario(id, c);
const rentJournal = (c: ReturnType<typeof createDemoCompany>) => postJournal(c, 'Office rent', [
  { accountId: ACCOUNT.EXPENSE, debit: money(5000), credit: 0 },
  { accountId: ACCOUNT.CASH, debit: 0, credit: money(5000) },
], 'manual:training-rent');

describe('training scenario engine with the shared ERP model', () => {
  it('excludes all demo records until a scenario baseline is captured', () => {
    const c = createDemoCompany();
    expect(trainingScenarios.every(s => !evaluateScenario(s.id, c).completed)).toBe(true);
    let started = startTrainingScenario(c, 'accounts-payable-payment');
    expect(result(started, 'accounts-payable-payment').completed).toBe(false);
    started = paySupplierInvoice(started, 'PI-1001', started.supplierInvoices[0].amount);
    expect(result(started, 'accounts-payable-payment').completed).toBe(true);
  });

  it('validates a new $5,000 rent journal and explains drafts and wrong account sides', () => {
    let c = begin('journal-entry-rent');
    c.journals.push({ id: 'JE-DRAFT', date: '2026-11-01', description: 'Rent draft', status: 'Draft', sourceRef: 'draft:rent', lines: [
      { accountId: ACCOUNT.EXPENSE, debit: money(5000), credit: 0 }, { accountId: ACCOUNT.CASH, debit: 0, credit: money(5000) },
    ] });
    const draftResult = result(c, 'journal-entry-rent');
    expect(draftResult.steps[0].ok).toBe(false);
    c = rentJournal(c);
    expect(result(c, 'journal-entry-rent').completed).toBe(true);

    let wrong = begin('journal-entry-rent');
    wrong = postJournal(wrong, 'Wrong sides', [
      { accountId: ACCOUNT.CASH, debit: money(5000), credit: 0 },
      { accountId: ACCOUNT.EXPENSE, debit: 0, credit: money(5000) },
    ], 'manual:wrong-sides');
    expect(result(wrong, 'journal-entry-rent').steps[2].ok).toBe(false);
    expect(result(wrong, 'journal-entry-rent').steps[2].mistake).toMatch(/expense|cash/i);
  });

  it('rejects an unbalanced posted journal when checking journal correctness', () => {
    const c = begin('journal-entry-rent');
    c.journals.push({ id: 'JE-INVALID', date: '2026-11-01', description: 'Invalid fixture', status: 'Posted', sourceRef: 'fixture:invalid', lines: [
      { accountId: ACCOUNT.EXPENSE, debit: money(5000), credit: 0 }, { accountId: ACCOUNT.CASH, debit: 0, credit: money(4000) },
    ] });
    const checked = result(c, 'journal-entry-rent');
    expect(checked.steps[1].ok).toBe(false);
    expect(checked.completed).toBe(false);
  });

  it('settles a previously open supplier invoice and detects partial payments', () => {
    let c = begin('accounts-payable-payment');
    c = paySupplierInvoice(c, 'PI-1001', money(400));
    const partial = result(c, 'accounts-payable-payment');
    expect(partial.steps[0].ok).toBe(true);
    expect(partial.steps[1].ok).toBe(false);
    expect(partial.steps[1].mistake).toMatch(/partial/i);
    c = paySupplierInvoice(c, 'PI-1001', money(780));
    expect(result(c, 'accounts-payable-payment').completed).toBe(true);
  });

  it('completes Order to Cash with a newly posted invoice and full collection', () => {
    let c = begin('accounts-receivable-invoice');
    c = createSalesInvoice(c, c.customers[0].id, 'p-paper', 2, '2026-12-31');
    const inv = c.salesInvoices[0];
    expect(result(c, 'accounts-receivable-invoice').steps[1].ok).toBe(true);
    c = receiveCustomerPayment(c, inv.id, inv.amount);
    expect(result(c, 'accounts-receivable-invoice').completed).toBe(true);
  });

  it('uses the approved purchase order and receipt workflow, excluding seeded orders', () => {
    let c = begin('purchase-order-receive');
    c = createPurchaseOrder(c, c.suppliers[0].id, 'p-monitor', 2);
    const po = c.purchaseOrders[0];
    expect(result(c, 'purchase-order-receive').steps[0].ok).toBe(true);
    c = setPurchaseOrderStatus(c, po.id, 'Approved');
    c = receivePurchaseOrder(c, po.id, po.qty);
    expect(result(c, 'purchase-order-receive').completed).toBe(true);
  });

  it('checks three-way matching and flags an amount changed away from the actual receipt', () => {
    let c = begin('supplier-invoice-match');
    c = createPurchaseOrder(c, c.suppliers[1].id, 'p-chair', 3);
    const po = c.purchaseOrders[0];
    c = setPurchaseOrderStatus(c, po.id, 'Approved');
    c = receivePurchaseOrder(c, po.id, po.qty);
    c = invoiceSupplier(c, po.id, '2026-12-31');
    expect(result(c, 'supplier-invoice-match').completed).toBe(true);

    let mismatch = begin('supplier-invoice-match');
    mismatch = createPurchaseOrder(mismatch, mismatch.suppliers[1].id, 'p-chair', 3);
    const po2 = mismatch.purchaseOrders[0];
    mismatch = setPurchaseOrderStatus(mismatch, po2.id, 'Approved');
    mismatch = receivePurchaseOrder(mismatch, po2.id, po2.qty);
    mismatch = invoiceSupplier(mismatch, po2.id, '2026-12-31');
    mismatch = { ...mismatch, supplierInvoices: mismatch.supplierInvoices.map(i => i.id === mismatch.supplierInvoices[0].id ? { ...i, amount: i.amount + 1 } : i) };
    expect(result(mismatch, 'supplier-invoice-match').steps[1].ok).toBe(false);
  });

  it('completes Procure to Pay end to end on one new order and invoice', () => {
    let c = begin('procure-to-pay-cycle');
    c = createPurchaseOrder(c, c.suppliers[0].id, 'p-monitor', 2);
    const po = c.purchaseOrders[0];
    c = setPurchaseOrderStatus(c, po.id, 'Approved');
    c = receivePurchaseOrder(c, po.id, po.qty);
    c = invoiceSupplier(c, po.id, '2026-12-31');
    c = paySupplierInvoice(c, c.supplierInvoices[0].id, c.supplierInvoices[0].amount);
    expect(result(c, 'procure-to-pay-cycle').completed).toBe(true);
    expect(Math.abs(reports(c).balanceCheck)).toBeLessThan(1);
  });

  it('posts inventory adjustments through shared domain logic and verifies the stock ledger', () => {
    let c = begin('inventory-adjustment');
    c = adjustInventory(c, 'p-paper', 5);
    expect(result(c, 'inventory-adjustment').completed).toBe(true);
    expect(c.products.find(p => p.id === 'p-paper')?.qty).toBe(115);
    expect(c.audit[0].operation).toBe('Inventory adjustment posted');
    expect(Math.abs(reports(c).balanceCheck)).toBeLessThan(1);
    expect(() => adjustInventory(c, 'p-paper', -1000)).toThrow(/negative/i);
  });

  it('records a categorized operating expense with a linked balanced journal', () => {
    let c = begin('record-expense');
    c = recordExpense(c, 'Utilities', money(1200), 'Training utilities bill');
    expect(result(c, 'record-expense').completed).toBe(true);
    expect(Math.abs(reports(c).balanceCheck)).toBeLessThan(1);
  });

  it('marks reports viewed, grades statement answers, and validates report-review answers', () => {
    let c = begin('financial-statements', 'review-reports');
    c = markReports(c);
    const statements = reports(c);
    c = setTrainingAnswer(c, 'financial-statements', 'netIncome', (statements.netIncome / 100).toFixed(2));
    c = setTrainingAnswer(c, 'financial-statements', 'totalAssets', (statements.assets / 100).toFixed(2));
    expect(result(c, 'financial-statements').completed).toBe(true);
    let wrong = setTrainingAnswer(c, 'financial-statements', 'netIncome', '123456.78');
    expect(result(wrong, 'financial-statements').steps[1].ok).toBe(false);

    c = setTrainingAnswer(c, 'review-reports', 'topExpense', 'Cost of Goods Sold');
    c = setTrainingAnswer(c, 'review-reports', 'lowCount', String(c.products.filter(p => p.qty <= p.reorderLevel).length));
    expect(result(c, 'review-reports').completed).toBe(true);
  });

  it('completes Record to Report only after posting and opening reports', () => {
    let c = begin('record-to-report');
    c = rentJournal(c);
    expect(result(c, 'record-to-report').steps[0].ok).toBe(true);
    expect(result(c, 'record-to-report').steps[1].ok).toBe(false);
    c = markReports(c);
    expect(result(c, 'record-to-report').completed).toBe(true);
  });

  it('simulates payroll once, checks gross and linked journal, and prevents duplicate month posting', () => {
    let c = begin('payroll-simulation');
    c = runPayroll(c, '2026-11');
    expect(result(c, 'payroll-simulation').completed).toBe(true);
    expect(Math.abs(reports(c).balanceCheck)).toBeLessThan(1);
    expect(() => runPayroll(c, '2026-11')).toThrow(/already been posted/i);
  });

  it('records scores and persists completion only when all steps pass', () => {
    let c = begin('journal-entry-rent');
    let checked = result(c, 'journal-entry-rent');
    c = recordScenarioResult(c, checked);
    expect(c.training.bestScores?.['journal-entry-rent']).toBe(0);
    expect(c.training.completed).not.toContain('journal-entry-rent');
    c = rentJournal(c);
    checked = result(c, 'journal-entry-rent');
    c = recordScenarioResult(c, checked);
    expect(c.training.bestScores?.['journal-entry-rent']).toBe(100);
    expect(c.training.completed).toContain('journal-entry-rent');
  });
});
