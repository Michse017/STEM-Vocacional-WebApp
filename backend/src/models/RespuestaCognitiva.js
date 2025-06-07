const { getPool, sql } = require('../config/database');

class RespuestaCognitiva {
    static async crear(datos) {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id_usuario', sql.Int, datos.id_usuario)
                .input('ptj_fisica', sql.Decimal(5,2), datos.ptj_fisica || null)
                .input('ptj_quimica', sql.Decimal(5,2), datos.ptj_quimica || null)
                .input('ptj_biologia', sql.Decimal(5,2), datos.ptj_biologia || null)
                .input('ptj_matematicas', sql.Decimal(5,2), datos.ptj_matematicas || null)
                .input('ptj_geografia', sql.Decimal(5,2), datos.ptj_geografia || null)
                .input('ptj_historia', sql.Decimal(5,2), datos.ptj_historia || null)
                .input('ptj_filosofia', sql.Decimal(5,2), datos.ptj_filosofia || null)
                .input('ptj_sociales_ciudadano', sql.Decimal(5,2), datos.ptj_sociales_ciudadano || null)
                .input('ptj_ciencias_sociales', sql.Decimal(5,2), datos.ptj_ciencias_sociales || null)
                .input('ptj_lenguaje', sql.Decimal(5,2), datos.ptj_lenguaje || null)
                .input('ptj_lectura_critica', sql.Decimal(5,2), datos.ptj_lectura_critica || null)
                .input('ptj_ingles', sql.Decimal(5,2), datos.ptj_ingles || null)
                .input('ecaes', sql.Decimal(5,2), datos.ecaes || null)
                .input('pga_acumulado', sql.Decimal(5,2), datos.pga_acumulado || null)
                .input('promedio_periodo', sql.Decimal(5,2), datos.promedio_periodo || null)
                .query(`
                    INSERT INTO resp_cognitiva (
                        id_usuario, ptj_fisica, ptj_quimica, ptj_biologia, ptj_matematicas,
                        ptj_geografia, ptj_historia, ptj_filosofia, ptj_sociales_ciudadano,
                        ptj_ciencias_sociales, ptj_lenguaje, ptj_lectura_critica, ptj_ingles,
                        ecaes, pga_acumulado, promedio_periodo
                    ) 
                    OUTPUT INSERTED.*
                    VALUES (
                        @id_usuario, @ptj_fisica, @ptj_quimica, @ptj_biologia, @ptj_matematicas,
                        @ptj_geografia, @ptj_historia, @ptj_filosofia, @ptj_sociales_ciudadano,
                        @ptj_ciencias_sociales, @ptj_lenguaje, @ptj_lectura_critica, @ptj_ingles,
                        @ecaes, @pga_acumulado, @promedio_periodo
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
                .query('SELECT * FROM resp_cognitiva WHERE id_usuario = @id_usuario');
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
                .input('ptj_fisica', sql.Decimal(5,2), datos.ptj_fisica || null)
                .input('ptj_quimica', sql.Decimal(5,2), datos.ptj_quimica || null)
                .input('ptj_biologia', sql.Decimal(5,2), datos.ptj_biologia || null)
                .input('ptj_matematicas', sql.Decimal(5,2), datos.ptj_matematicas || null)
                .input('ptj_geografia', sql.Decimal(5,2), datos.ptj_geografia || null)
                .input('ptj_historia', sql.Decimal(5,2), datos.ptj_historia || null)
                .input('ptj_filosofia', sql.Decimal(5,2), datos.ptj_filosofia || null)
                .input('ptj_sociales_ciudadano', sql.Decimal(5,2), datos.ptj_sociales_ciudadano || null)
                .input('ptj_ciencias_sociales', sql.Decimal(5,2), datos.ptj_ciencias_sociales || null)
                .input('ptj_lenguaje', sql.Decimal(5,2), datos.ptj_lenguaje || null)
                .input('ptj_lectura_critica', sql.Decimal(5,2), datos.ptj_lectura_critica || null)
                .input('ptj_ingles', sql.Decimal(5,2), datos.ptj_ingles || null)
                .input('ecaes', sql.Decimal(5,2), datos.ecaes || null)
                .input('pga_acumulado', sql.Decimal(5,2), datos.pga_acumulado || null)
                .input('promedio_periodo', sql.Decimal(5,2), datos.promedio_periodo || null)
                .query(`
                    UPDATE resp_cognitiva SET
                        ptj_fisica = @ptj_fisica,
                        ptj_quimica = @ptj_quimica,
                        ptj_biologia = @ptj_biologia,
                        ptj_matematicas = @ptj_matematicas,
                        ptj_geografia = @ptj_geografia,
                        ptj_historia = @ptj_historia,
                        ptj_filosofia = @ptj_filosofia,
                        ptj_sociales_ciudadano = @ptj_sociales_ciudadano,
                        ptj_ciencias_sociales = @ptj_ciencias_sociales,
                        ptj_lenguaje = @ptj_lenguaje,
                        ptj_lectura_critica = @ptj_lectura_critica,
                        ptj_ingles = @ptj_ingles,
                        ecaes = @ecaes,
                        pga_acumulado = @pga_acumulado,
                        promedio_periodo = @promedio_periodo,
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
                    SELECT rc.*, u.codigo_estudiante 
                    FROM resp_cognitiva rc
                    INNER JOIN usuarios u ON rc.id_usuario = u.id_usuario
                    ORDER BY rc.fecha_respuesta DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RespuestaCognitiva;