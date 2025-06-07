const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Error de SQL Server
    if (err.number) {
        return res.status(500).json({
            success: false,
            message: 'Error de base de datos',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;