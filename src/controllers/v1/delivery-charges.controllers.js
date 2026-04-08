const { baseRedisClient } = require("../../cache/redis");
const { error, success } = require("../../functions/functions");
const { SupplierDeliverySettingsModel } = require("../../schemas/supplier-delivery-settings");

const upsertDeliverySettings = async (_req, _res) => {
    try {
        const {
            delivery_type,
            flat_charge,
            per_km_charge,
            max_delivery_km,
            free_delivery_above,
            packing_charge,
            status,
            isSameDayDelivery
        } = _req.body || {};

        const supplier = _req.headers["parent"];
        if (!supplier) {
            return _res.status(400).json(error(400, "Supplier ID is required in headers"));
        }

        // ✅ find existing
        let existing = await SupplierDeliverySettingsModel.findOne({ supplier });

        // ✅ enforce max 15 km
        const cappedDistance = typeof max_delivery_km !== "undefined"
            ? (max_delivery_km > 15 ? 15 : max_delivery_km)
            : existing?.max_delivery_km || 15;

        if (!existing) {
            // 🔹 Create new
            const doc = new SupplierDeliverySettingsModel({
                delivery_type: delivery_type ?? "flat",
                flat_charge: typeof flat_charge !== "undefined" ? flat_charge : 0,
                packing_charge: typeof packing_charge !== "undefined" ? packing_charge : 0,
                per_km_charge: typeof per_km_charge !== "undefined" ? per_km_charge : 0,
                max_delivery_km: cappedDistance,
                free_delivery_above: typeof free_delivery_above !== "undefined" ? free_delivery_above : 0,
                status: typeof status !== "undefined" ? status : true,
                supplier,
                isSameDayDelivery
            });

            await doc.save();
            const keys = await baseRedisClient.keys(`delivery_settings:${supplier}`);
            if (keys.length > 0) {
                await baseRedisClient.del(keys);
            }
            return _res.status(201).json(success(doc, "Delivery settings created successfully"));
        } else {
            // 🔹 Update existing
            existing.delivery_type = delivery_type ?? existing.delivery_type;
            existing.isSameDayDelivery = isSameDayDelivery ?? existing.isSameDayDelivery;
            existing.flat_charge = typeof flat_charge !== "undefined" ? flat_charge : existing.flat_charge;
            existing.per_km_charge = typeof per_km_charge !== "undefined" ? per_km_charge : existing.per_km_charge;
            existing.max_delivery_km = cappedDistance;
            existing.free_delivery_above =
                typeof free_delivery_above !== "undefined" ? free_delivery_above : existing.free_delivery_above;
            existing.status = typeof status !== "undefined" ? status : existing.status;
            existing.packing_charge = typeof packing_charge !== "undefined" ? packing_charge : existing.packing_charge;

            await existing.save();
            const keys = await baseRedisClient.keys(`delivery_settings:${supplier}`);
            if (keys.length > 0) {
                await baseRedisClient.del(keys);
            }
            return _res.status(200).json(success(existing, "Delivery settings updated successfully"));
        }
    } catch (err) {
        console.error("Error in upsert delivery settings:", err);
        return _res.status(500).json(error(500, err.message));
    }
};
const getDeliverySettings = async (_req, _res) => {
    try {
        const supplier = _req.headers["parent"];
        if (!supplier) {
            return _res.status(400).json(error(400, "Supplier ID is required in headers"));
        }
        const cacheKey = `delivery_settings:${supplier}`;
        const cached = await baseRedisClient.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return _res.status(200).json(success(parsed, "Delivery settings fetched from cache"));
        }

        const settings = await SupplierDeliverySettingsModel.findOne({ supplier });

        if (!settings) {
            // return _res.status(404).json(error(404, "No delivery settings found for this supplier"));
            return _res.status(200).json(success({ ...DEFAULT_SETTINGS, supplier }, "No delivery settings found for this supplier, returning system defaults."));

        }
        await baseRedisClient.set(cacheKey, JSON.stringify(settings));
        await baseRedisClient.expire(cacheKey, 120);
        return _res.status(200).json(success(settings, "Delivery settings fetched successfully"));
    } catch (err) {
        console.error("Error fetching delivery settings:", err);
        return _res.status(500).json(error(500, err.message));
    }
};
const DEFAULT_SETTINGS = {
    delivery_type: "flat",
    flat_charge: 0,
    per_km_charge: 0,
    max_delivery_km: 15,
    free_delivery_above: 0,
    packing_charge: 0,
    status: true,
    isSameDayDelivery: true,
    location: {
        type: "Point",
        coordinates: [0, 0]
    }
};

const getDeliverySettingsBySupplierId = async (_req, _res) => {
    try {
        const supplier = _req.params.supplier
        if (!supplier) {
            return _res.status(400).json(error(400, "Supplier ID is required in headers"));
        }

        const settings = await SupplierDeliverySettingsModel.findOne({ supplier });

        if (!settings) {
            return _res.status(200).json(success({ ...DEFAULT_SETTINGS, supplier }, "No delivery settings found for this supplier, returning system defaults."));
        }

        return _res.status(200).json(success(settings, "Delivery settings fetched successfully"));
    } catch (err) {
        console.error("Error fetching delivery settings:", err);
        return _res.status(500).json(error(500, err.message));
    }
};




module.exports = { upsertDeliverySettings, getDeliverySettings, getDeliverySettingsBySupplierId };
