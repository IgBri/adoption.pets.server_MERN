import { usersService } from "../services/index.js";
import { createHash, passwordValidation } from "../utils/index.js";
import jwt from 'jsonwebtoken';
import UserDTO from '../dto/User.dto.js';
import { logger } from "../utils/logger.js";
import { errorTypes, errorTypesCodes } from "../middlewares/errorHandler.js";
import config from "../config/config.js";

import { CustomError } from "../utils/CustomError.js";

const register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        if (!first_name || !last_name || !email || !password) {
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.PARAMS, "Se deben completar todos los campos", "Campos incompletos", errorTypesCodes.INVALID_DATA);
        } else if (typeof first_name !== "string" || typeof last_name !== "string" || typeof email !== "string") {
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "El tipo de datos ingresados es invalido", "Los datos no cumplen con los requisitos de tipo", errorTypesCodes.TYPE_DATA);
        };
        const exists = await usersService.getUserByEmail(email);
        if (exists) {
            logger.debug(errorTypes.GET_ERROR)
            CustomError.generateError(errorTypes.SERVER_ERROR, "El correo electronico ya se encuentra en uso", "Dato repetido", errorTypesCodes.INVALID_DATA);
        };
        const hashedPassword = await createHash(password);
        const user = {
            first_name,
            last_name,
            email,
            password: hashedPassword
        }
        let result = await usersService.create(user);
        if (!result) {
            logger.debug(errorTypes.CREATE);
            CustomError.generateError(errorTypes.SERVER_ERROR, "Error al registrar al usuario", "Error en la creacion del usuario", errorTypesCodes.createError);
        }
        res.send({ status: "success", payload: result._id });
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.SERVER_ERROR, "Campos incompletos para login", "Los campos ingresados en el login estan incompletos", errorTypesCodes.INVALID_DATA);
        };
        const user = await usersService.getUserByEmail(email);
        if (!user) {
            logger.debug(errorTypes.NOT_FOUND);
            CustomError.generateError(errorTypes.NOT_FOUND, "No se encontro usuario en la base de datos con el mail ingresado", "El email no existe en la base de datos", errorTypesCodes.NOT_FOUND);
        };
        const isValidPassword = await passwordValidation(user, password);
        if (!isValidPassword) {
            logger.debug(errorTypes.AUTENTICATION);
            CustomError.generateError(errorTypes.SERVER_ERROR, "Error en el proceso de autenticacion", "Contraseña incorrecta", errorTypesCodes.AUTENTICACION);
        };
        const userDto = UserDTO.getUserTokenFrom(user);
        if (!userDto.name || !userDto.role || !userDto.email) {
            logger.debug(errorTypes.DTO);
            CustomError.generateError(errorTypes.SERVER_ERROR, "Error en el DTO", "Error en el DTO", errorTypesCodes.INTERNAL_SERVER_ERROR)
        };
        const token = jwt.sign(userDto, config.jwtCode, { expiresIn: "1h" });
        //last_session
        let session = new Date();
        await usersService.update(user._id, {last_connection: session});
        res.cookie(config.cookieCode, token, { maxAge: 3600000 }).send({ status: "success", message: `Logged in`, loggedAt: session});
    } catch (error) {
        logger.warn(error.message)
        next(error);
    };
};

const current = async (req, res, next) => {
    try {
        const cookie = req.cookies[process.env.COOKIE_VALUE]
        if(!cookie) {
            logger.debug(errorTypes.COOKIE);
            CustomError.generateError(errorTypes.SERVER_ERROR, "La cookie esta vacia", "req.cookies esta vacio", errorTypesCodes.NOT_FOUND)
        }
        const user = jwt.verify(cookie, config.jwtCode);
        if (!user || user === undefined){
            logger.debug(errorTypes.TOKEN);
            CustomError.generateError(errorTypes.SERVER_ERROR, "No hay token JWT", "El token jwt no existe o expiro", errorTypesCodes.NOT_FOUND);
        };
        res.status(200).send({ status: "success", payload: user })
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
};

//Metodos excluidos

// const unprotectedLogin = async (req, res, next) => {
//     try {
//         const { email, password } = req.body;
//         if (!email || !password){
//             logger.debug(errorTypes.PARAMS);
//             CustomError.generateError(errorTypes.SERVER_ERROR, "Campos incompletos para login", "Los campos ingresados en el login estan incompletos", errorTypesCodes.NOT_FOUND);
//         };
//         const user = await usersService.getUserByEmail(email);
//         if (!user){
//             logger.debug(errorTypes.NOT_FOUND);
//             CustomError.generateError(errorTypes.SERVER_ERROR, "No se encontro usuario en la base de datos con el mail ingresado", "El email no existe en la base de datos", errorTypesCodes.NOT_FOUND);
//         };
//         const isValidPassword = await passwordValidation(user, password);
//         if (!isValidPassword){
//             logger.debug(errorTypes.AUTENTICATION);
//             CustomError.generateError(errorTypes.SERVER_ERROR, "Error en el proceso de autenticacion", "Contraseña incorrecta", errorTypesCodes.AUTENTICACION);
//         };
//         const token = jwt.sign(user, 'tokenSecretJWT', { expiresIn: "1h" });
//         res.cookie('unprotectedCookie', token, { maxAge: 3600000 }).send({ status: "success", message: "Unprotected Logged in" })
//     } catch (error) {
//         logger.warn(error.message);
//         next(error);
//     };
// };
// const unprotectedCurrent = async (req, res) => {
//     const cookie = req.cookies['unprotectedCookie']
//     const user = jwt.verify(cookie, 'tokenSecretJWT');
//     if (user)
//         return res.send({ status: "success", payload: user })
// }
export default {
    current,
    login,
    register,
    current,
    // unprotectedLogin,
    // unprotectedCurrent
}