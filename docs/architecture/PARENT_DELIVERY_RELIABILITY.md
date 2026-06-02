# Parent Delivery Reliability Architecture

**Sprint:** Mega Sprint 1101-1110
**Date:** 2026-06-02
**Status:** V1 — portal_published only

## Problem

`applyParentCommunicationAction` previously used the string literal `'portal_published'` directly with no service layer. There was no way to:
- Define the delivery method contract
- Validate that a method is supported before attempting a write
- Return a typed delivery result
- Provide a clear extension point for email/SMS/push

## Solution

`src/lib/delivery/parentDeliveryService.ts` — pure TypeScript, no DB calls.

### Types

| Type | Purpose |
|---|---|
| `ParentDeliveryMethod` | Union: `portal_published \| email \| sms \| push` |
| `ParentDeliveryStatus` | Lifecycle: `pending \| delivered \| failed \| portal_live \| cancelled` |
| `ParentDeliveryResult` | Typed result returned by any delivery execution |
| `ParentDeliveryMethodMeta` | Display metadata per method |

### V1 method: portal_published

- `v1Supported: true` — the only live method
- `requiresProvider: false` — no external provider needed
- Writes to `parent_updates` + `player_development_summary.show_to_parent = true`

All other methods (`email`, `sms`, `push`) have `v1Supported: false`. `getDeliveryMethodUnsupportedReason()` returns an error string if any non-V1 method is passed — preventing accidental use.

### Integration with applyParentCommunicationAction

1. Pre-flight: `getDefaultV1DeliveryMethod()` + `getDeliveryMethodUnsupportedReason()` before any DB work
2. `deliveryMethod` used as `send_method` in `parent_updates` insert
3. `buildPortalPublishedResult()` after successful write → typed `ParentDeliveryResult`
4. `buildFailedDeliveryResult()` on insert failure
5. `delivery_status` and `development_summary_updated` included in audit log
6. `delivery: ParentDeliveryResult` returned to caller

## What is not built in V1

- Email provider (Resend, SendGrid, Postmark)
- SMS provider (Twilio)
- Push notification
- Delivery retry logic
- Parent opt-out at delivery layer

## Future extension

To add email in a future sprint:
1. Set `email.v1Supported = true` in `PARENT_DELIVERY_METHOD_META`
2. Add `executeEmailDelivery(params)` to this service
3. Call it from `applyParentCommunicationAction` when `deliveryMethod === 'email'`

No structural changes to the service layer are required.
