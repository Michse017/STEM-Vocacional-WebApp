const RespuestaCognitiva = require('../models/RespuestaCognitiva');

const cognitivaController = {
    // Crear respuesta cognitiva
    async crear(req, res) {
        try {
            const respuesta = await RespuestaCognitiva.crear(req.body);
            res.status(201).json({
                success: true,
                data: respuesta,
                message: 'Respuesta cognitiva creada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear respuesta cognitiva',
                error: error.message
            });
        }
    },

    // Obtener respuesta por usuario
    async obtenerPorUsuario(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaCognitiva.obtenerPorUsuario(idUsuario);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta cognitiva no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuesta cognitiva',
                error: error.message
            });
        }
    },

    // Actualizar respuesta
    async actualizar(req, res) {
        try {
            const { idUsuario } = req.params;
            const respuesta = await RespuestaCognitiva.actualizar(idUsuario, req.body);
            
            if (!respuesta) {
                return res.status(404).json({
                    success: false,
                    message: 'Respuesta cognitiva no encontrada'
                });
            }

            res.json({
                success: true,
                data: respuesta,
                message: 'Respuesta cognitiva actualizada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar respuesta cognitiva',
                error: error.message
            });
        }
    },

    // Obtener todas las respuestas
    async obtenerTodas(req, res) {
        try {
            const respuestas = await RespuestaCognitiva.obtenerTodas();
            res.json({
                success: true,
                data: respuestas,
                count: respuestas.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener respuestas cognitivas',
                error: error.message
            });
        }
    }
};

module.exports = cognitivaController;