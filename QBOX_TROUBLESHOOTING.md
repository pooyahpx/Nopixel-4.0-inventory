# QBox Troubleshooting Guide

If the script doesn't work with QBox, follow these steps:

## Step 1: Check Config Settings

### In `config.lua` file:

```lua
Config.Framework = "qbox"  -- Set this instead of "auto"
```

If `"auto"` doesn't work, manually set it to `"qbox"`.

---

## Step 2: Check QBox Resource Name

### In `shared/qbcore_compat.lua` file:

The current code checks these names:
- `qbox_core`
- `qbox-core`

**If your QBox has a different name** (e.g., `qbox` or `QBox`), you need to modify lines 9 and 30-37:

```lua
-- Line 9 - in auto-detect section
if GetResourceState('qbox_core') == 'started' 
   or GetResourceState('qbox-core') == 'started' 
   or GetResourceState('qbox') == 'started' then  -- Add this line
    DetectedFramework = "qbox"
```

---

## Step 3: Check QBox Export Name

### In `shared/qbcore_compat.lua` file:

The current code tries these exports:
- `exports['qbox-core']:GetCoreObject()`
- `exports['qbox_core']:GetCoreObject()`

**If your QBox has a different export**, you need to modify lines 32-37:

```lua
-- Lines 30-43 - in Get Core Object section
if DetectedFramework == "qbox" then
    -- Try all possible exports
    local success1, core1 = pcall(function()
        return exports['qbox-core']:GetCoreObject()
    end)
    local success2, core2 = pcall(function()
        return exports['qbox_core']:GetCoreObject()
    end)
    local success3, core3 = pcall(function()
        return exports['qbox']:GetCoreObject()  -- Add this if you have this export
    end)
    
    if success1 and core1 then
        CoreObject = core1
    elseif success2 and core2 then
        CoreObject = core2
    elseif success3 and core3 then  -- Add this
        CoreObject = core3
    else
        print("^3[qb-inventory]^7 Warning: QBox core not found, falling back to QBCore")
        DetectedFramework = "qbcore"
        CoreObject = exports['qb-core']:GetCoreObject()
    end
```

---

## Step 4: If Export Name is Different

### Check what the actual QBox Export Name is:

In FiveM console, run this command:
```
ensure qbox-core  -- or your resource name
```

Then in another resource or Lua console:
```lua
print(exports['qbox-core'])  -- or the actual export name
```

---

## Step 5: Check fxmanifest.lua

### If QBox has a separate locale:

In `fxmanifest.lua` file, lines 7-10:

```lua
shared_scripts {
	'config.lua',
	'shared/qbcore_compat.lua',
	'@qb-core/shared/locale.lua',  -- Keep this
	'@qb-weapons/config.lua'
}
```

**If QBox has its own locale** and you want to add it:

```lua
shared_scripts {
	'config.lua',
	'shared/qbcore_compat.lua'
}

-- QBCore locale
shared_scripts {
	'@qb-core/shared/locale.lua',
	'@qb-weapons/config.lua'
}

-- QBox locale (optional - only if QBox has separate locale)
-- shared_scripts {
-- 	'@qbox-core/shared/locale.lua',  -- Uncomment if it exists
-- }
```

---

## Step 6: Changes in All Fallback Files

If you found a different export name, you need to update these files as well:

### 1. `shared/qbcore_compat.lua` (lines 32-37)
### 2. `server/main.lua` (lines ~1273)
### 3. `client/main.lua` (lines ~404)
### 4. `server/compat_qb.lua` (lines 3-12)
### 5. `server/shop_compat.lua` (lines 3-12)

All these files have similar code:
```lua
local success1, core1 = pcall(function() return exports['qbox-core']:GetCoreObject() end)
local success2, core2 = pcall(function() return exports['qbox_core']:GetCoreObject() end)
```

**Add the new export to all of them.**

---

## Complete Example - If Your Export is `exports['QBox']:GetCoreObject()`:

### In `shared/qbcore_compat.lua`:

```lua
if DetectedFramework == "qbox" then
    local success1, core1 = pcall(function()
        return exports['qbox-core']:GetCoreObject()
    end)
    local success2, core2 = pcall(function()
        return exports['qbox_core']:GetCoreObject()
    end)
    local success3, core3 = pcall(function()
        return exports['QBox']:GetCoreObject()  -- Your actual export
    end)
    
    if success1 and core1 then
        CoreObject = core1
    elseif success2 and core2 then
        CoreObject = core2
    elseif success3 and core3 then
        CoreObject = core3
    else
        print("^3[qb-inventory]^7 Warning: QBox core not found, falling back to QBCore")
        DetectedFramework = "qbcore"
        CoreObject = exports['qb-core']:GetCoreObject()
    end
```

---

## Quick Check:

1. ✅ `Config.Framework = "qbox"` in `config.lua`
2. ✅ What is the QBox resource name? (run `ensure [resource-name]` in console)
3. ✅ What is the actual export name?
4. ✅ Are all fallback files updated?

---

## Fallback to QBCore:

If nothing works, you can fallback to QBCore:

```lua
-- In config.lua
Config.Framework = "qbcore"
```

---

## Important Note:

Always make a backup of the files before making changes!

---

## How to Find Your QBox Export Name:

### Method 1: Check QBox Documentation
Look at the QBox framework documentation for the export name.

### Method 2: Test in Console
```lua
-- Try these in FiveM console:
print(exports['qbox-core'])
print(exports['qbox_core'])
print(exports['qbox'])
print(exports['QBox'])
```

### Method 3: Check QBox Resource
Open the QBox core resource and check the `fxmanifest.lua` for exports.

### Method 4: Use _G Table
```lua
-- In Lua console:
for k, v in pairs(_G) do
    if type(v) == "table" and v.GetCoreObject then
        print("Found:", k)
    end
end
```

---

## Common QBox Export Names:

- `qbox-core` (most common)
- `qbox_core`
- `qbox`
- `QBox`
- `QBOX`

Try adding all of them if unsure!
