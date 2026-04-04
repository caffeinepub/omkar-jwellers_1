# OMKAR JWELLERS — WhatsApp Order Ready Notification

## Current State
- RepairPage and CustomOrdersPage have status update dialogs (Pending → In Progress → Ready → Delivered)
- `handleUpdate()` calls `updateOrder.mutateAsync()` and shows a success toast
- Orders display customer phone number as plain text
- SettingsPage has 3 tabs: Shop, Add User, User List — no notification settings
- No WhatsApp integration exists anywhere in the app

## Requested Changes (Diff)

### Add
- WhatsApp deep link trigger in `handleUpdate()` in both RepairPage and CustomOrdersPage: when new status = "ready" AND previous status != "ready" (no duplicate), open `https://wa.me/91{phone}?text={encodedMessage}` in a new tab
- Bilingual message format: Marathi block first, English block below, with customer name interpolated
- Warning toast if phone number is missing when status changes to "ready"
- "Send Again" WhatsApp button on every order card when order status is already "ready" — visible to all users regardless of notification toggle
- Notification status indicator on order card ("WhatsApp Sent" green badge) stored in localStorage keyed by order ID, set when WhatsApp link is triggered
- WhatsApp Notifications toggle in Settings (4th tab "Notifications") stored in localStorage key `omkar_whatsapp_notifications` (default: true)
- When toggle is disabled, auto-trigger on status change is suppressed; "Send Again" button remains visible
- WhatsApp icon (green) next to phone number on order cards

### Modify
- RepairPage: `handleUpdate()` — add WhatsApp trigger logic after successful update
- RepairPage: order card — add WhatsApp icon next to phone, "Send Again" button when status=ready, notification badge
- CustomOrdersPage: same changes as RepairPage
- SettingsPage: add 4th "Notifications" tab with WhatsApp toggle switch
- SettingsPage: change `grid-cols-3` to `grid-cols-4` on TabsList

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/lib/whatsapp.ts` — helper: `buildWhatsAppUrl(phone, customerName)` and `triggerWhatsApp(phone, customerName, notificationsEnabled)` returning boolean (triggered or not)
2. Modify `RepairPage.tsx` — handleUpdate triggers WhatsApp when status flips to ready; order card shows WA icon, Send Again button, sent badge
3. Modify `CustomOrdersPage.tsx` — same changes
4. Modify `SettingsPage.tsx` — add Notifications tab (4th) with toggle, grid-cols-4
