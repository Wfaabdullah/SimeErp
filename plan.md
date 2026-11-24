# Sime ERP Student Simulator — Implementation Plan

## Product and scope

Build a browser-only ERP training environment for students, using the supplied ERPNext/Frappe source as the domain and design reference. The delivered product is a simplified operational simulator, not a deployment of the full ERPNext server application. It opens without login, works without a backend/API key, and saves its demo-company data in the user's browser. The product must clearly label itself as an educational simulation and must not imply official ERPNext/Frappe affiliation.

The uploaded archive is ERPNext `17.x.x-develop`, a 7,424-file source tree (about 201 MB extracted). Its README instructs operators to install the Frappe framework, run a Bench server and create a site; it is not a static site. Its `banking/` React/Vite sub-app uses `frappe-react-sdk` and is built into ERPNext's server asset paths. Therefore, that application and the Frappe-dependent forms cannot work on GitHub Pages. The static simulator will preserve the source's useful ERP domain concepts (accounts, journal entries, purchase/sales invoices, suppliers/customers, items, stock movements), reference relevant DocType field definitions and workflow meanings, and use a clean browser-only data model. Do not copy the 201 MB server app into the simulator or claim server-dependent ERPNext code works standalone.

## Architecture and implementation

- **Frontend:** React + TypeScript + Vite, installed and pinned with a lockfile. Use a static single-page app, with no server, database, login, paid service, remote API, or user-file upload to an external service.
- **GitHub Pages routing:** Configure Vite with the `/SimeErp/` repository base path and use hash-based navigation so module deep links and browser refresh work on static hosting.
- **Application structure:** `src/app` for shell/navigation and dashboard; `src/modules` for finance, procurement, sales, inventory, HR, reports, training, and imports; `src/domain` for typed entities, validators, posting/workflow functions and calculations; `src/data` for demo seed/reset and persistence; `src/lib` for import/export, dates and formatting; `public` for static metadata and route declaration; tests next to domain functions.
- **One shared client-side data model:** Persist company settings, chart of accounts, journal entries/ledger, AP/AR documents and payments, suppliers/customers, purchase requests/orders/receipts/invoices, products/stock movements, employees/attendance/payroll simulation, activity history, and training progress. Use local storage for automatic saving and an exportable/importable versioned JSON backup. Keep posting functions atomic and idempotent using source-document references to prevent duplicate ledger entries.
- **Accounting correctness:** Represent money as integer minor units; validate nonnegative amounts, valid accounts and equal total debits/credits before posting. Only posted entries affect the ledger or reports. Derive account balances, trial balance, income statement, balance sheet and cash-flow summaries from posted entries and operational documents; assert the accounting equation and debit/credit totals in tests.
- **Interconnected workflows:** Purchase order → goods receipt → stock movements/valuation → supplier invoice → AP and journal posting. Customer invoice → revenue/AR journal posting → payment → cash and receivable balance. Journal entry → validated posting → general ledger → trial balance and financial statements. Document status changes and posting links prevent double-counting.
- **File processing:** Use browser-side parsers for CSV, JSON, XLSX (and XLS only if the selected browser parser reliably supports it) and text-based PDFs. Provide actual preview, detected columns/types, editable rows, field mapping, duplicate/missing-value validation, errors, selective import into supported entities, and export. PDF pages should be viewable and extractable text reviewed manually; explicitly state that scanned/image-only PDFs need OCR and are not accurately recognized here. Never upload student files to an external service.
- **Reports and training:** Generate filtered reports from the same application records and ledger, with CSV export and print-friendly views. Training scenarios should call the same workflow functions and data as ordinary module screens, explain actions and validation outcomes, and persist progress.
- **Pages deployment:** Use a repository-compatible static build and GitHub Actions Pages workflow. Verify the production build with the actual `/SimeErp/` base, inspect generated assets, and test refresh and module navigation from the built output. No development-server-only feature is allowed in production.

## Data and workflow scope

1. **Dashboard:** Live revenue, expenses, net income, AP, AR, inventory summary, purchase order counts, recent activity, and financial charts, computed from shared records.
2. **Finance and accounting:** Chart of accounts, general ledger, journal entry create/validate/post, AP, AR, expenses, revenue, trial balance, income statement, balance sheet and cash-flow report.
3. **Procurement and sales:** Supplier/customer records and histories; purchase requests/orders, receipt and invoice states; customer invoices, payment capture and receivable status.
4. **Inventory:** Product catalog/categories, quantities, receipts, movements, adjustments, low-stock warnings, and valuation based on documented simulator rules.
5. **HR:** Fictional employee/department records, attendance and a clearly labeled payroll simulation. Payroll postings must be balanced and visible in the ledger.
6. **Reports/analytics:** Date-filtered operational and financial summaries, interactive charts, and export options using real local data.
7. **Training mode:** Interactive exercises for journals, expenses, supplier invoices, purchase/receipt, customer invoices/payments, financial statements and reports. Each has instructions, required actions, validation, explanations, feedback and completion state.
8. **Data handling:** Import/preview/map/validate/edit/import/export files; create/edit/delete application records where safe; local autosave; reset demo data; backup export/import; search, filters, clear errors and empty states.

Any item not completed in the final implementation must be marked unavailable; do not present placeholders as functioning modules. State that browser-local data may not transfer across devices. Reset demo data must require a deliberate in-app confirmation because it deletes local changes.

## Source and licensing

Retain the supplied ERPNext license/attribution notices for any source-derived material. The upstream tree identifies ERPNext as GPL-3.0; review its `license.txt` and preserve applicable notices in the delivered source. Avoid reusing Frappe/ERPNext marks or logos in a way that implies endorsement. Record that the simulator is an independent educational adaptation and explain that it does not include the Frappe backend/database.

## Visual design

Use the user's FLOW ERP HTML as the primary visual reference: dark navy sidebar (#131523), indigo/lavender accent (#5B5CE6/#A5A6F6), light cool-gray canvas (#F4F5F9), rounded white panels, compact financial cards and Inter/Plus Jakarta Sans-like typography. Preserve its responsive sidebar/header/dashboard composition, but make every figure data-derived and remove fictional cloud-sync, automated reconciliation, e-invoicing or user-profile claims. Core principles are operational clarity, visible document status, accounting traceability, and responsive legibility. Avoid brand marks or external CDN/runtime dependencies; use a compact Sime ledger glyph and wordmark. Interaction should favor explicit save/post/receive/payment actions, inline validation and correction workflows; use restrained transitions only for navigation and confirmations. Use tabular numerals for amounts. Brand positioning: a practical ERP lab for students, approachable, rigorous, and hands-on. Voice: “Practice the process. See the ledger move.” and “Every posting has a trail.”

## Delivery constraints

- Target repository: `https://github.com/Wfaabdullah/SimeErp.git`, currently empty.
- GitHub CLI reports no enabled GitHub connector; authenticated push/deployment cannot be assumed until the connector is enabled. Do not put credentials in project files or ask for tokens in chat.
- Prepare the source, README, license/attribution, Pages workflow and tested project ZIP from the same final commit. Push the tested version to the target repository only through the authorized GitHub connection. If connector access remains unavailable, deliver tested local artifacts and clearly report that push/Pages configuration could not be completed.
- GitHub Pages can serve the simulator but cannot provide multi-user synchronization, shared records, authentication, reliable OCR for scanned documents, or server-side database persistence. Explain these limitations in the app and README.
