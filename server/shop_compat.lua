local QBCore = exports['qb-core']:GetCoreObject()

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
        name      = ('shop-%s'):format(shop.name),
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
    TriggerClientEvent('qb-inventory:client:openInventory', src, QBPlayer.PlayerData.items, inv)
    return true
end)
