# OMKAR JWELLERS

## Current State
Settings page has two sections: Shop Information form and Create User form. There is no way to view existing users, edit their info, or delete them. The backend has `createUserWithCreds` but no functions to list, update, or delete users.

## Requested Changes (Diff)

### Add
- Backend: `getUsersWithCreds(phone, password)` - returns all users (passwords hidden)
- Backend: `updateUserWithCreds(callerPhone, callerPassword, userDTO)` - owner updates any user's name/phone/password/role
- Backend: `deleteUserWithCreds(callerPhone, callerPassword, targetPhone)` - owner deletes a user (cannot delete owner)
- Frontend: Settings page tabs: "दुकानाची माहिती" (Shop Info), "नवीन वापरकर्ता" (Create User), "वापरकर्ता यादी" (User List)
- Frontend: User List tab showing count, table with Name / Phone (ID) / Role columns, Edit and Delete buttons per row
- Frontend: Edit User dialog (modal) with fields for Name, Phone, Password, Role - pre-filled with current values
- Frontend: Delete confirmation dialog before deleting a user
- Hooks: `useUsers`, `useUpdateUser`, `useDeleteUser` in useQueries.ts

### Modify
- SettingsPage.tsx: Convert flat page into tabbed layout (3 tabs)
- translations.ts: Add keys for user list, edit user, delete user, confirmations
- backend.d.ts: Add new function signatures

### Remove
- Nothing

## Implementation Plan
1. Add `getUsersWithCreds`, `updateUserWithCreds`, `deleteUserWithCreds` to main.mo
2. Add those function signatures to backend.d.ts
3. Add `useUsers`, `useUpdateUser`, `useDeleteUser` hooks to useQueries.ts
4. Add translation keys (mr + en) for user list UI strings
5. Rebuild SettingsPage.tsx with 3-tab layout, user list table, edit modal, delete confirm dialog
