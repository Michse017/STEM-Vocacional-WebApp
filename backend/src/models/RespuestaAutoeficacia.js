const { getPool, sql } = require('../config/database');

class RespuestaAutoeficacia {
    static async crear(datos) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id_usuario', sql.Int, datos.id_usuario)
                .input('creditos_matriculados', sql.Int, datos.creditos_matriculados || null)
                .input('creditos_ganadas', sql.Int, datos.creditos_ganadas || null)
                .input('creditos_reprobadas', sql.Int, datos.creditos_reprobadas || null)
                .input('puntos_calidad_pga', sql.Decimal(5,2), datos.puntos_calidad_pga || null)
                .input('situacion', sql.VarChar(50), datos.situacion || null)
                .input('estado', sql.VarChar(50), datos.estado || null)
                .input('nro_materias_aprobadas', sql.Int, datos.nro_materias_aprobadas || null)
                .input('nro_materias_reprobadas', sql.Int, datos.nro_materias_reprobadas || null)
                .query(`
                    INSERT INTO resp_autoeficacia (
                        id_usuario, creditos_matriculados, creditos_ganadas, creditos_reprobadas,
                        puntos_calidad_pga, situacion, estado, nro_materias_aprobadas, nro_materias_reprobadas
                    ) 
                    OUTPUT INSERTED.*
                    VALUES (
                        @id_usuario, @creditos_matriculados, @creditos_ganadas, @creditos_reprobadas,
                        @puntos_calidad_pga, @situacion, @estado, @nro_materias_aprobadas, @nro_materias_reprobadas
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
                .query('SELECT * FROM resp_autoeficacia WHERE id_usuario = @id_usuario');
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
                .input('creditos_matriculados', sql.Int, datos.creditos_matriculados || null)
                .input('creditos_ganadas', sql.Int, datos.creditos_ganadas || null)
                .input('creditos_reprobadas', sql.Int, datos.creditos_reprobadas || null)
                .input('puntos_calidad_pga', sql.Decimal(5,2), datos.puntos_calidad_pga || null)
                .input('situacion', sql.VarChar(50), datos.situacion || null)
                .input('estado', sql.VarChar(50), datos.estado || null)
                .input('nro_materias_aprobadas', sql.Int, datos.nro_materias_aprobadas || null)
                .input('nro_materias_reprobadas', sql.Int, datos.nro_materias_reprobadas || null)
                .query(`
                    UPDATE resp_autoeficacia SET
                        creditos_matriculados = @creditos_matriculados,
                        creditos_ganadas = @creditos_ganadas,
                        creditos_reprobadas = @creditos_reprobadas,
                        puntos_calidad_pga = @puntos_calidad_pga,
                        situacion = @situacion,
                        estado = @estado,
                        nro_materias_aprobadas = @nro_materias_aprobadas,
                        nro_materias_reprobadas = @nro_materias_reprobadas,
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
                    SELECT ra.*, u.codigo_estudiante 
                    FROM resp_autoeficacia ra
                    INNER JOIN usuarios u ON ra.id_usuario = u.id_usuario
                    ORDER BY ra.fecha_respuesta DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RespuestaAutoeficacia;