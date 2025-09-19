# Merge Host Dashboard with Original Organizer Dashboard

## Overview
Merge the separate organizer dashboard at `/host/dashboard` into the main organizer dashboard at `/dashboard`, and update the landing page "Host Events" button to use the merged dashboard for the Dapp.

## Key Differences Identified
- **Host Dashboard** (`/host/dashboard`): Uses `useAuth` hook for organization-based authentication, filters events by `organization.address`, displays organization details in read-only format.
- **Original Dashboard** (`/dashboard`): Uses `useAccount` from wagmi for wallet-based access, filters events by `organizer.toLowerCase() === address?.toLowerCase()`, has editable organization profile section.

## Plan
1. **Enhance Original Dashboard** (`frontend/src/app/dashboard/page.tsx`):
   - Import and use `useAuth` hook alongside `useAccount`.
   - Add logic to filter events by organization address if organization is authenticated, otherwise fallback to wallet address.
   - Integrate organization details display from host dashboard into the existing organization profile section.
   - Ensure "Create New Event" button links to `/host` (already does).

2. **Update Landing Page** (`frontend/src/app/page.tsx`):
   - Change "Host Events" button link from `/host/signin` to `/dashboard` to use the merged dashboard.

3. **Handle Host Dashboard** (`frontend/src/app/host/dashboard/page.tsx`):
   - Either redirect to `/dashboard` or remove the file since functionality will be merged.

4. **Test Navigation**:
   - Verify that clicking "Host Events" on landing page takes to the merged dashboard.
   - Ensure organization-based filtering works if authenticated.
   - Ensure wallet-based fallback works.

## Dependent Files
- `frontend/src/app/dashboard/page.tsx` (main target for merge)
- `frontend/src/app/page.tsx` (update button link)
- `frontend/src/app/host/dashboard/page.tsx` (source or to be removed/redirected)
- `frontend/src/hooks/useAuth.tsx` (ensure it's available)

## Followup Steps
- Test the merged dashboard functionality.
- Check if any features from host dashboard are missing in original.
- Update any other references to `/host/dashboard` if needed.
- Verify authentication flow works correctly.

# Complete Create Event Form Implementation

## Overview
The create event form in `frontend/src/app/host/page.tsx` collects comprehensive event data but has incomplete submission logic. The form needs to properly persist all collected data instead of only creating the blockchain event.

## Current Issues
- Form collects rich data (banner, description, tags, venue, dates, ticket tiers, etc.) but submission only creates blockchain event
- IPFS upload and database save are commented out or missing
- Ticket tiers are not properly handled for blockchain creation
- No status management (draft vs published)
- Missing validation for dates and required fields

## Plan
1. **Complete Submission Logic** (`frontend/src/app/host/page.tsx`):
   - Uncomment and fix IPFS banner upload
   - Add database save via `/api/events` with all form data
   - Associate event with existing organization from `useAuth`
   - Handle blockchain event address from transaction

2. **Fix Ticket Tier Integration**:
   - Aggregate total ticket quantity for `maxTickets` parameter
   - Use first tier's price for blockchain, save all tiers to database
   - Ensure currency conversion if needed

3. **Add Status Management**:
   - Add radio buttons for 'draft' or 'published' status
   - Default to 'published' for immediate visibility

4. **Enhanced Validation**:
   - Ensure start/end dates are in the future
   - Require at least one ticket tier for paid events
   - Validate location coordinates are set
   - Check banner image is uploaded

5. **Error Handling & Rollback**:
   - If IPFS upload fails, abort submission
   - If database save fails, consider deactivating blockchain event
   - Show specific error messages for each failure point

6. **Add Preview Functionality**:
   - Add "Preview Event" button before submission
   - Show read-only preview of event details

7. **Optional Event-Level Organization Fields**:
   - Allow custom organization name for this event (optional)
   - Allow event-specific organization description (optional)

## Dependent Files
- `frontend/src/app/host/page.tsx` (main file to modify)
- `frontend/src/lib/ipfs.ts` (IPFS upload function)
- `frontend/src/Services/Web3Service.ts` (ensure createEvent returns address)
- `frontend/src/hooks/useAuth.tsx` (for organization data)
- `/api/events` endpoint (ensure it accepts all fields)

## Followup Steps
- Test complete event creation flow
- Verify events appear in dashboard with all details
- Test error scenarios (IPFS failure, network issues)
- Check ticket tier functionality
- Validate date and location requirements
