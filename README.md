# Sime ERP Student Simulator

A browser-only ERP learning environment for university students. It opens without an account and uses fictional company data saved in this browser. It is an independent educational simulator and is not affiliated with or endorsed by Frappe Technologies or ERPNext.

## What is in the app

The simulator includes a demo company, company switching and local backup/reset; a dashboard; a chart of accounts, journals, ledger and trial balance; purchase orders, goods receipt, supplier invoices and payments; customer invoices and receipts; inventory movements and adjustments; fictional HR/attendance and payroll simulation; reports; training scenarios; an audit trail; and client-side CSV/JSON/XLSX/PDF review and data import. Training exercises use the same company records and posting logic as the modules.

Financial document posting is educational only. Posted records are locked against silent edits/cancellation; corrections use explicit reversal logic for journals. The underlying records are stored in browser local storage. They do not sync between devices or browsers and may be erased by clearing site data. Export a JSON backup to preserve local training companies.

## Source adaptation and constraints

The supplied archive is the ERPNext 17 development source, whose application is built on the Frappe framework and requires a server and database. The ERPNext banking React app also calls the Frappe API. These server-dependent components cannot run on GitHub Pages. This project therefore adapts the source's ERP concepts, DocType semantics and business workflows into a small static browser application; it does not ship the ERPNext backend or claim full ERPNext compatibility. Text-based PDF extraction is best-effort. Image-only/scanned PDFs are not OCR-processed. Payroll is a simplified fictional exercise, not payroll advice or payment.

The original ERPNext source is GPL-3.0. This training adaptation uses the upstream ERP domain/workflow concepts; the upstream license text is retained in `LICENSE-ERPNext.txt` for provenance. Any later incorporation of ERPNext source code must preserve all applicable GPL-3.0 obligations. See `UPSTREAM.md`.

## Run locally

Requirements: Node.js 20+ and pnpm 11.25.0.

```sh
pnpm install
pnpm dev
```

## Verify and build

```sh
pnpm test
pnpm build
```

The production build is configured for the repository path `/SimeErp/`. GitHub Pages deployment is configured via `.github/workflows/pages.yml`.

## Data handling

All record and uploaded-file parsing is performed locally in the browser. No API keys, mandatory backend, paid API, external upload, account or subscription is used. Browser-local educational audit events are not a legally compliant, tamper-proof audit log.
