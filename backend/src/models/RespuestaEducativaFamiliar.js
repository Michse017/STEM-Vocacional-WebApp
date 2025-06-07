const { getPool, sql } = require('../config/database');

class RespuestaEducativaFamiliar {
    static async crear(datos) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id_usuario', sql.Int, datos.id_usuario)
                .input('colegio', sql.VarChar(150), datos.colegio || null)
                .input('ciudad_colegio', sql.VarChar(100), datos.ciudad_colegio || null)
                .input('depto_colegio', sql.VarChar(50), datos.depto_colegio || null)
                .input('municipio_colegio', sql.VarChar(100), datos.municipio_colegio || null)
                .input('fecha_graduacion', sql.Date, datos.fecha_graduacion || null)
                .query(`
                    INSERT INTO resp_educativa_familiar (
                        id_usuario, colegio, ciudad_colegio, depto_colegio, 
                        municipio_colegio, fecha_graduacion
                    ) 
                    OUTPUT INSERTED.*
                    VALUES (
                        @id_usuario, @colegio, @ciudad_colegio, @depto_colegio,
                        @municipio_colegio, @fecha_graduacion
                    )
                `);
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorUsuario(idUsuario) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id_usuario', sql.Int, idUsuario)
                .query('SELECT * FROM resp_educativa_familiar WHERE id_usuario = @id_usuario');
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    static async actualizar(idUsuario, datos) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id_usuario', sql.Int, idUsuario)
                .input('colegio', sql.VarChar(150), datos.colegio || null)
                .input('ciudad_colegio', sql.VarChar(100), datos.ciudad_colegio || null)
                .input('depto_colegio', sql.VarChar(50), datos.depto_colegio || null)
                .input('municipio_colegio', sql.VarChar(100), datos.municipio_colegio || null)
                .input('fecha_graduacion', sql.Date, datos.fecha_graduacion || null)
                .query(`
                    UPDATE resp_educativa_familiar SET
                        colegio = @colegio,
                        ciudad_colegio = @ciudad_colegio,
                        depto_colegio = @depto_colegio,
                        municipio_colegio = @municipio_colegio,
                        fecha_graduacion = @fecha_graduacion,
                        fecha_actualizacion = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id_usuario = @id_usuario
                `);
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodas() {
        try {
            const pool = getPool();
            const result = await pool.request()
                .query(`
                    SELECT ref.*, u.codigo_estudiante 
                    FROM resp_educativa_familiar ref
                    INNER JOIN usuarios u ON ref.id_usuario = u.id_usuario
                    ORDER BY ref.fecha_respuesta DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RespuestaEducativaFamiliar;