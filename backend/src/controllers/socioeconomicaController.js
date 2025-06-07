const RespuestaSocioeconomica = require('../models/RespuestaSocioeconomica');

const socioeconomicaController = {
    // Crear respuesta socioeconómica
    async crear(req, res) {
        try {
            const respuesta = await RespuestaSocioeconomica.crear(req.body);
            res.status(201).json({
                success: true,
                data: respuesta,
                message: 'Respuesta socioeconómica creada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear respuesta socioeconómica',
                error: error.message
            });
        }
    },

    // Obtener respuesta por usuario
    async obtenerPorUsuario(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaSocioeconomica.obtenerPorUsuario(idUsuario);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta socioeconómica no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuesta socioeconómica',
                error: error.message
            });
        }
    },

    // Actualizar respuesta
    async actualizar(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaSocioeconomica.actualizar(idUsuario, req.body);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta socioeconómica no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta,
                message: 'Respuesta socioeconómica actualizada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar respuesta socioeconómica',
                error: error.message
            });
        }
    },

    // Obtener todas las respuestas
    async obtenerTodas(req, res) {
        try {
            const respuestas = await RespuestaSocioeconomica.obtenerTodas();
            res.json({
                success: true,
                data: respuestas,
                count: respuestas.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuestas socioeconómicas',
                error: error.message
            });
        }
    },

    // Eliminar respuesta por usuario
    async eliminar(req, res) {
        try {
            const { idUsuario } = req.params;
            const eliminado = await RespuestaSocioeconomica.eliminar(idUsuario);
            
            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta socioeconómica no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Respuesta socioeconómica eliminada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar respuesta socioeconómica',
                error: error.message
            });
        }
    }
};

module.exports = socioeconomicaController;