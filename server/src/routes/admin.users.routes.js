import { Router } from "express";

import {
    registerUser,
    getUsers,
    updateUser,
    deleteUser,
} from "../controllers/users.controller.js";
import { validate } from "../middleware/validate.js";
import { registerUserSchema } from "../validators/users.validator.js";
import { getUsersSchema } from "../validators/users.validator.js";
import { updateUserSchema } from "../validators/users.validator.js";

const router = Router();

router.post("/register", validate(registerUserSchema), registerUser);
router.get("/",validate(getUsersSchema), getUsers);
router.put("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
