const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { upsertDeliverySettings, getDeliverySettingsBySupplierId, getDeliverySettings } = require("../../controllers/v1/delivery-charges.controllers")
const deliveryRoute = express.Router()

deliveryRoute.post("/supplier/delivery/settings", asyncHandler(upsertDeliverySettings))
deliveryRoute.get("/supplier/delivery/settings", asyncHandler(getDeliverySettings))
deliveryRoute.get("/supplier/delivery/settings/:supplier", asyncHandler(getDeliverySettingsBySupplierId))

module.exports = deliveryRoute