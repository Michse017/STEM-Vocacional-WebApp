const sql = require('mssql');
require('dotenv').config();

const config = {
    server: 'localhost',
    port: 1433,
    database: 'sistema_estudiantes',
    user: 'stemuser',
    password: 'StemPass123!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 60000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

console.log('Configuración BD:', {
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    authentication: 'SQL Server Authentication'
});

let pool = null;

const connectDB = async () => {
    try {
        if (pool) {
            return pool;
        }
        console.log('Intentando conectar a SQL Server con SQL Authentication...');
        pool = await sql.connect(config);
        console.log('✅ Conectado a SQL Server');
        return pool;
    } catch (error) {
        console.error('❌ Error conectando a SQL Server:', error.message);
        throw error;
    }
};

const getPool = () => {
    return pool;
};

module.exports = { connectDB, getPool, sql };