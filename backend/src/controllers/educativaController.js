const RespuestaEducativaFamiliar = require('../models/RespuestaEducativaFamiliar');

const educativaController = {
    // Crear respuesta educativa familiar
    async crear(req, res) {
        try {
            const respuesta = await RespuestaEducativaFamiliar.crear(req.body);
            res.status(201).json({
                success: true,
                data: respuesta,
                message: 'Respuesta educativa familiar creada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear respuesta educativa familiar',
                error: error.message
            });
        }
    },

    // Obtener respuesta por usuario
    async obtenerPorUsuario(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaEducativaFamiliar.obtenerPorUsuario(idUsuario);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta educativa familiar no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuesta educativa familiar',
                error: error.message
            });
        }
    },

    // Actualizar respuesta
    async actualizar(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaEducativaFamiliar.actualizar(idUsuario, req.body);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta educativa familiar no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta,
                message: 'Respuesta educativa familiar actualizada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar respuesta educativa familiar',
                error: error.message
            });
        }
    },

    // Obtener todas las respuestas
    async obtenerTodas(req, res) {
        try {
            const respuestas = await RespuestaEducativaFamiliar.obtenerTodas();
            res.json({
                success: true,
                data: respuestas,
                count: respuestas.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuestas educativas familiares',
                error: error.message
            });
        }
    },

    // Eliminar respuesta por usuario
    async eliminar(req, res) {
        try {
            const { idUsuario } = req.params;
            const eliminado = await RespuestaEducativaFamiliar.eliminar(idUsuario);
            
            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta educativa familiar no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Respuesta educativa familiar eliminada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar respuesta educativa familiar',
                error: error.message
            });
        }
    }
};

module.exports = educativaController;