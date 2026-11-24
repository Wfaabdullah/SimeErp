import { ACCOUNT, makeId, money, today, type AccountType, type AuditEvent, type CompanyData, type DocStatus, type Journal, type JournalLine, type Workspace } from './model';

const nowIso = () => new Date().toISOString();
const accountSeed = [
  [ACCOUNT.CASH,'1000','Cash and Cash Equivalents','Asset'], [ACCOUNT.AR,'1100','Accounts Receivable','Asset'],
  [ACCOUNT.INVENTORY,'1200','Inventory','Asset'], [ACCOUNT.AP,'2000','Accounts Payable','Liability'],
  [ACCOUNT.GRNI,'2100','Goods Received Not Invoiced','Liability'], [ACCOUNT.EQUITY,'3000','Owner Equity','Equity'],
  [ACCOUNT.SALES,'4000','Product Revenue','Revenue'], [ACCOUNT.COGS,'5000','Cost of Goods Sold','Expense'],
  [ACCOUNT.EXPENSE,'6100','Operating Expenses','Expense'], [ACCOUNT.PAYROLL,'6200','Payroll Expense','Expense'],
] as const;
const accounts = () => accountSeed.map(([id,code,name,type]) => ({id,code,name,type:type as AccountType}));
const audit = (operation:string, documentId:string, documentType:string, previousStatus:AuditEvent['previousStatus'], newStatus:AuditEvent['newStatus'], journalIds:string[]=[], note?:string):AuditEvent => ({id:makeId('AUD'),at:nowIso(),operation,documentId,documentType,previousStatus,newStatus,journalIds,note});
const j = (id:string,date:string,description:string,sourceRef:string,lines:JournalLine[]):Journal => ({id,date,description,status:'Posted',sourceRef,lines});

