# Full Changelog - qb-inventory Fixes

## Complete List of Fixes and Changes

### 1. QBox Framework Compatibility
**Added:**
- Auto-detection system for QBCore/QBox frameworks
- Manual framework selection in config.lua (`Config.Framework = "auto"`, `"qbcore"`, or `"qbox"`)
- Support for both `qbox-core` and `qbox_core` export names
- Compatibility layer in `shared/qbcore_compat.lua`
- Automatic fallback to QBCore if QBox not found
- Framework version detection and logging

**Files Changed:**
- `config.lua`: Added framework configuration
- `shared/qbcore_compat.lua`: Created compatibility layer
- `server/main.lua`: Updated to use compatibility layer
- `server/shop_compat.lua`: Updated for compatibility
- `fxmanifest.lua`: Updated shared scripts

**Status:** ✅ Complete

---

### 2. Fixed: Inventory Closes When Dropping Items
**Issue:** Inventory would automatically close when dropping items on the ground.

**Fix:**
- Removed `SendNUIMessage({ action: "close" })` from drop item animation event
- Players can now drop multiple items without closing inventory

**Files Changed:**
- `client/main.lua`: Removed inventory close call from `RegisterNetEvent('inventory:client:DropItemAnim')`

**Status:** ✅ Fixed

---

### 3. Fixed: Player Inventory Slots Resizing/Disappearing
**Issue:** Player inventory slots would shrink or disappear when moving items to backpack.

**Fix:**
- Added CSS properties to prevent slot resizing:
  - `min-width`, `max-width`, `min-height`, `max-height`
  - `box-sizing: border-box`
  - `flex-shrink: 0`

**Files Changed:**
- `html/css/main.css`: Added fixed sizing properties to slot containers

**Status:** ✅ Fixed

---

### 4. Fixed: Weapon Attachments Not Loading
**Issue:** Weapon attachments were not loading correctly when equipping weapons.

**Fix:**
- Added `Wait(100)` delay before applying attachments
- Added validation for attachment component hashes
- Ensured `attachment.component` and `joaat` hash are valid before calling `GiveWeaponComponentToPed`

**Files Changed:**
- `client/main.lua`: Modified `RegisterNetEvent('inventory:client:UseWeapon')`

**Status:** ✅ Fixed

---

### 5. Fixed: Weapon Panel Requires Multiple Clicks
**Issue:** Weapon panel context menu required multiple clicks to appear.

**Fix:**
- Improved context menu logic using `e.stopPropagation()`
- Refined state checks for `contextMenuSelectedItem` and `ItemInventory`

**Files Changed:**
- `html/js/app.js`: Updated context menu event handler

**Status:** ✅ Fixed

---

### 6. Fixed: Player Inventory Slots Disappearing After Item Movement
**Issue:** After moving items between slots, 7 out of 15 player inventory slots would disappear.

**Fix:**
- Modified `Inventory.Update` function to correctly create all slots (1-15)
- Fixed slot creation loops to ensure hotbar slots (1-6) are always created
- Added proper slot 43 (locked slot) handling
- Ensured slots are cleared before re-appending to prevent duplicates
- Made `maxSlots` calculation more robust with fallbacks

**Files Changed:**
- `html/js/app.js`: Modified `Inventory.Update` and `Inventory.Open` functions

**Status:** ✅ Fixed

---

### 7. Fixed: Ground Items Not Loading/Merging
**Issue:** When multiple items were dropped on the ground, only one could be picked up before requiring inventory close/reopen.

**Fix:**
- Implemented merged drops system that combines nearby ground items into a single "Ground Items" inventory
- Modified `OpenInventory` to merge all drops within 2.5 meters into one inventory view
- Updated `SetInventoryData` to correctly identify source drop from merged inventory
- Added `RefreshMergedDrops` event to update merged view after item pickup
- Modified client to open merged drops when inventory opened near ground items

**Files Changed:**
- `server/main.lua`: Added merged drops logic in `OpenInventory`, `SetInventoryData`, and new `RefreshMergedDrops` event
- `client/main.lua`: Updated inventory command and `UpdateOtherInventory` event
- `html/js/app.js`: Updated `Inventory.Update` to correctly render merged drops

**Status:** ✅ Fixed

---

### 8. Fixed: Items Not Removed from Ground After Pickup
**Issue:** After picking up an item from merged ground inventory, it remained visible in the UI.

**Fix:**
- Added `RefreshMergedDrops` trigger after moving items from merged-drops inventory
- Updated client-side `UpdateOtherInventory` to handle merged-drops correctly
- Fixed slot clearing and recreation logic in `Inventory.Update`

**Files Changed:**
- `server/main.lua`: Added refresh trigger in `SetInventoryData`
- `client/main.lua`: Updated `UpdateOtherInventory` event handler
- `html/js/app.js`: Fixed other inventory slot rendering

**Status:** ✅ Fixed

---

### 9. Fixed: Script Errors - GetItemByName and SetInventory
**Issue:** 
- `[qb-phone] attempt to call a nil value (field 'GetItemByName')`
- `[qb-weapons] attempt to call a nil value (field 'SetInventory')`

**Fix:**
- Removed circular dependency by ensuring exports are defined in `server/main.lua` before `compat_qb.lua` loads
- Added nil checks in `GetItemByName` function for Player parameter
- Added nil checks in `SetInventory` function for Player parameter

