const express = require("express");
const { asyncHandler } = require("../endpointHelper");
const { DB, Role } = require("../database/database.js");

const dataBaseFixingRouter = express.Router();

dataBaseFixingRouter.post(
  "/reset",
  asyncHandler(async (req, res) => {
    const conn = DB.getConnection();
    DB.resetDatabase();
  }),
);
