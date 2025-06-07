const Usuario = require('../models/Usuario');

const usuarioController = {
    // Crear usuario
    async crear(req, res) {
        try {
            const { codigo_estudiante } = req.body;
            
            // Verificar si ya existe
            const usuarioExistente = await Usuario.obtenerPorCodigo(codigo_estudiante);
            if (usuarioExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de estudiante ya existe'
                });
            }

            const usuario = await Usuario.crear(codigo_estudiante);
            res.status(201).json({
                success: true,
                data: usuario,
                message: 'Usuario creado exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al crear usuario',
                error: error.message
            });
        }
    },

    // Obtener todos los usuarios
    async obtenerTodos(req, res) {
        try {
            const usuarios = await Usuario.obtenerTodos();
            res.json({
                success: true,
                data: usuarios,
                count: usuarios.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    },

    // Obtener usuario por ID
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const usuario = await Usuario.obtenerPorId(id);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
                error: error.message
            });
        }
    },

    // Obtener usuario por código
    async obtenerPorCodigo(req, res) {
        try {
            const { codigo } = req.params;
            const usuario = await Usuario.obtenerPorCodigo(codigo);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
                error: error.message
            });
        }
    },

    // Eliminar usuario
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await Usuario.eliminar(id);
            
            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario',
                error: error.message
            });
        }
    }
};

module.exports = usuarioController;