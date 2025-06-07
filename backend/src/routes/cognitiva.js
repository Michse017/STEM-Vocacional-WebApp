const express = require('express');
const router = express.Router();
const cognitivaController = require('../controllers/cognitivaController');

// POST /api/cognitiva - Crear respuesta cognitiva
router.post('/', cognitivaController.crear);

// GET /api/cognitiva - Obtener todas las respuestas
router.get('/', cognitivaController.obtenerTodas);

// GET /api/cognitiva/usuario/:idUsuario - Obtener respuesta por usuario
router.get('/usuario/:idUsuario', cognitivaController.obtenerPorUsuario);

// PUT /api/cognitiva/usuario/:idUsuario - Actualizar respuesta
router.put('/usuario/:idUsuario', cognitivaController.actualizar);

module.exports = router;