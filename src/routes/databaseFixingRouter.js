// const express = require("express");
// const { asyncHandler } = require("../endpointHelper");
// const { DB } = require("../database/database.js");
// const { authRouter } = require("./authRouter.js");

// const dataBaseFixingRouter = express.Router();

// dataBaseFixingRouter.post(
//   "/reset",
//   authRouter.authenticateToken,
//   asyncHandler(async () => {
//     const conn = await DB.getConnection();
//     DB.resetDatabase(conn);
//   }),
// );

// module.exports = dataBaseFixingRouter;
