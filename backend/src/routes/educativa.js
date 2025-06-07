const express = require('express');
const router = express.Router();
const educativaController = require('../controllers/educativaController');

// POST /api/educativa - Crear respuesta educativa familiar
router.post('/', educativaController.crear);

// GET /api/educativa - Obtener todas las respuestas
router.get('/', educativaController.obtenerTodas);

// GET /api/educativa/usuario/:idUsuario - Obtener respuesta por usuario
router.get('/usuario/:idUsuario', educativaController.obtenerPorUsuario);

// PUT /api/educativa/usuario/:idUsuario - Actualizar respuesta
router.put('/usuario/:idUsuario', educativaController.actualizar);

// DELETE /api/educativa/usuario/:idUsuario - Eliminar respuesta
router.delete('/usuario/:idUsuario', educativaController.eliminar);

module.exports = router;