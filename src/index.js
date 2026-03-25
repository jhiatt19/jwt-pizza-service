const app = require("./service.js");
const logger = require("./logging.js");

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  process.on("unhandledRejection", (reason) => {
    logger.log("error", "exception", { reason: reason.stack || reason });
  });

  process.on("uncaughtException", (err) => {
    logger.log("error", "exception", { error: err.message, stack: err.stack });
    // Give Loki a moment to send before exiting
    setTimeout(() => process.exit(1), 1000);
  });
});
