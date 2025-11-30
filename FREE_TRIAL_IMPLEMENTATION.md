# Implementation Plan: 7-Day Free Trial

## Current State Summary

### Database (Turso/SQLite)
- Table `subscriptions` with: `user_id`, `status`, `expires_at`, `product_id`
- Status values: `active`, `expired`, `cancelled`, `billing_issue`

### Backend (Next.js)
- JWT authentication (30 days)
- RevenueCat webhook integration for subscription sync
- `/api/auth/me` returns subscription status
- `/api/search` requires active subscription (402 if not subscribed)

### Frontend (React Native/Expo)
- RevenueCat SDK integration
- `RevenueCatContext.tsx` manages subscription state
- Dual check: RevenueCat + backend subscription status

---

## Implementation Tasks

### Phase 1: Database Changes

- [x] **1.1 Add trial tracking fields to users table**
  - Add `trial_started_at` (TIMESTAMP, nullable)
  - Add `trial_ends_at` (TIMESTAMP, nullable)
  - Add `trial_used` (BOOLEAN, default false)
  - File: `backend/migrations/002_add_free_trial.sql`

- [x] **1.2 Run migration**
  - Apply migration to Turso database

---

### Phase 2: Backend Changes

- [x] **2.1 Update database service (`backend/lib/db.ts`)**
  - Add `startFreeTrial(userId: string)` method
  - Add `hasUsedFreeTrial(userId: string)` method
  - Add `isInFreeTrial(userId: string)` method
  - Add `getTrialInfo(userId: string)` method
  - Add `hasAccess(userId: string)` method

- [x] **2.2 Update subscription check logic**
  - Created `hasAccess(userId)` that checks subscription OR trial
  - Updated `/api/search` to use `hasAccess()` instead of `hasActiveSubscriptionByUserId()`

- [x] **2.3 Create trial endpoints (`backend/app/api/trial/route.ts`)**
  - `POST /api/trial` - Start free trial for authenticated user
  - `GET /api/trial` - Get trial status (days remaining, used, etc.)

- [x] **2.4 Update `/api/auth/me` response**
  - Add trial info to response: `trial: { isActive, daysRemaining, startsAt, endsAt, used }`

- [ ] **2.5 Handle RevenueCat trial events (optional)**
  - RevenueCat sends `INITIAL_PURCHASE` with trial info
  - Update webhook to detect trial purchases vs regular purchases

---

### Phase 3: Frontend Changes

- [x] **3.1 Update types and interfaces**
  - Added `TrialInfo` type to `frontend/types/api.ts`
  - Updated `getCurrentUser` response type to include trial info

- [x] **3.2 Update RevenueCatContext (`frontend/contexts/RevenueCatContext.tsx`)**
  - Added `trialInfo` and `isInTrial` state
  - Added `startFreeTrial()` method
  - Modified `hasUnlimitedAccess` to include trial users
  - Modified `isFreeUser` to exclude trial users

- [x] **3.3 Update backend API service (`frontend/services/backend-api.service.ts`)**
  - Added `startFreeTrial()` API call
  - Added `getTrialStatus()` API call
  - Updated `getCurrentUser()` return type

- [x] **3.4 Update SubscriptionModal (`frontend/components/SubscriptionModal.tsx`)**
  - Added "Start 7-Day Free Trial" button (only if trial not used)
  - Handle trial start flow with success/error alerts

- [x] **3.5 Update Profile screen (`frontend/app/profile.tsx`)**
  - Show "Free Trial Active" when user is in trial
  - Show "X days remaining" badge with countdown
  - Show message to subscribe before trial ends

- [ ] **3.6 Create onboarding trial prompt (optional)**
  - Show trial offer to new users after sign-in
  - File: `frontend/components/TrialOfferModal.tsx`

---

### Phase 4: RevenueCat Configuration (App Store/Google Play)

- [ ] **4.1 Configure free trial in App Store Connect**
  - Set up 7-day free trial for subscription products
  - RevenueCat will automatically handle trial periods

- [ ] **4.2 Configure free trial in Google Play Console**
  - Set up 7-day free trial for subscription products

- [ ] **4.3 Update RevenueCat dashboard**
  - Verify trial configuration is synced
  - Test trial flow in sandbox

---

### Phase 5: Testing

- [ ] **5.1 Test backend trial flow**
  - Test trial start endpoint
  - Test trial status endpoint
  - Test subscription check with trial

- [ ] **5.2 Test frontend trial flow**
  - Test trial UI display
  - Test trial start button
  - Test access during trial

- [ ] **5.3 Test RevenueCat trial integration**
  - Test sandbox purchase with trial
  - Test webhook events for trial

- [ ] **5.4 Test edge cases**
  - User tries to start trial twice
  - Trial expires, user tries to access
  - User subscribes during trial
  - User with expired trial signs up again

---

## Technical Details

### Database Migration SQL

```sql
-- migrations/002_add_free_trial.sql
ALTER TABLE users ADD COLUMN trial_started_at TEXT;
ALTER TABLE users ADD COLUMN trial_ends_at TEXT;
ALTER TABLE users ADD COLUMN trial_used INTEGER DEFAULT 0;

CREATE INDEX idx_users_trial ON users(trial_ends_at) WHERE trial_used = 1;
```

### API Response Format

```typescript
// GET /api/auth/me response
{
  user: User;
  subscription: {
    isActive: boolean;
  };
  trial: {
    isActive: boolean;      // Currently in trial period
    daysRemaining: number;  // Days left (0 if not in trial)
    endsAt: string | null;  // ISO date when trial ends
    used: boolean;          // Has user ever used trial
  };
}

// POST /api/trial/start response
{
  success: boolean;
  trial: {
    startsAt: string;
    endsAt: string;
    daysRemaining: number;
  };
}
```

### Access Logic

```typescript
// User has access if ANY of these are true:
const hasAccess =
  hasActiveSubscription ||      // Paid subscription
  isInFreeTrial ||              // Active free trial
  hasBackendSubscription;       // Manual/admin subscription
```

---

## Notes

- **RevenueCat Integration**: RevenueCat handles trial periods automatically when configured in App Store Connect / Google Play Console. The webhook will send events with trial info.

- **Backend Trial**: We implement our own trial system in addition to RevenueCat because:
  1. Allows trial for users who haven't set up payment method
  2. More control over trial logic
  3. Works across platforms consistently
  4. Can offer trial promotions independently

- **Trial Uniqueness**: Trial is tied to `user_id`, so users can only get one trial per account (not per device).

- **Migration Path**: Existing users without trial fields will have `trial_used = false`, allowing them to start a trial.
