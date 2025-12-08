# QBCore Compatibility Guide

This inventory system now supports both **QBCore Old** and **QBCore New** versions.

## Configuration

To select which QBCore version you're using, edit the `config.lua` file:

```lua
-- QBCore Version Selection
-- Options: "old" for QBCore old version, "new" for QBCore new version
Config.QBCoreVersion = "new" -- Change this to "old" if you're using old QBCore
```

## How to Use

1. **For QBCore New (Latest Version):**
   - Set `Config.QBCoreVersion = "new"` in `config.lua`
   - This is the default setting

2. **For QBCore Old (Legacy Version):**
   - Set `Config.QBCoreVersion = "old"` in `config.lua`
   - Make sure you're using the legacy QBCore framework

## Notes

- Both versions use the same API (`exports['qb-core']:GetCoreObject()`)
- The compatibility layer automatically handles any differences
- The system will print the selected version in the console on resource start
- If you encounter any issues, make sure your QBCore version matches the setting in `config.lua`

## Troubleshooting

If you experience any compatibility issues:

1. Check that `Config.QBCoreVersion` matches your QBCore version
2. Restart the resource after changing the setting
3. Check the console for the version confirmation message: `[qb-inventory] QBCore Version: new/old`

