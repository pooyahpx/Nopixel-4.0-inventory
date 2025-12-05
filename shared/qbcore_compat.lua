QBCore = exports['qb-core']:GetCoreObject()
_G.QBCore = QBCore

-- Store the version for reference
QBCoreVersion = Config.QBCoreVersion or "new"
_G.QBCoreVersion = QBCoreVersion

-- Print version info on resource start
CreateThread(function()
    Wait(1000)
    print("^2[qb-inventory]^7 QBCore Version: " .. QBCoreVersion)
    print("^2[qb-inventory]^7 Compatibility layer loaded successfully")
end)

