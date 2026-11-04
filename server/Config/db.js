const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // 10.62.13.11
  port: parseInt(process.env.DB_PORT, 10), // 60357
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let connecting = null;

function getPool() {
  if (!connecting) {
    connecting = new sql.ConnectionPool(dbConfig)
      .connect()
      .then(pool => {
        console.log('MSSQL Database connected successfully on port ' + process.env.DB_PORT);
        pool.on('error', (err) => {
          console.error('MSSQL pool error:', err.message);
          connecting = null;
        });
        return pool;
      })
      .catch(err => {
        console.error('Database connection failed:', err.message);
        connecting = null;
        throw err;
      });
  }
  return connecting;
}

// Existing models `await poolPromise`. A thenable retries the next time it is awaited
// if the previous connection failed, without exiting the process.
const poolPromise = {
  then(resolve, reject) {
    return getPool().then(resolve, reject);
  },
  catch(reject) {
    return getPool().catch(reject);
  }
};

module.exports = {
  sql,
  poolPromise,
  getPool
};
