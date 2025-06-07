const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('Variables de entorno:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);

const { connectDB } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos al iniciar
connectDB();

// Rutas
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/cognitiva', require('./src/routes/cognitiva'));
// Agregar más rutas según necesites

app.get('/', (req, res) => {
    res.json({ message: 'API STEM Vocacional funcionando' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});