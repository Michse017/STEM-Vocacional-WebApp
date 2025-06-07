const { getPool, sql } = require('../config/database');

class RespuestaSocioeconomica {
    static async crear(datos) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id_usuario', sql.Int, datos.id_usuario)
                .input('estrato', sql.VarChar(10), datos.estrato || null)
                .input('becas', sql.VarChar(100), datos.becas || null)
                .input('ceres', sql.VarChar(100), datos.ceres || null)
                .input('periodo_ingreso', sql.VarChar(10), datos.periodo_ingreso || null)
                .input('tipo_estudiante', sql.VarChar(30), datos.tipo_estudiante || null)
                .query(`
                    INSERT INTO resp_socioeconomica (
                        id_usuario, estrato, becas, ceres, periodo_ingreso, tipo_estudiante
                    ) 
                    OUTPUT INSERTED.*
                    VALUES (
                        @id_usuario, @estrato, @becas, @ceres, @periodo_ingreso, @tipo_estudiante
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
                .query('SELECT * FROM resp_socioeconomica WHERE id_usuario = @id_usuario');
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
                .input('estrato', sql.VarChar(10), datos.estrato || null)
                .input('becas', sql.VarChar(100), datos.becas || null)
                .input('ceres', sql.VarChar(100), datos.ceres || null)
                .input('periodo_ingreso', sql.VarChar(10), datos.periodo_ingreso || null)
                .input('tipo_estudiante', sql.VarChar(30), datos.tipo_estudiante || null)
                .query(`
                    UPDATE resp_socioeconomica SET
                        estrato = @estrato,
                        becas = @becas,
                        ceres = @ceres,
                        periodo_ingreso = @periodo_ingreso,
                        tipo_estudiante = @tipo_estudiante,
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
                    SELECT rs.*, u.codigo_estudiante 
                    FROM resp_socioeconomica rs
                    INNER JOIN usuarios u ON rs.id_usuario = u.id_usuario
                    ORDER BY rs.fecha_respuesta DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RespuestaSocioeconomica;