const app = require("./service.js");
const logger = require("./logging.js");

const port = process.argv[2] || 3000;
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  process.on("unhandledRejection", (reason) => {
    logger.log("error", "exception", { reason: reason.stack || reason });
  });

  process.on("uncaughtException", (err) => {
    logger.log("error", "exception", { error: err.message, stack: err.stack });
    // Give Loki a moment to send before exiting
    setTimeout(() => process.exit(1), 2000);
  });

  process.on("SIGTERM", () => {
    // Use your existing logger class!
    logger.log("warn", "lifecycle", {
      msg: "SIGTERM received",
      reason: "Chaos Monkey action",
    });

    server.close(() => {
      logger.log("info", "lifecycle", {
        msg: "All connections closed. Exiting.",
      });
      process.exit(0);
    });

    setTimeout(() => {
      console.error(
        "Timed out waiting for connections to close. Forcing exit.",
      );
      process.exit(1);
    }, 10000);
  });
});
