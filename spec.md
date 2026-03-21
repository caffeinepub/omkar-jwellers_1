# OMKAR JWELLERS – Full System Build

## Current State
Backend is an empty Motoko actor. No App.tsx exists. This is effectively a fresh build.

## Requested Changes (Diff)

### Add
- Auth system with role-based access (Owner, Manager, Staff, Karagir) using phone+password login with pre-seeded demo accounts
- Billing/POS system: add items to invoice, edit/delete items inline, auto-calculate Total = Weight × Rate in real-time
- Invoice generation: auto-incremented invoice number, date+time, GST toggle (CGST+SGST), amount in words (English+Marathi), signature area, notes field, lock after generation
- Udhar (credit) system: track partial payments per customer, Receive Payment feature, auto-reduce udhar balance, mark invoice PAID when cleared
- Customer management: add/view customers, purchase history, udhar history
- Shareable public invoice page: accessible without login, mobile-friendly, used in WhatsApp message
- WhatsApp share: opens WhatsApp/WhatsApp Web with message containing customer name, amount, invoice link
- Gold rate: manual entry with daily update by Owner/Manager
- Reports: sales summary, udhar pending, paid vs unpaid
- Karagir section: view/update assigned job orders
- Settings: shop details, GST number, default language
- Multi-language: Marathi (default) + English, toggle anywhere including invoices
- Mobile-friendly responsive UI, gold+dark luxury theme

### Modify
- backend/main.mo: implement full data model and APIs

### Remove
- Nothing (fresh build)

## Implementation Plan
1. Motoko backend: auth, customers, invoices, udhar/payments, gold rate, job orders, settings
2. Frontend App.tsx with routing, auth context, language context
3. Pages: Login, Dashboard, Billing, Customers, Udhar Ledger, Reports, Karagir, Settings
4. Public invoice page (no auth required)
5. Invoice component: professional print layout, amount in words, GST breakdown
6. WhatsApp share button with formatted message + public link
