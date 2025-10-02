const path = `.env.${process.env.NODE_ENV || 'development'}`
require("dotenv").config({ path })
const express = require("express")
const { requestLogger, addTimeStamp } = require("./middleware/customMiddleware")
const { globalErrorhandler } = require("./middleware/error-handler")
const { redisCall } = require("./cache/redis")
const deliveryRoute = require("./routes/v1/delivery-charges.route")
const { dbConnect } = require("./config/dbConnect")
const app = express()
const PORT = process.env.PORT
app.use(requestLogger)
app.use(addTimeStamp)
app.use(express.json())
app.use(globalErrorhandler)
app.use(deliveryRoute)
app.listen(PORT, () => {
    console.log(`Logistics service listening on http://localhost:${PORT} ${process.env.BASE_PATH}`);
})
dbConnect()
redisCall()