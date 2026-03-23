const express = require("express");
const { asyncHandler } = require("../endpointHelper");
const { DB } = require("../database/database.js");

const dataBaseFixingRouter = express.Router();

dataBaseFixingRouter.post(
  "/reset",
  asyncHandler(async () => {
    const conn = await DB.getConnection();
    DB.resetDatabase(conn);
  }),
);
