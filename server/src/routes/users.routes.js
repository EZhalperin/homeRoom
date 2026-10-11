import { Router } from "express";

import {
    updateMe,
} from "../controllers/users.controller.js";
import { verifyToken } from "../middleware/authenticate.js";

const router = Router();

router.patch("/me", verifyToken, updateMe);

export default router;
