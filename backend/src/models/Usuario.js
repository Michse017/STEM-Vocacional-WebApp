const { connectDB, sql } = require('../config/database');

class Usuario {
    static async crear(codigoEstudiante) {
        try {
            const pool = await connectDB();
            const result = await pool.request()
                .input('codigo_estudiante', sql.VarChar(15), codigoEstudiante)
                .query(`
                    INSERT INTO usuarios (codigo_estudiante) 
                    OUTPUT INSERTED.id_usuario, INSERTED.codigo_estudiante
                    VALUES (@codigo_estudiante)
                `);
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorCodigo(codigoEstudiante) {
        try {
            const pool = await connectDB();
            const result = await pool.request()
                .input('codigo_estudiante', sql.VarChar(15), codigoEstudiante)
                .query('SELECT * FROM usuarios WHERE codigo_estudiante = @codigo_estudiante');
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodos() {
        try {
            const pool = await connectDB();
            const result = await pool.request()
                .query('SELECT * FROM usuarios');
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;