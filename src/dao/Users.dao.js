import userModel from "./models/User.js";


export default class Users {
    
    get = (params) =>{
        return userModel.find(params);
    }

    getBy = (params) =>{
        return userModel.findOne(params);
    }

    save = (doc) =>{
        return userModel.create(doc);
    }

    update = (id,doc) =>{
        //throw new Error("Error forzado")
        return userModel.findByIdAndUpdate(id,{$set:doc}, {new: true})
    }

    updateWithFile = (id,doc) =>{
        //throw new Error("Error forzado")
        return userModel.findByIdAndUpdate(id,{$push: {documents: doc}}, {new: true})
    }

    delete = (id) =>{
        return userModel.findByIdAndDelete(id);
    }
}