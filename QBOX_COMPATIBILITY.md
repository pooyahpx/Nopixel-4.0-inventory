# QBox Compatibility Guide

This inventory system now supports both **QBCore** and **QBox** frameworks.

## Configuration

The script automatically detects which framework you're using. However, you can manually configure it in `config.lua`:

```lua
-- Framework Selection
-- Options: "qbcore", "qbox", or "auto" (auto-detect)
Config.Framework = "auto" -- Change to "qbcore" or "qbox" if auto-detect doesn't work
```

## How It Works

1. **Auto-Detection (Recommended):**
   - Set `Config.Framework = "auto"` in `config.lua`
   - The script will automatically detect if you're using QBox or QBCore
   - It checks for `qbox_core` or `qbox-core` resource first, then falls back to QBCore

2. **Manual Configuration:**
   - If auto-detection doesn't work, set `Config.Framework = "qbox"` or `Config.Framework = "qbcore"`
   - The script will use the specified framework

## Framework Detection Priority

The auto-detection follows this order:
1. Checks if `qbox_core` or `qbox-core` resource is started
2. Tries to get `exports['qbox-core']:GetCoreObject()`
3. Falls back to QBCore (`exports['qb-core']:GetCoreObject()`)

## QBox Export Names

The script tries multiple QBox export names for compatibility:
- `exports['qbox-core']:GetCoreObject()` (most common)
- `exports['qbox_core']:GetCoreObject()` (alternative naming)

## Console Output

When the resource starts, you'll see a message indicating which framework was detected:

```
=============================================================
[qb-inventory] Framework Detected: QBOX
[qb-inventory] Compatibility layer loaded successfully
=============================================================
```

Or for QBCore:

```
=============================================================
[qb-inventory] Framework Detected: QBCORE
[qb-inventory] QBCore Version: new
[qb-inventory] Compatibility layer loaded successfully
=============================================================
```

## Compatibility Notes

- QBox is 97.99% compatible with QBCore scripts
- The compatibility layer handles all framework-specific differences automatically
- Both frameworks use the same API structure, so the inventory system works identically

## Troubleshooting

If you experience any compatibility issues:

1. **Check Framework Detection:**
   - Look at the console output when starting the resource
   - Verify the detected framework matches your setup

2. **Manual Configuration:**
   - If auto-detection fails, set `Config.Framework = "qbox"` or `Config.Framework = "qbcore"` in `config.lua`
   - Restart the resource

3. **Export Name Issues:**
   - If QBox uses a different export name, you may need to modify `shared/qbcore_compat.lua`
   - Common export names are already supported

4. **Check Resource Names:**
   - Ensure your QBox core resource is named `qbox-core` or `qbox_core`
   - The script checks both variations automatically

## QBCore Version (if using QBCore)

If you're using QBCore, you can also configure the QBCore version:

```lua
Config.QBCoreVersion = "new" -- Options: "new" or "old"
```

This setting only applies when using QBCore, not QBox.

