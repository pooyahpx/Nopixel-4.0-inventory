-- Use global QBCore from compatibility layer (always available after shared/qbcore_compat.lua loads)
-- Fallback is only for safety
local QBCore = QBCore or _G.QBCore or (function()
    local Framework = _G.Framework or "qbcore"
    if Framework == "qbox" then
        local success1, core1 = pcall(function() return exports['qbox-core']:GetCoreObject() end)
        local success2, core2 = pcall(function() return exports['qbox_core']:GetCoreObject() end)
        if success1 and core1 then return core1
        elseif success2 and core2 then return core2 end
    end
    return exports['qb-core']:GetCoreObject()
end)()

RegisterNetEvent('QBCore:Server:AddItem', function(item, amount, slot, info, reason)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        Player.Functions.AddItem(item, amount or 1, slot, info, reason or 'compat:add')
    end
end)

RegisterNetEvent('QBCore:Server:RemoveItem', function(item, amount, slot, reason)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        Player.Functions.RemoveItem(item, amount or 1, slot, reason or 'compat:remove')
    end
end)

QBCore.Functions.CreateCallback('QBCore:HasItem', function(src, cb, items, amount)
    local has = QBCore.Functions.HasItem(src, items, amount)
    cb(has and true or false)
end)

-- Note: GetItemByName and SetInventory exports are registered in server/main.lua
-- They are available as: exports['qb-inventory']:GetItemByName(source, item)
-- and: exports['qb-inventory']:SetInventory(source, items)
