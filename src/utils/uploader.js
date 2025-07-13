import __dirname from "./index.js";
import multer from 'multer';

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        if(file.fieldname === "petImg"){
            cb(null,`${__dirname}/../uploaderFiles/images/pets.images`);
        } else if (file.fieldname === "userDocument") {
            switch(file.mimetype){
                case "application/json":
                    cb(null,`${__dirname}/../uploaderFiles/documents/json.documents`);
                    break
                case "application/pdf":
                    cb(null,`${__dirname}/../uploaderFiles/documents/pdf.documents`);
                    break
                case "text/plain":
                    cb(null,`${__dirname}/../uploaderFiles/documents/text.documents`);
                    break
                case "image/webp":
                    cb(null,`${__dirname}/../uploaderFiles/images/general.images`);
                    break
                default:
                    cb(null,`${__dirname}/../uploaderFiles/documents`);
                    break
            };
        };
    },
    filename:function(req,file,cb){
        //console.log("file en filename: ", file)
        cb(null,`${Date.now()}-${file.originalname}`)
    }
})

const uploader = multer({storage})

export default uploader;