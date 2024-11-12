import * as winston from 'winston';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const winstonConfig = {
  format: isDevelopment
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        }), // Custom formatting for development
      )
    : winston.format.json(), // Format to Kibana-compatible JSON
  transports: [new winston.transports.Console()],
};
