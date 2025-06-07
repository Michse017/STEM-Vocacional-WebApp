const { body, validationResult } = require('express-validator');

const validarUsuario = [
    body('codigo_estudiante')
        .notEmpty()
        .withMessage('El código de estudiante es requerido')
        .isLength({ min: 1, max: 15 })
        .withMessage('El código debe tener entre 1 y 15 caracteres'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validarUsuario
};