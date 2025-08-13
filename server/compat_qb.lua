local QBCore = exports['qb-core']:GetCoreObject()

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
