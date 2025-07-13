import { errorTypes, errorTypesCodes } from "../middlewares/errorHandler.js";
import { adoptionsService, petsService, usersService } from "../services/index.js";
import { logger } from "../utils/logger.js";
import { CustomError } from "../utils/CustomError.js";
import { isValidObjectId } from "mongoose";

const getAllAdoptions = async(req,res, next)=>{
    try {
        const result = await adoptionsService.getAll();
        if(Array.isArray(result) === false){
            logger.debug(errorTypes.SERVER_ERROR);
            CustomError.generateError(errorTypes.SERVER_ERROR, "El resultado obtenido tiene un formato invalido", "Formato invalido del documento obtenido", errorTypesCodes.INTERNAL_SERVER_ERROR);
        };
        if(result.length === 0){
            return res.status(200).send({status:"success",message: "No hay adopciones vigentes"})
        }
        res.status(200).send({status:"success",payload:result})
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
};

const getAdoption = async(req,res, next)=>{
    try {
        const adoptionId = req.params.aid;
        if(!adoptionId){
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.PARAMS, "Id de mascota no ingresado o incompleto", "no se obtuvo un id", errorTypesCodes.TYPE_DATA);
        };
        if(isValidObjectId(adoptionId) === false){
            logger.debug(errorTypes.TYPE_DATA);
            CustomError.generateError(errorTypes.TYPE_DATA, "El id ingresado no corresponde a un id de MongoDB", "El id ingresado tiene un formato invalido", errorTypesCodes.TYPE_DATA);
        };
        const adoption = await adoptionsService.getBy({_id:adoptionId});
        if(!adoption){
            logger.debug(errorTypes.NOT_FOUND);
            CustomError.generateError(errorTypes.NOT_FOUND, "Adopcion inexistente", "La adopcion buscada con el id ingresado no existe", errorTypesCodes.NOT_FOUND);
        };
        res.status(200).send({status:"success",payload:adoption})
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
};

const createAdoption = async(req,res, next)=>{
    try {
        const {uid,pid} = req.params;
        if(!uid || !pid){
            logger.debug(errorTypes.PARAMS);
            CustomError.generateError(errorTypes.PARAMS, "Parametros invalidos para efectuar la adopcion", "uid y/o pid incompletos", errorTypesCodes.INVALID_DATA);
        };
        const user = await usersService.getUserById(uid);
        if(!user){
            logger.debug(errorTypes.NOT_FOUND, "Usuario no encontrado para efectuar adopcion", "El id ingresado no corresponde a ningun usuario activo", errorTypesCodes.NOT_FOUND);
        };
        const pet = await petsService.getBy({_id:pid});
        if(!pet){
            logger.debug(errorTypes.NOT_FOUND, "Mascota no encontrada para efectuar adopcion", "El id ingresado no corresponde a ninguna mascota registrada", errorTypesCodes.NOT_FOUND);
        };
        if(pet.adopted === true){
            logger.debug(errorTypes.UNMODIFICABLE_DATA);
            CustomError.generateError(errorTypes.UNMODIFICABLE_DATA, "La mascota ya fue adoptada", "Propiedad adopted de la mascota en true", errorTypesCodes.CONFLICT_DATA);
        };
        user.pets.push(pet._id);
        await usersService.update(user._id,{pets:user.pets})
        await petsService.update(pet._id,{adopted:true,owner:user._id})
        let adoptionFinalProcess = await adoptionsService.create({owner:user._id,pet:pet._id});
        res.status(201).send({status:"success",message:"Pet adopted", adoptId: adoptionFinalProcess._id})
    } catch (error) {
        logger.warn(error.message);
        next(error);
    };
};

export default {
    createAdoption,
    getAllAdoptions,
    getAdoption
}