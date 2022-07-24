const { QueryTypes } = require('sequelize');
const jwt = require('jsonwebtoken')

const ApiError = require('../error/ApiError')
const sequelize = require('../db')
const {md5} = require("pg/lib/utils");


const generateJWT = (payload) => {
    return jwt.sign(payload,
        process.env.JWT_SECRET,
        {expiresIn: '24h'}
    )
}

class AuthController {
    async getAll(req, res) {
        const lines = await sequelize.query(
            "SELECT u.id, u.login, e.firstname, e.lastname, e.secondname, e.post, units.name || ' ' || units.city || ' ' || units.address as unit FROM users as u " +
            "left join employees as e on e.id = u.id " +
            "left join units on e.unit_id = units.id " +
            "where u.id > 0;",
            {
                type: QueryTypes.SELECT
            }
        )
        res.json(lines)
    }

    async login(req, res, next) {
        try {
            const {login, password} = req.body
            const candidate = await sequelize.query(`SELECT id, password FROM users WHERE login = ?`, {replacements: [login], type: QueryTypes.SELECT})
            if (!candidate) {
                return next(ApiError.badRequest("Неккоректное имя пользователя или пароль"))
            }
            if (candidate[0].password !== md5(password)) {
                return next(ApiError.badRequest("Неккоректное имя пользователя или пароль"))
            }
            const token = generateJWT({id: candidate[0].id})
            res.json({token})
        }
        catch (e) {
            console.log(e)
            return next(ApiError.internal("Неизвестная ошибка, попробуйте снова"))
        }
    }

    async read(req, res, next) {
        const {id} = req.params
        if (req.user.id !== 0 && id !== req.user.id.toString()) {
            return next(ApiError.badRequest("У вас нет на это прав!"))
        }
        const line = await sequelize.query("select * from users where id = ?", {replacements: [id], type: QueryTypes.SELECT})
        res.json(line[0])
   }

   async create(req, res, next) {
        if (req.user.id !== 0) {
            return next(ApiError.badRequest("У вас нет на это прав!"))
        }
        const {login, password, firstname, lastname, secondname, unit_id, post} = req.body
        const current_max = await sequelize.query("select max(id) from employees", {type: QueryTypes.SELECT})
        const maximum = current_max[0].max
        try {
            const candidate = await sequelize.query(`SELECT id, password FROM users WHERE login = ?`, {
                replacements: [login],
                type: QueryTypes.SELECT
            })
            if (candidate.length) {
                return next(ApiError.badRequest("Такой пользователь уже существует!"))
            }
            await sequelize.query(
                "insert into employees (id, firstname, lastname, secondname, unit_id, post) values (?, ?, ?, ?, ?, ?)",
                {
                    replacements: [maximum + 1, firstname, lastname, secondname, unit_id, post],
                    type: QueryTypes.INSERT
                }
            )
            await sequelize.query(
                "insert into users (id, login, password) values (?, ?, ?)",
                {
                    replacements: [maximum + 1, login, password],
                    type: QueryTypes.INSERT
                }
            )
            res.status(201).json({message: "Пользователь успешно создан"})
        } catch (e) {
            await sequelize.query("delete from employees where id > ?", {replacements: [maximum], type: QueryTypes.DELETE})
            await sequelize.query("delete from users where id > ?", {replacements: [maximum], type: QueryTypes.DELETE})
            console.log(e)
            return next(ApiError.internal("Неизвестная ошибка, попробуйте снова"))
        }
    }

    async delete(req, res, next) {
        const {id} = req.params

        if (req.user.id !== 0 && id !== req.user.id.toString()) {
            return next(ApiError.badRequest("У вас нет на это прав!"))
        }

        const candidate = await sequelize.query(`SELECT id, password FROM users WHERE id = ?`, {
            replacements: [id],
            type: QueryTypes.SELECT
        })

        if (!candidate.length) {
            return next(ApiError.badRequest("Этого пользователя не существует!"))
        }

        await sequelize.query("delete from employees where id = ?", {replacements: [id], type: QueryTypes.DELETE})
        await sequelize.query("delete from users where id = ?", {replacements: [id], type: QueryTypes.DELETE})
        res.json({message: "Пользователь успешно удален"})
    }

    async update(req, res, next) {
        const {id} = req.params

        if (req.user.id !== 0 && id !== req.user.id.toString()) {
            return next(ApiError.badRequest("У вас нет на это прав!"))
        }
        const {password} = req.body
        await sequelize.query("update users set password = ? where id = ?", {replacements: [password, id], type: QueryTypes.UPDATE})
        res.json({message: "Пароль успешно обновлен"})
    }
}

module.exports = new AuthController()