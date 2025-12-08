-- Framework Auto-Detection and Compatibility Layer
local Framework = Config.Framework or "auto"
local DetectedFramework = nil
local CoreObject = nil

-- Auto-detect framework if set to "auto"
if Framework == "auto" then
    -- Try QBox first (newer framework)
    if GetResourceState('qbox_core') == 'started' or GetResourceState('qbox-core') == 'started' then
        DetectedFramework = "qbox"
    -- Try QBCore
    elseif GetResourceState('qb-core') == 'started' then
        DetectedFramework = "qbcore"
    else
        -- Try to get export to determine framework
        local success, result = pcall(function()
            return exports['qbox-core']:GetCoreObject()
        end)
        if success and result then
            DetectedFramework = "qbox"
        else
            DetectedFramework = "qbcore" -- Default to QBCore
        end
    end
else
    DetectedFramework = Framework
end

-- Get Core Object based on detected/configured framework
if DetectedFramework == "qbox" then
    -- Try qbox-core first, then qbox_core
    local success1, core1 = pcall(function()
        return exports['qbox-core']:GetCoreObject()
    end)
    local success2, core2 = pcall(function()
        return exports['qbox_core']:GetCoreObject()
    end)
    
    if success1 and core1 then
        CoreObject = core1
    elseif success2 and core2 then
        CoreObject = core2
    else
        -- Fallback to qb-core if qbox doesn't work
        print("^3[qb-inventory]^7 Warning: QBox core not found, falling back to QBCore")
        DetectedFramework = "qbcore"
        CoreObject = exports['qb-core']:GetCoreObject()
    end
else
    -- QBCore
    CoreObject = exports['qb-core']:GetCoreObject()
end

-- Set global variables
QBCore = CoreObject
_G.QBCore = QBCore
_G.Framework = DetectedFramework

-- Store the version for reference (only for QBCore)
if DetectedFramework == "qbcore" then
    QBCoreVersion = Config.QBCoreVersion or "new"
    _G.QBCoreVersion = QBCoreVersion
else
    QBCoreVersion = "n/a"
    _G.QBCoreVersion = "n/a"
end

-- Print version info on resource start
CreateThread(function()
    Wait(1000)
    print("^5=============================================================^7")
    print("^2[qb-inventory]^7 Framework Detected: " .. string.upper(DetectedFramework))
    if DetectedFramework == "qbcore" then
        print("^2[qb-inventory]^7 QBCore Version: " .. QBCoreVersion)
    end
    print("^2[qb-inventory]^7 Compatibility layer loaded successfully")
    print("^5=============================================================^7")
end)

