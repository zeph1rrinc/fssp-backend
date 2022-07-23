require('dotenv').config()
const appInfo = require('./package.json')
const express = require('express')
const sequelize = require('./db')
const cors = require('cors')
const router = require('./routes')
const errorHandler = require('./middleware/ErrorHandling.middleware')

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', router)

app.use(errorHandler)

const start = async () => {
    try {
        await sequelize.authenticate()
        app.listen(PORT, () => { console.log(`${appInfo.name}:${appInfo.version} started on port ${PORT}`)})
    } catch (e) {
        console.log(`ERROR: ${e}`)
    }

}


start()