const fs = require("fs");
const path = require("path");

const logErrorToFile = (error) => {
  const logPath = path.join(__dirname, "../error.log");
  const logMessage = `[${new Date().toISOString()}] ${error.stack || error.message}\n\n`;

  fs.appendFile(logPath, logMessage, (err) => {
    if (err) {
      console.error("Failed to write error log:", err.message);
    }
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  logErrorToFile(err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
};

module.exports = errorHandler;