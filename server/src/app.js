import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

import { app } from "./server";

import authRoutes from "./routes/auth.routes.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";
import { verifyToken } from "./middleware/authenticate.js";
import { isAdmin } from "./middleware/authorizeRole.js";
import usersRoutes from "./routes/users.routes.js";

const PORT = process.env.PORT

app.use(express.json())

app.use(cors())

app.use(cookieParser())

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin/users", verifyToken, isAdmin, adminUsersRoutes);

app.listen(PORT, () => { console.log(`server is up and listening on port ${PORT}`) })