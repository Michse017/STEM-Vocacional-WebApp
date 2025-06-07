const express = require('express');
const router = express.Router();
const autoeficaciaController = require('../controllers/autoeficaciaController');

// POST /api/autoeficacia - Crear respuesta de autoeficacia
router.post('/', autoeficaciaController.crear);

// GET /api/autoeficacia - Obtener todas las respuestas
router.get('/', autoeficaciaController.obtenerTodas);

// GET /api/autoeficacia/usuario/:idUsuario - Obtener respuesta por usuario
router.get('/usuario/:idUsuario', autoeficaciaController.obtenerPorUsuario);

// PUT /api/autoeficacia/usuario/:idUsuario - Actualizar respuesta
router.put('/usuario/:idUsuario', autoeficaciaController.actualizar);

// DELETE /api/autoeficacia/usuario/:idUsuario - Eliminar respuesta
router.delete('/usuario/:idUsuario', autoeficaciaController.eliminar);

module.exports = router;