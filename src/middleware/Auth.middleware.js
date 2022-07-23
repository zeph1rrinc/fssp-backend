const ApiError = require('../error/ApiError')
const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization
        if (!authorizationHeader) {
            return next(ApiError.notAuthorized())
        }

        const accessToken = authorizationHeader.split(" ")[1]
        if (!accessToken) {
            return next(ApiError.notAuthorized())
        }
        const userData = jwt.verify(accessToken, process.env.JWT_SECRET)
        if (!userData) {
            return next(ApiError.notAuthorized())
        }
        req.user = userData
        next()
    } catch (e) {
        return next(ApiError.notAuthorized())
    }
}