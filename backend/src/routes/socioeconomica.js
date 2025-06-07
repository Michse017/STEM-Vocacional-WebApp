const express = require('express');
const router = express.Router();
const socioeconomicaController = require('../controllers/socioeconomicaController');

// POST /api/socioeconomica - Crear respuesta socioeconómica
router.post('/', socioeconomicaController.crear);

// GET /api/socioeconomica - Obtener todas las respuestas
router.get('/', socioeconomicaController.obtenerTodas);

// GET /api/socioeconomica/usuario/:idUsuario - Obtener respuesta por usuario
router.get('/usuario/:idUsuario', socioeconomicaController.obtenerPorUsuario);

// PUT /api/socioeconomica/usuario/:idUsuario - Actualizar respuesta
router.put('/usuario/:idUsuario', socioeconomicaController.actualizar);

// DELETE /api/socioeconomica/usuario/:idUsuario - Eliminar respuesta
router.delete('/usuario/:idUsuario', socioeconomicaController.eliminar);

module.exports = router;