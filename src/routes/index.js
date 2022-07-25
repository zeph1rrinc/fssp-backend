const Router = require('express')
const router = new Router()
const authRouter = require('./auth_router')
const unitRouter = require('./units_router')


router.use('/auth', authRouter)
router.use('/units', unitRouter)


module.exports = router