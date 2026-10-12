import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { app } from "./server.js";

import apiRouter from "./routes/index.js"

const PORT = process.env.PORT;

app.use(express.json());

app.use(cors());

app.use(cookieParser());

app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`server is up and listening on port ${PORT}`);
});
