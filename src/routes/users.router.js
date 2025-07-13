import { Router } from 'express';
import usersController from '../controllers/users.controller.js';
import uploader from '../utils/uploader.js';

const router = Router();

router.get('/',usersController.getAllUsers);
router.get('/:uid',usersController.getUser);
router.put('/:uid',usersController.updateUser);
router.delete('/:uid',usersController.deleteUser);
router.post("/:uid/documents", uploader.fields([{name: "userDocument"}, {name: "petImg"}]), usersController.uploaderDocument);

export default router;