# Menu Reorganization Plan - Phase 2

## Requested Changes

Based on user feedback, the following additional menu reorganization changes are needed:

### 1. Move Executive Dashboard to Backup
**Current Location:** Analytics & Outcomes
**New Location:** Backup
**Item:** Executive Dashboard (line 56)
- Key: `nav-exec-dashboard`
- Label: "Executive Dashboard"
- Icon: ChartBarIcon
- Href: `/executive-outcomes-dashboard`

### 2. Move Referral Tracking to Whole Person Care
**Current Location:** Network
**New Location:** Whole Person Care
**Item:** Referral Tracking (line 58)
- Key: `nav-referrals`
- Label: "Referral Tracking"
- Icon: ArrowsRightLeftIcon
- Href: `/referral-tracking`

### 3. Move Episodic Management Analytics to Whole Person Care
**Current Location:** Episodes & Quality
**New Location:** Whole Person Care
**Item:** Episodic Management Analytics (line 53)
- Key: `nav-episodic-management`
- Label: "Episodic Management Analytics"
- Icon: ChartBarIcon
- Href: `/episodic-management-analytics`

## Impact Analysis

### Groups Affected:
1. **Analytics & Outcomes** - Will become empty after moving Executive Dashboard
   - Action: Remove from `groupOrder` array
   
2. **Network** - Will become empty after moving Referral Tracking
   - Action: Remove from `groupOrder` array
   
3. **Episodes & Quality** - Will only have "Care Gap Closure" remaining
   - Action: Keep the group (still has 1 item)
   
4. **Whole Person Care** - Will gain 2 new items
   - Current items: 6
   - New items: 8 (adding Referral Tracking and Episodic Management Analytics)
   
5. **Backup** - Will gain 1 new item
   - Will add Executive Dashboard

## New Group Order
After changes, the `groupOrder` array will be:
```
['RHTP Program', 'Care Team Workflows', 'Whole Person Care', 'Episodes & Quality', 'UHG-Orchestrate-Screens', 'System', 'Backup']
```

Removed groups:
- Analytics & Outcomes (empty)
- Network (empty)

## Implementation Steps

1. Change `group` property for 3 items:
   - Line 56: `nav-exec-dashboard` → change to `'Backup'`
   - Line 58: `nav-referrals` → change to `'Whole Person Care'`
   - Line 53: `nav-episodic-management` → change to `'Whole Person Care'`

2. Update `groupOrder` array (line 96):
   - Remove `'Analytics & Outcomes'`
   - Remove `'Network'`

## Verification
After implementation:
- Whole Person Care section should show 8 items
- Episodes & Quality section should show 1 item (Care Gap Closure)
- Backup section should include Executive Dashboard
- Analytics & Outcomes and Network sections should not appear in the menu

---
**Status:** Awaiting approval to proceed with implementation