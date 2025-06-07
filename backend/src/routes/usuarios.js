const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { validarUsuario } = require('../middleware/validation');

// POST /api/usuarios - Crear usuario
router.post('/', validarUsuario, usuarioController.crear);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', usuarioController.obtenerTodos);

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', usuarioController.obtenerPorId);

// GET /api/usuarios/codigo/:codigo - Obtener usuario por código
router.get('/codigo/:codigo', usuarioController.obtenerPorCodigo);

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', usuarioController.eliminar);

module.exports = router;