export function createDemoCompany(name='Northstar Learning Supply Co.'): CompanyData {
  const coId=makeId('CO');
  const products=[
    {id:'p-laptop',sku:'TECH-100',name:'Business Laptop',category:'Technology',unitCost:money(690),unitPrice:money(995),qty:18,reorderLevel:6},
    {id:'p-chair',sku:'OFF-210',name:'Ergonomic Task Chair',category:'Office',unitCost:money(118),unitPrice:money(189),qty:52,reorderLevel:12},
    {id:'p-paper',sku:'SUP-050',name:'Recycled Paper Case',category:'Supplies',unitCost:money(22),unitPrice:money(36),qty:110,reorderLevel:25},
    {id:'p-monitor',sku:'TECH-330',name:'27-inch Monitor',category:'Technology',unitCost:money(174),unitPrice:money(269),qty:9,reorderLevel:5},
  ];
  const customers=[{id:'c-uni',name:'Riverview University',email:'ap@riverview.example',phone:'555-0108',terms:'Net 30'},{id:'c-studio',name:'Aster Design Studio',email:'finance@aster.example',phone:'555-0144',terms:'Net 15'},{id:'c-labs',name:'Pioneer Science Lab',email:'office@pioneer.example',phone:'555-0182',terms:'Net 30'}];
  const suppliers=[{id:'s-tech',name:'Meridian Technology Wholesale',email:'billing@meridian.example',phone:'555-0201',terms:'Net 30'},{id:'s-office',name:'Cedar Office Goods',email:'ar@cedar.example',phone:'555-0220',terms:'Net 15'},{id:'s-paper',name:'Greenleaf Paper Co.',email:'accounts@greenleaf.example',phone:'555-0235',terms:'Net 30'}];
  const journals:Journal[]=[
    j('JE-OPEN-001','2025-01-01','Opening cash, inventory and owner capital','opening:1',[
      {accountId:ACCOUNT.CASH,debit:money(42000),credit:0},{accountId:ACCOUNT.INVENTORY,debit:products.reduce((s,p)=>s+p.qty*p.unitCost,0)-money(1180),credit:0},{accountId:ACCOUNT.EQUITY,debit:0,credit:money(42000)+products.reduce((s,p)=>s+p.qty*p.unitCost,0)-money(1180)}]),
    j('JE-GR-1001','2025-09-14','Goods receipt — Cedar Office Goods','goods-receipt:PO-1000:10',[
      {accountId:ACCOUNT.INVENTORY,debit:money(1180),credit:0},{accountId:ACCOUNT.GRNI,debit:0,credit:money(1180)}]),
    j('JE-SI-1001','2025-09-05','Riverview University — Business laptops','sales:SI-1001',[
      {accountId:ACCOUNT.AR,debit:money(3980),credit:0},{accountId:ACCOUNT.SALES,debit:0,credit:money(3980)},{accountId:ACCOUNT.COGS,debit:money(2760),credit:0},{accountId:ACCOUNT.INVENTORY,debit:0,credit:money(2760)}]),
    j('JE-PAY-1001','2025-09-12','Partial receipt — Riverview University','payment:PAY-1001',[
      {accountId:ACCOUNT.CASH,debit:money(1500),credit:0},{accountId:ACCOUNT.AR,debit:0,credit:money(1500)}]),
    j('JE-EXP-1001','2025-09-16','Warehouse utilities — September','expense:EX-1001',[
      {accountId:ACCOUNT.EXPENSE,debit:money(680),credit:0},{accountId:ACCOUNT.CASH,debit:0,credit:money(680)}]),
    j('JE-PUR-1001','2025-09-18','Supplier invoice — Cedar Office Goods','purchase-invoice:PI-1001',[
      {accountId:ACCOUNT.GRNI,debit:money(1180),credit:0},{accountId:ACCOUNT.AP,debit:0,credit:money(1180)}]),
  ];
  return {
    company:{id:coId,name,currency:'USD',fiscalYearStart:'2025-01-01',createdAt:nowIso()},accounts:accounts(),journals,
    suppliers,customers,products,
    purchaseOrders:[{id:'PO-1000',supplierId:'s-office',productId:'p-chair',qty:10,unitCost:money(118),status:'Posted',createdAt:'2025-09-10T09:30:00.000Z',receivedQty:10},{id:'PO-1001',supplierId:'s-tech',productId:'p-monitor',qty:8,unitCost:money(174),status:'Approved',createdAt:'2025-09-20T09:30:00.000Z',receivedQty:0}],
    supplierInvoices:[{id:'PI-1001',supplierId:'s-office',purchaseOrderId:'PO-LEGACY',amount:money(1180),paidAmount:0,status:'Posted',date:'2025-09-18',dueDate:'2025-10-18'}],
    salesInvoices:[{id:'SI-1001',customerId:'c-uni',productId:'p-laptop',qty:4,amount:money(3980),cogs:money(2760),paidAmount:money(1500),status:'Partially Paid',date:'2025-09-05',dueDate:'2025-10-05'}],
    stockMovements:[{id:'SM-OPEN-1',productId:'p-laptop',qty:18,kind:'Receipt',reference:'Opening inventory',date:'2025-01-01'},{id:'SM-OPEN-2',productId:'p-chair',qty:42,kind:'Receipt',reference:'Opening inventory',date:'2025-01-01'},{id:'SM-OPEN-3',productId:'p-paper',qty:110,kind:'Receipt',reference:'Opening inventory',date:'2025-01-01'},{id:'SM-OPEN-4',productId:'p-monitor',qty:9,kind:'Receipt',reference:'Opening inventory',date:'2025-01-01'},{id:'SM-REC-1',productId:'p-chair',qty:10,kind:'Receipt',reference:'PO-1000',date:'2025-09-14'},{id:'SM-SALE-1',productId:'p-laptop',qty:-4,kind:'Sale',reference:'SI-1001',date:'2025-09-05'}],
    employees:[{id:'e-001',name:'Maya Chen',department:'Operations',role:'Inventory Lead',salary:money(6200),active:true},{id:'e-002',name:'Jordan Ellis',department:'Finance',role:'Accounting Associate',salary:money(5800),active:true},{id:'e-003',name:'Amira Hassan',department:'Sales',role:'Account Manager',salary:money(5400),active:true},{id:'e-004',name:'Leo Martin',department:'Operations',role:'Warehouse Associate',salary:money(4300),active:true}],
    attendance:[{id:'att-001',employeeId:'e-001',date:'2025-09-22',status:'Present'},{id:'att-002',employeeId:'e-002',date:'2025-09-22',status:'Present'},{id:'att-003',employeeId:'e-003',date:'2025-09-22',status:'Leave'},{id:'att-004',employeeId:'e-004',date:'2025-09-22',status:'Present'}],
    payrollRuns:[],expenses:[{id:'EX-1001',date:'2025-09-16',category:'Utilities',amount:money(680),description:'Warehouse utilities — September',status:'Posted',journalId:'JE-EXP-1001'}],
    audit:[audit('Opening balances loaded','JE-OPEN-001','Journal','New','Posted',['JE-OPEN-001'],'Fictional demo-company opening position.'),audit('Customer invoice posted','SI-1001','Sales Invoice','Approved','Partially Paid',['JE-SI-1001','JE-PAY-1001'],'$1,500 received against the $3,980 invoice.'),audit('Expense posted','EX-1001','Expense','Approved','Posted',['JE-EXP-1001']),audit('Supplier invoice recorded','PI-1001','Purchase Invoice','Approved','Posted',['JE-PUR-1001'])],training:{completed:[]},
  };
}
export function initialWorkspace(): Workspace { const demo=createDemoCompany(); return {version:1,currentCompanyId:demo.company.id,companies:{[demo.company.id]:demo}}; }
export function currentCompany(w:Workspace):CompanyData { const c=w.companies[w.currentCompanyId]; if(!c) throw new Error('Selected company is missing. Choose another training company.'); return c; }
export function withCompany(w:Workspace,c:CompanyData):Workspace { return {...w,companies:{...w.companies,[c.company.id]:c}}; }
export function validateJournal(lines:JournalLine[]): {debit:number;credit:number;valid:boolean;error?:string} {
  if(!lines.length) return {debit:0,credit:0,valid:false,error:'Add at least two journal lines.'};
  for(const l of lines) if(!l.accountId || !Number.isInteger(l.debit) || !Number.isInteger(l.credit) || l.debit<0 || l.credit<0 || (l.debit>0 && l.credit>0)) return {debit:0,credit:0,valid:false,error:'Each line needs a valid account and a non-negative debit or credit—not both.'};
  const debit=lines.reduce((s,l)=>s+l.debit,0), credit=lines.reduce((s,l)=>s+l.credit,0);
  return {debit,credit,valid:debit>0&&credit>0&&debit===credit,error:debit===credit?'':'Journal is unbalanced. Total debits must equal total credits.'};
}
export function postJournal(c:CompanyData,description:string,lines:JournalLine[],sourceRef:string,date=today()):CompanyData {
  const check=validateJournal(lines); if(!check.valid) throw new Error(check.error || 'Invalid journal.');
  if(c.journals.some(x=>x.sourceRef===sourceRef && x.status==='Posted')) throw new Error(`A posted journal already exists for ${sourceRef}; duplicate posting was blocked.`);
  const id=makeId('JE'); const entry:Journal={id,date,description,status:'Posted',lines:structuredClone(lines),sourceRef};
  return {...c,journals:[...c.journals,entry],audit:[audit('Journal posted',id,'Journal','Draft','Posted',[id],description),...c.audit]};
}
export function reversePostedJournal(c:CompanyData,id:string,reason:string):CompanyData {
  const original=c.journals.find(x=>x.id===id&&x.status==='Posted'); if(!original) throw new Error('Only a posted journal can be reversed.');
  if(c.journals.some(x=>x.reversalOf===id)) throw new Error('This journal has already been reversed.');
  const reversed=postJournal(c,`Reversal of ${id}: ${reason}`,original.lines.map(l=>({accountId:l.accountId,debit:l.credit,credit:l.debit,memo:`Reversal: ${l.memo??''}`})),`reversal:${id}`);
  const reversalId=reversed.journals.at(-1)!.id;
  return {...reversed,journals:reversed.journals.map(x=>x.id===reversalId?{...x,reversalOf:id}:x),audit:[audit('Posted journal reversed',id,'Journal','Posted','Posted',[id,reversalId],reason),...reversed.audit]};
}
export function assertEditable(status:DocStatus):void { if(status==='Posted'||status==='Partially Paid'||status==='Paid') throw new Error('Posted or paid records are locked to protect accounting integrity. Use an explicit reversal/correction workflow.'); if(status==='Cancelled') throw new Error('Cancelled records cannot be edited. Create a new document instead.'); }
export function cancelDraft(c:CompanyData,type:string,id:string):CompanyData {
  const key=type==='Purchase Order'?'purchaseOrders':type==='Sales Invoice'?'salesInvoices':'supplierInvoices';
  const rows=c[key] as Array<{id:string;status:DocStatus}>; const doc=rows.find(x=>x.id===id); if(!doc) throw new Error('Document not found.');
  if(['Posted','Partially Paid','Paid'].includes(doc.status)) throw new Error('A posted or paid document cannot be cancelled directly. Create a correction or reversal.');
  if(doc.status==='Cancelled') throw new Error('Document is already cancelled.');
  return {...c,[key]:rows.map(x=>x.id===id?{...x,status:'Cancelled'}:x),audit:[audit('Document cancelled',id,type,doc.status,'Cancelled'),...c.audit]};
}
export function createPurchaseOrder(c:CompanyData,supplierId:string,productId:string,qty:number):CompanyData {
  if(!c.suppliers.some(x=>x.id===supplierId)) throw new Error('Choose a valid supplier.'); const p=c.products.find(x=>x.id===productId); if(!p||!Number.isInteger(qty)||qty<=0) throw new Error('Choose a valid item and a positive whole-number quantity.');
  const id=makeId('PO');const doc={id,supplierId,productId,qty,unitCost:p.unitCost,status:'Pending Approval' as DocStatus,createdAt:nowIso(),receivedQty:0};
  return {...c,purchaseOrders:[doc,...c.purchaseOrders],audit:[audit('Purchase order created',id,'Purchase Order','New','Pending Approval'),...c.audit]};
}
export function setPurchaseOrderStatus(c:CompanyData,id:string,status:'Approved'):CompanyData {
  const doc=c.purchaseOrders.find(x=>x.id===id); if(!doc||doc.status!=='Pending Approval') throw new Error('Only a pending purchase order can be approved.');
  return {...c,purchaseOrders:c.purchaseOrders.map(x=>x.id===id?{...x,status}:x),audit:[audit('Purchase order approved',id,'Purchase Order',doc.status,status),...c.audit]};
}
export function receivePurchaseOrder(c:CompanyData,id:string,qty:number):CompanyData {
  const po=c.purchaseOrders.find(x=>x.id===id);if(!po||po.status!=='Approved') throw new Error('Approve the purchase order before receiving goods.');
  const remaining=po.qty-po.receivedQty;if(!Number.isInteger(qty)||qty<=0||qty>remaining) throw new Error(`Enter a whole quantity from 1 to ${remaining}.`);
  const amount=qty*po.unitCost;let n={...c};const p=n.products.find(x=>x.id===po.productId)!;
  n={...n,products:n.products.map(x=>x.id===p.id?{...x,qty:x.qty+qty}:x),stockMovements:[{id:makeId('SM'),productId:p.id,qty,kind:'Receipt',reference:id,date:today()},...n.stockMovements]};
  n=postJournal(n,`Goods receipt against ${id}`,[{accountId:ACCOUNT.INVENTORY,debit:amount,credit:0},{accountId:ACCOUNT.GRNI,debit:0,credit:amount}],`goods-receipt:${id}:${po.receivedQty+qty}`);
  const received=po.receivedQty+qty;const newStatus:DocStatus=received===po.qty?'Posted':'Approved';
  return {...n,purchaseOrders:n.purchaseOrders.map(x=>x.id===id?{...x,receivedQty:received,status:newStatus}:x),audit:[audit('Goods received',id,'Purchase Order',po.status,newStatus,n.journals.slice(0,n.journals.length-c.journals.length).map(x=>x.id),`${qty} units added to inventory.`),...n.audit]};
}
export function invoiceSupplier(c:CompanyData,poId:string,dueDate:string):CompanyData {
  const po=c.purchaseOrders.find(x=>x.id===poId);if(!po||!po.receivedQty) throw new Error('Receive at least some goods before entering a supplier invoice.');
  if(c.supplierInvoices.some(x=>x.purchaseOrderId===poId&&x.status!=='Cancelled')) throw new Error('A supplier invoice already exists for this order.');
  const amount=po.receivedQty*po.unitCost,id=makeId('PI');const invoice={id,supplierId:po.supplierId,purchaseOrderId:poId,amount,paidAmount:0,status:'Posted' as DocStatus,date:today(),dueDate};
  let n=postJournal(c,`Supplier invoice ${id}`,[{accountId:ACCOUNT.GRNI,debit:amount,credit:0},{accountId:ACCOUNT.AP,debit:0,credit:amount}],`purchase-invoice:${id}`);
  n={...n,supplierInvoices:[invoice,...n.supplierInvoices]};return {...n,audit:[audit('Supplier invoice registered',id,'Purchase Invoice','Approved','Posted',n.journals.slice(0,n.journals.length-c.journals.length).map(x=>x.id),`AP ${amount/100} ${n.company.currency}`),...n.audit]};
}
export function paySupplierInvoice(c:CompanyData,id:string,amount:number):CompanyData {
  const inv=c.supplierInvoices.find(x=>x.id===id);if(!inv||!['Posted','Partially Paid'].includes(inv.status)) throw new Error('Only an open supplier invoice can be paid.');
  if(!Number.isInteger(amount)||amount<=0||amount>inv.amount-inv.paidAmount) throw new Error('Payment must be positive and no greater than the outstanding balance.');
  let n=postJournal(c,`Supplier payment against ${id}`,[{accountId:ACCOUNT.AP,debit:amount,credit:0},{accountId:ACCOUNT.CASH,debit:0,credit:amount}],`supplier-payment:${id}:${inv.paidAmount+amount}`);
  const paid=inv.paidAmount+amount,status:DocStatus=paid===inv.amount?'Paid':'Partially Paid';n={...n,supplierInvoices:n.supplierInvoices.map(x=>x.id===id?{...x,paidAmount:paid,status}:x)};
  return {...n,audit:[audit('Supplier payment recorded',id,'Purchase Invoice',inv.status,status,n.journals.slice(0,n.journals.length-c.journals.length).map(x=>x.id)),...n.audit]};
}
export function createSalesInvoice(c:CompanyData,customerId:string,productId:string,qty:number,dueDate:string):CompanyData {
  if(!c.customers.some(x=>x.id===customerId)) throw new Error('Choose a valid customer.');const p=c.products.find(x=>x.id===productId);if(!p||!Number.isInteger(qty)||qty<=0) throw new Error('Choose a valid item and whole-number quantity.');if(p.qty<qty) throw new Error(`Insufficient stock: ${p.qty} units available.`);
  const amount=p.unitPrice*qty,cogs=p.unitCost*qty,id=makeId('SI');
  let n=postJournal(c,`Customer invoice ${id}`,[{accountId:ACCOUNT.AR,debit:amount,credit:0},{accountId:ACCOUNT.SALES,debit:0,credit:amount},{accountId:ACCOUNT.COGS,debit:cogs,credit:0},{accountId:ACCOUNT.INVENTORY,debit:0,credit:cogs}],`sales:${id}`);
  const invoice={id,customerId,productId,qty,amount,cogs,paidAmount:0,status:'Posted' as DocStatus,date:today(),dueDate};
  n={...n,salesInvoices:[invoice,...n.salesInvoices],products:n.products.map(x=>x.id===p.id?{...x,qty:x.qty-qty}:x),stockMovements:[{id:makeId('SM'),productId:p.id,qty:-qty,kind:'Sale',reference:id,date:today()},...n.stockMovements]};
  return {...n,audit:[audit('Customer invoice posted',id,'Sales Invoice','Approved','Posted',n.journals.slice(0,n.journals.length-c.journals.length).map(x=>x.id),'Revenue, receivable, cost of goods sold and stock updated.'),...n.audit]};
}
export function receiveCustomerPayment(c:CompanyData,id:string,amount:number):CompanyData {
  const inv=c.salesInvoices.find(x=>x.id===id);if(!inv||!['Posted','Partially Paid'].includes(inv.status)) throw new Error('Only an open customer invoice can receive a payment.');
  if(!Number.isInteger(amount)||amount<=0||amount>inv.amount-inv.paidAmount) throw new Error('Payment must be positive and no greater than the outstanding balance.');
  let n=postJournal(c,`Customer payment against ${id}`,[{accountId:ACCOUNT.CASH,debit:amount,credit:0},{accountId:ACCOUNT.AR,debit:0,credit:amount}],`customer-payment:${id}:${inv.paidAmount+amount}`);
  const paid=inv.paidAmount+amount,status:DocStatus=paid===inv.amount?'Paid':'Partially Paid';n={...n,salesInvoices:n.salesInvoices.map(x=>x.id===id?{...x,paidAmount:paid,status}:x)};
  return {...n,audit:[audit('Customer payment recorded',id,'Payment',inv.status,status,n.journals.slice(0,n.journals.length-c.journals.length).map(x=>x.id)),...n.audit]};
}
export function recordExpense(c:CompanyData,category:string,amount:number,description:string):CompanyData {
  if(!Number.isInteger(amount)||amount<=0||!description.trim()) throw new Error('Enter a description and a positive amount.');const id=makeId('EX');
  let n=postJournal(c,description,[{accountId:ACCOUNT.EXPENSE,debit:amount,credit:0},{accountId:ACCOUNT.CASH,debit:0,credit:amount}],`expense:${id}`);
  const record={id,date:today(),category,amount,description,status:'Posted' as DocStatus,journalId:n.journals.at(-1)!.id};n={...n,expenses:[record,...n.expenses]};return {...n,audit:[audit('Expense posted',id,'Expense','Approved','Posted',[record.journalId]),...n.audit]};
}
export function runPayroll(c:CompanyData,month:string):CompanyData {
  if(c.payrollRuns.some(x=>x.month===month&&x.status==='Posted')) throw new Error('Payroll has already been posted for that month.');const active=c.employees.filter(x=>x.active),gross=active.reduce((s,e)=>s+e.salary,0),id=makeId('PAY');
  let n=postJournal(c,`Payroll simulation ${month}`,[{accountId:ACCOUNT.PAYROLL,debit:gross,credit:0},{accountId:ACCOUNT.CASH,debit:0,credit:gross}],`payroll:${month}`);
  const run={id,month,gross,status:'Posted' as DocStatus,employeeCount:active.length,journalId:n.journals.at(-1)!.id};n={...n,payrollRuns:[run,...n.payrollRuns]};return {...n,audit:[audit('Payroll simulated and posted',id,'Payroll','Approved','Posted',[run.journalId],`${active.length} fictional employees.`),...n.audit]};
}
export function reportBalances(c:CompanyData):Record<string,number> {
  const out:Record<string,number>={};for(const a of c.accounts) out[a.id]=0;
  for(const journal of c.journals) if(journal.status==='Posted') for(const line of journal.lines) out[line.accountId]=(out[line.accountId]??0)+line.debit-line.credit;
  return out;
}
export function accountBalance(c:CompanyData,id:string):number { return reportBalances(c)[id]??0; }
export function reports(c:CompanyData) {
  const balances=reportBalances(c),byType=(type:AccountType)=>c.accounts.filter(a=>a.type===type).reduce((s,a)=>s+(balances[a.id]??0),0);
  const assets=byType('Asset'),liabilities=-byType('Liability'),equity=-byType('Equity'),revenue=-byType('Revenue'),expenses=byType('Expense');
  return {balances,assets,liabilities,equity,revenue,expenses,netIncome:revenue-expenses,balanceCheck:assets-(liabilities+equity+revenue-expenses),ap:c.supplierInvoices.reduce((s,x)=>s+x.amount-x.paidAmount,0),ar:c.salesInvoices.reduce((s,x)=>s+x.amount-x.paidAmount,0),inventory:c.products.reduce((s,p)=>s+p.qty*p.unitCost,0)};
}
