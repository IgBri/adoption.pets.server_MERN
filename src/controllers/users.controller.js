import mongoose from "mongoose";
import { usersService } from "../services/index.js";
import { logger } from "../utils/logger.js";
import { errorTypes, errorTypesCodes } from "../middlewares/errorHandler.js";
import { CustomError } from "../utils/CustomError.js";

const getAllUsers = async (req, res, next) => {
    try {
        const users = await usersService.getAll();
        if (users.length === 0) {
            logger.debug(errorTypes.GET_ERROR)
            CustomError.generateError(errorTypes.GET_ERROR, "No hay usuarios guadados en la base de datos", "Coleccion de usuarios vacia", errorTypesCodes.NOT_FOUND);
        };
        res.status(200).send({ status: "success", payload: users });
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
}

const getUser = async (req, res, next) => {
    try {
        const userId = req.params.uid;
        const typeUserId = mongoose.isValidObjectId(userId);
        if (typeUserId === false) {
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.PARAMS, "El id ingresado es invalido", "El id ingresado no es un _id de Mongo", errorTypesCodes.INVALID_DATA)
        };
        const user = await usersService.getUserById(userId);
        if (!user) {
            logger.debug(errorTypes.GET_ERROR);
            CustomError.generateError(errorTypes.GET_ERROR, `No se ha encontrado un usuario con id ${userId}`, "El usuario no existe en la base de datos", errorTypesCodes.NOT_FOUND)
        };
        res.status(200).send({ status: "success", payload: user });
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
}

const updateUser = async (req, res, next) => {
    try {
        const updateBody = req.body;
        const userId = req.params.uid;
        const typeUserId = mongoose.isValidObjectId(userId);
        if (!userId || !updateBody.first_name || !updateBody.last_name || !updateBody.role) {
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.PARAMS, "Campos incompletos para editar al usuario", "Campos incompletos", errorTypesCodes.INVALID_DATA)
        };
        if (typeUserId === false || typeof userId !== "string") {
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "El id ingresado es invalido", "El id ingresado no es un _id de Mongo", errorTypesCodes.TYPE_DATA);
        };
        if (typeof updateBody.first_name !== "string" || typeof updateBody.last_name !== "string" || typeof updateBody.role !== "string") {
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "Campos ingresados invalidos", "Los tipos de datos de los campos ingresados no son validos", errorTypesCodes.TYPE_DATA);
        };
        const user = await usersService.getUserById(userId);
        if (!user) {
            logger.debug(errorTypes.GET_ERROR);
            CustomError.generateError(errorTypes.GET_ERROR, "Usuario no encontrado", `No hay usuario con id ${userId} almacenado en la base de datos`, errorTypesCodes.NOT_FOUND);
        };
        const result = await usersService.update(userId, updateBody);
        res.status(200).send({ status: "success", message: "User updated" })
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
}

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.uid;
        const typeUserId = mongoose.Types.ObjectId.isValid(userId);
        if(typeUserId === false){
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "El id ingresado es invalido", "El id ingresado no corresponde a un ObjectId de Mongo", errorTypesCodes.TYPE_DATA);
        };
        const result = await usersService.delete(userId);
        if(result === null) {
            logger.debug(errorTypes.NOT_FOUND);
            CustomError.generateError(errorTypes.NOT_FOUND, "No se pudo eliminar al usuario", "El usuario no se encontraba registrado en la base de datos", errorTypesCodes.NOT_FOUND);
        }
        res.send({ status: "success", message: "User deleted" })
    } catch (error) {
        logger.error(error.message);
        next(error);
    };
};

const uploaderDocument = async (req, res, next) => {
    try {
        const files = req.files;
        const {uid} = req.params;
        if(typeof files !== "object"){
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "El tipo de dato capturado en req.files es invalido", "req.files invalido", errorTypesCodes.TYPE_DATA);
        } else if(!uid){
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.PARAMS, "El id ingresado es invalido", "id invalido", errorTypesCodes.PARAMS);
        };
        if(Object.keys(files).length <= 0){
            logger.debug(errorTypes._QUANTITY_DATA);
            CustomError.generateError(errorTypes._QUANTITY_DATA, "No se enviaron archivos", "Faltan los archivos", errorTypesCodes.INVALID_DATA);
        };
        if(!Array.isArray(files.userDocument)){
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "El tipo de dato capturado en req.files no es un array", "req.files.<array> invalido", errorTypesCodes.TYPE_DATA);
        };
        const user = await usersService.getBy({_id: uid})
        if(!user){
            logger.debug(errorTypes.NOT_FOUND);
            CustomError.generateError(errorTypes.NOT_FOUND, "Usuario no encontrado con ese ID", "_id inexistente o invalido", errorTypesCodes.NOT_FOUND);
        };
        let userDocs = files.userDocument;
        await Promise.all(userDocs.map( async (file) => {
            await usersService.updateWithFile(uid, {name: file.filename, reference: file.path});
        }))
        const resultPostAdd = await usersService.getBy({_id: uid})
        if(!resultPostAdd){
            logger.debug(errorTypes.NOT_FOUND);
            CustomError.generateError(errorTypes.NOT_FOUND, "Usuario no encontrado con ese ID", "_id inexistente o invalido", errorTypesCodes.NOT_FOUND);
        };
        if(user.documents.length >= resultPostAdd.documents.length){
            logger.debug(errorTypes.UPDATE_DOC);
            CustomError.generateError(errorTypes.SERVER_ERROR, "Error al agregar los archivos al usuario", "Error del servidor en la carga de archivos", errorTypesCodes.SERVER_ERROR)
        };
        let qtyDocsAdd = resultPostAdd.documents.length - user.documents.length
        res.status(200).send({status: "success", message: "added document", qtyDocs: qtyDocsAdd})
    } catch (error) {
        logger.error(error.message);
        next(error);
    };
};

export default {
    deleteUser,
    getAllUsers,
    getUser,
    updateUser,
    uploaderDocument
}