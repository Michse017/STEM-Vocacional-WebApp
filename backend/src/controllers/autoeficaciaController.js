const RespuestaAutoeficacia = require('../models/RespuestaAutoeficacia');

const autoeficaciaController = {
    // Crear respuesta de autoeficacia
    async crear(req, res) {
        try {
            const respuesta = await RespuestaAutoeficacia.crear(req.body);
            res.status(201).json({
                success: true,
                data: respuesta,
                message: 'Respuesta de autoeficacia creada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear respuesta de autoeficacia',
                error: error.message
            });
        }
    },

    // Obtener respuesta por usuario
    async obtenerPorUsuario(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaAutoeficacia.obtenerPorUsuario(idUsuario);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta de autoeficacia no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuesta de autoeficacia',
                error: error.message
            });
        }
    },

    // Actualizar respuesta
    async actualizar(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaAutoeficacia.actualizar(idUsuario, req.body);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta de autoeficacia no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta,
                message: 'Respuesta de autoeficacia actualizada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar respuesta de autoeficacia',
                error: error.message
            });
        }
    },

    // Obtener todas las respuestas
    async obtenerTodas(req, res) {
        try {
            const respuestas = await RespuestaAutoeficacia.obtenerTodas();
            res.json({
                success: true,
                data: respuestas,
                count: respuestas.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuestas de autoeficacia',
                error: error.message
            });
        }
    },

    // Eliminar respuesta por usuario
    async eliminar(req, res) {
        try {
            const { idUsuario } = req.params;
            const eliminado = await RespuestaAutoeficacia.eliminar(idUsuario);
            
            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta de autoeficacia no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Respuesta de autoeficacia eliminada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar respuesta de autoeficacia',
                error: error.message
            });
        }
    }
};

module.exports = autoeficaciaController;