const { createLogger, format, transports } = require('winston');
const path = require('path');

module.exports = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, '../logs/app.log') }),
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});
