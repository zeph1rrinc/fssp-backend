const Router = require('express')
const router = new Router()
const authRouter = require('./auth_router')


router.use('/auth', authRouter)


module.exports = router