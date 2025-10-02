const mongoose = require('mongoose');
const deliverySettingsSchema = new mongoose.Schema(
    {
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0]
            }
        },
        delivery_type: {
            type: String,
            enum: ["flat", "per_km"],
            default: "flat"
        },
        flat_charge: {
            type: Number,
            default: 0
        },
        per_km_charge: {
            type: Number,
            default: 0
        },
        max_delivery_km: {
            type: Number,
            required: true,
            default: 15 // system can enforce max = 15
        },
        free_delivery_above: {
            type: Number,
            default: 0 // e.g. free above ₹500
        },
        packing_charge: {
            type: Number,
            default: 0 // e.g. free above ₹500
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            default: null
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);


// Geo index for distance queries
deliverySettingsSchema.index({ location: "2dsphere" });

const SupplierDeliverySettingsModel = mongoose.model("supplier_delivery_settings", deliverySettingsSchema);

module.exports = { SupplierDeliverySettingsModel }