const pino = require('pino');
const fs = require('fs');
const path = require('path');


const IS_DEV = process.env.NODE_ENV === 'development';
const LOG_LEVEL = IS_DEV ? 'debug' : 'info';

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });


const transport = pino.transport({
  targets: [
    // Console output
    {
      target: IS_DEV ? 'pino-pretty' : 'pino/file',
      level: LOG_LEVEL,
      options: IS_DEV
        ? {
            colorize: true,
            translateTime: 'HH:MM:ss',
            singleLine: true,
            ignore: 'pid,hostname,reqId',
          }
        : {
            destination: 1, 
          },
    },
    // Info log file
    {
      target: 'pino/file',
      level: 'info',
      options: {
        destination: path.join(logDir, 'info.log'),
      },
    },
    // Error log file
    {
      target: 'pino/file',
      level: 'error',
      
      options: {
        destination: path.join(logDir, 'error.log'),
        
      },
    },
  ],
}); 

// Inisialisasi logger
const logger = pino({ level: LOG_LEVEL }, transport);

module.exports = { logger };
