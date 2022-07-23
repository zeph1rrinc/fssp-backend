const Router = require('express')
const router = new Router()
const controller = require('../controllers/authController')
const authMiddleware = require('../middleware/Auth.middleware')

router.post('/', authMiddleware, controller.create)
router.post('/login', controller.login)
router.get('/', authMiddleware, controller.getAll)
router.get('/:id', authMiddleware, controller.read)
router.delete('/:id', authMiddleware, controller.delete)
router.put('/:id', authMiddleware, controller.update)

module.exports = router