import { Router } from "express";
import {
  registerUser,
  getUsers,
  updateUser,
  deleteUser,
  sendInvite,
} from "../controllers/users.controller.js";
import { validate } from "../middleware/validate.js";
import {
  registerUserSchema,
  getUsersSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/users.validator.js";

const router = Router();

router.post("/register", validate(registerUserSchema), registerUser);
router.post("/:id/send-invite", validate(userIdParamSchema), sendInvite);
router.get("/", validate(getUsersSchema), getUsers);
router.put("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", validate(userIdParamSchema), deleteUser);

export default router;