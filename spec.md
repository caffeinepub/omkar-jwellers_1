# OMKAR JWELLERS

## Current State

- Full-stack jewellery shop ERP+POS with Motoko backend and React/TypeScript frontend
- RepairPage.tsx: Shows active repair orders filtered by `status !== 'delivered'`. Has `ImagePreview` component that wraps image in an `<a>` tag opening in new tab.
- CustomOrdersPage.tsx: Shows active custom orders filtered by `status !== 'delivered'`. Has `ImagePreview` component that wraps image in an `<a>` tag opening in new tab.
- CompletedOrdersPage.tsx: Shows completed orders by filtering `status === 'delivered'` for repair/custom and `status === 'completed'` for karagir. Has basic inline `ImagePreview` component (no modal, no lightbox).
- SettingsPage.tsx: Has gold/silver rates section (removed in this update - NOT in settings, rates are in BillingPage). Actually the Settings page does NOT have gold rate fields - they're in BillingPage.
- BillingPage.tsx: Has gold/silver rate fields (24K, 22K, 18K, Silver) that users update manually. These fields are standalone rate management UI within billing.
- The CompletedOrdersPage has a bug: Karagir jobs use `Variant_pending_completed_inProgress.completed` enum comparison which may not work correctly.

## Requested Changes (Diff)

### Add
- **Image lightbox/modal preview**: In RepairPage, CustomOrdersPage, and CompletedOrdersPage, replace the existing `<a href>` / plain `<img>` image display with a tap/click-to-preview lightbox modal. Clicking/tapping a thumbnail opens a full-screen modal overlay showing the full-size image with a close button.

### Modify
- **Completed orders bug fix**: Fix the filtering logic so that when a repair or custom order is marked "Delivered", it:
  1. Disappears from RepairPage and CustomOrdersPage active lists (this already works via the `filter !== 'delivered'` check)
  2. Appears in CompletedOrdersPage (fix any broken filtering)
  The core issue is likely that the query cache isn't invalidating properly when status updates happen, so both RepairPage and CompletedOrdersPage need to invalidate `repairOrders`/`customOrders` queries on update success. Check `useUpdateRepairOrder` and `useUpdateCustomOrder` mutations in useQueries.ts - ensure they invalidate the correct query keys.
- **Remove gold/silver rates section from BillingPage**: Remove the standalone "Update Gold/Silver Rates" panel/section from BillingPage. Users will enter the rate directly per item when billing. The rate fields per item in the billing form should remain - just remove any separate "current rates" management UI in the billing page. Keep the per-item rate input field in the billing item form.

### Remove
- Gold/silver rates update section/panel from BillingPage (the section that shows current 24K/22K/18K/Silver rates with an Update button)

## Implementation Plan

1. **Fix useQueries.ts**: Verify `useUpdateRepairOrder` and `useUpdateCustomOrder` invalidate `['repairOrders']` and `['customOrders']` query keys on success. If missing, add them.
2. **Fix CompletedOrdersPage.tsx**: Fix karagir completed filtering. Ensure repair and custom order "delivered" filtering is correct.
3. **Add ImageLightbox component**: Create a simple modal overlay component (or inline it) that shows a full-size image when triggered. Use the existing Dialog component from shadcn/ui.
4. **Update RepairPage.tsx ImagePreview**: Replace the `<a>` wrapper with a clickable image that opens the lightbox modal.
5. **Update CustomOrdersPage.tsx ImagePreview**: Same as above.
6. **Update CompletedOrdersPage.tsx ImagePreview**: Replace plain `<img>` with clickable thumbnail that opens lightbox modal.
7. **Update BillingPage.tsx**: Find and remove the gold/silver rates management section (the panel where you can update 24K/22K/18K/Silver rates with an Update button). Keep per-item rate input fields intact.
8. Validate and build.