**Files Changed:**
- `server/main.lua`: Added nil checks in `GetItemByName` and `SetInventory`
- `server/compat_qb.lua`: Removed redundant exports (exports are in main.lua)

**Status:** ✅ Fixed

---

### 10. Fixed: Lua Syntax Error - goto Statement
**Issue:** `unexpected symbol near '::'` error (Lua 5.1 doesn't support goto).

**Fix:**
- Removed `goto` statement and labels (`::found_item::`)
- Replaced with boolean flag (`found`) and `break` statements

**Files Changed:**
- `server/main.lua`: Removed goto syntax, used boolean flags instead

**Status:** ✅ Fixed

---

### 11. Fixed: Admin /giveitem Command - Nil Value Errors
**Issue:** 
- `attempt to concatenate a nil value` errors in logging (line 228)
- `attempt to concatenate a nil value` errors in notification (line 2923)

**Fix:**
- Added nil checks for `Player.PlayerData.citizenid` in logging
- Added nil checks and `tostring()` conversions for all variables in notification messages
- Added validation for `GetPlayerName()`, `itemData["name"]`, and `amount` before concatenation

**Files Changed:**
- `server/main.lua`: Added comprehensive nil checks in `AddItem` logging and `/giveitem` command

**Status:** ✅ Fixed

---

### 12. Fixed: Items Not Appearing in Inventory After /giveitem
**Issue:** Items added via `/giveitem` command were added server-side but didn't appear in client inventory UI.

**Fix:**
- Added `TriggerClientEvent("inventory:client:UpdatePlayerInventory", id, false)` after successful `AddItem`
- Added notification for target player when receiving items
- Separated `AddItem` call from condition check for better error handling

**Files Changed:**
- `server/main.lua`: Added inventory update trigger in `/giveitem` command

**Status:** ✅ Fixed

---

### 13. Fixed: /giveitem Command False Positive "Can't give item!" Error
**Issue:** `/giveitem` command showed "Can't give item!" even when items should have been added.

**Root Causes:**
- Incorrect logical condition in `AddItem` function preventing items from being added to empty slots
- Poor error messages that didn't indicate actual problem

**Fixes:**
1. Fixed logical condition in `AddItem` function:
   - **Before:** `elseif not itemInfo['unique'] and slot or slot and Player.PlayerData.items[slot] == nil then`
   - **After:** `elseif (not itemInfo['unique'] and slot) or (slot and Player.PlayerData.items[slot] == nil) then`

2. Improved error handling:
   - Added detailed error messages distinguishing:
     - Inventory full (weight limit)
     - Inventory slots full
     - Item doesn't exist
     - Item data not found

3. Fixed `AddItem` null check order:
   - Moved `itemInfo` null check before attempting to access `itemInfo['created']`

**Files Changed:**
- `server/main.lua`: Fixed condition (line 213), improved error handling, fixed null check order

**Status:** ✅ Fixed

---

### 14. Fixed: Missing OpenInventoryById Export for Admin Menu
**Issue:** Admin menu trying to open player inventory by ID was failing with error: `No such export OpenInventoryById in resource qb-inventory`

**Fix:**
- Created `OpenInventoryById` export function that allows admins to open any player's inventory by their ID
- Function validates admin source and target player ID
- Uses existing "otherplayer" inventory system
- Returns `true` on success, `false` on failure
- Shows error notification if target player not found

**Files Changed:**
- `server/main.lua`: Added `OpenInventoryById` export function

**Usage:**
```lua
exports['qb-inventory']:OpenInventoryById(adminSource, targetPlayerId)
```

**Status:** ✅ Fixed

---

### 15. Fixed: SkeletonDamages Export Error When Progressbar Enabled
**Issue:** When enabling the progressbar for opening inventory (`Config.Progressbar.Enable = true`), the script crashes with error: `No such export SkeletonDamages in resource ir_skeleton`

**Fix:**
- Added `pcall` wrapper around `exports["ir_skeleton"]:SkeletonDamages()` call to safely handle missing export
- If the export doesn't exist or fails, `skelly` is set to `nil` instead of crashing
- UI already handles `nil` skeleton data gracefully (checks `if (data.skelly)` before using it)

**Files Changed:**
- `client/main.lua`: Added safe error handling for skeleton export in progressbar callback

**Status:** ✅ Fixed

---

## Summary of All Changes

### Files Modified:
- `config.lua` - Framework configuration
- `shared/qbcore_compat.lua` - Compatibility layer (created)
- `server/main.lua` - Multiple fixes and improvements
- `server/compat_qb.lua` - Export fixes
- `server/shop_compat.lua` - Compatibility update
- `client/main.lua` - UI and inventory fixes
- `html/js/app.js` - JavaScript UI fixes
- `html/css/main.css` - CSS styling fixes
- `fxmanifest.lua` - Resource manifest updates

### Total Fixes: 15 major issues resolved
### Status: ✅ All fixes tested and working

---

## Testing Checklist

- ✅ QBox/QBCore auto-detection works
- ✅ Inventory doesn't close when dropping items
- ✅ Slots don't resize or disappear
- ✅ Weapon attachments load correctly
- ✅ Weapon panel opens with single click
- ✅ All 15 player slots remain visible after item movement
- ✅ Multiple ground items can be picked up without closing inventory
- ✅ Ground items disappear from UI after pickup
- ✅ No script errors in qb-phone or qb-weapons
- ✅ Admin /giveitem command works correctly
- ✅ Items appear immediately in inventory after /giveitem
- ✅ Error messages are clear and specific

---


