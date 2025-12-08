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

local RegisteredShops = {}

local function toVec3(c)
    if not c then return nil end
    if c.x and c.y and c.z then return vector3(c.x, c.y, c.z) end
    return nil
end

exports('CreateShop', function(shop)
    if type(shop) ~= 'table' then return false, 'invalid_shop' end
    if not shop.name or shop.name == '' then return false, 'missing_name' end
    if not shop.items or type(shop.items) ~= 'table' then return false, 'missing_items' end

    RegisteredShops[shop.name] = {
        name   = shop.name,
        label  = shop.label or shop.name,
        coords = toVec3(shop.coords),
        slots  = tonumber(shop.slots) or #shop.items,
        items  = shop.items
    }
    return true
end)

exports('OpenShop', function(source, name)
    local src = source
    local QBPlayer = QBCore.Functions.GetPlayer(src)
    if not QBPlayer then return false, 'no_player' end

    local shop = RegisteredShops[name]
    if not shop then return false, 'shop_not_found' end

    if shop.coords then
        local ped = GetPlayerPed(src)
        if #(GetEntityCoords(ped) - shop.coords) > 2.5 then
            return false, 'out_of_range'
        end
    end

    local inv = {
        name      = ('itemshop-%s'):format(shop.name),
        label     = shop.label,
        slots     = shop.slots,
        maxweight = 0,             
        inventory = {}
    }

    for i, v in ipairs(shop.items) do
        inv.inventory[i] = {
            name   = v.name,
            amount = v.amount or 1,
            price  = v.price  or 0,
            info   = v.info   or {},
            slot   = i
        }
    end

    Player(src).state.inv_busy = true
    
    -- Register shop items for purchase handling
    -- Use the main inventory's ShopItems table via exports
    if GetResourceState('qb-inventory') == 'started' then
        exports['qb-inventory']:RegisterShopItems(shop.name, shop.items)
    end
    
    TriggerClientEvent('inventory:client:OpenInventory', src, {}, QBPlayer.PlayerData.items, inv)
    return true
end)
