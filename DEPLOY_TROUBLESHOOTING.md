# Troubleshooting de Despliegue - STEM Vocacional WebApp

## Problema Actual: Base de Datos No Disponible

### Error Observado
```
Database 'StemDB' on server 'stemdb' is not currently available.
Please retry the connection later.
```

## Posibles Causas y Soluciones

### 1. Azure SQL Database Pausada
**Causa más común**: Azure SQL puede pausarse automáticamente para ahorrar costos.

**Solución**:
1. Ve al portal de Azure
2. Navega a SQL Databases > StemDB
3. Si está pausada, haz clic en "Resume"
4. Espera a que cambie el estado a "Online"

### 2. Variables de Entorno No Configuradas en Render

**Variables requeridas en Render**:
```
DB_SERVER=stemdb.database.windows.net
DB_DATABASE=StemDB
DB_USER=michsega17@gmail.com@stemdb
DB_PASSWORD=[tu_contraseña_aquí]
DB_DRIVER={ODBC Driver 17 for SQL Server}
DB_PORT=1433
FLASK_ENV=production
```

**Cómo configurar en Render**:
1. Ve a tu servicio en Render Dashboard
2. Click en "Environment" tab
3. Agregar cada variable con su valor
4. Click "Save Changes"
5. Esperar el redeploy automático

### 3. Problemas de Conectividad de Red

**Verificaciones**:
- Azure SQL Server debe permitir conexiones desde Render IPs
- Firewall de Azure SQL configurado correctamente
- Azure SQL debe estar en el tier correcto (no Basic pausable)

### 4. Credenciales Incorrectas

**Verificar**:
- Usuario tiene formato correcto: `email@server`
- Contraseña es correcta
- Usuario tiene permisos en la base de datos

## Endpoints de Diagnóstico

### 1. Estado General de la API
```
GET https://stem-backend-9sc0.onrender.com/api/health
```

### 2. Estado Específico de Base de Datos
```
GET https://stem-backend-9sc0.onrender.com/api/database/status
```

## Mejoras Implementadas

### 1. Reintentos Automáticos
- 3 intentos de conexión con backoff exponencial
- Timeout incrementales: 5s, 10s, 20s

### 2. Modo Graceful Degradation
- La aplicación continúa funcionando sin BD
- Endpoints devuelven error 503 con mensaje explicativo
- Logs detallados para debugging

### 3. Monitoreo Mejorado
- Logs de conexión más informativos
- Estado de BD visible en health check
- Troubleshooting automático en respuestas

## Pasos Inmediatos Recomendados

1. **Verificar Azure SQL**:
   - Ir al portal de Azure
   - Verificar que StemDB esté "Online"
   - Si está pausada, resumir

2. **Configurar Variables en Render**:
   - Asegurar que todas las variables estén configuradas
   - Verificar que no haya espacios extra
   - Redeploy después de cambios

3. **Verificar Conectividad**:
   ```bash
   curl https://stem-backend-9sc0.onrender.com/api/database/status
   ```

4. **Monitorear Logs**:
   - Ver logs en tiempo real en Render Dashboard
   - Buscar mensajes de conexión exitosa

## Comandos de Verificación Local

```bash
# Probar conexión local
python test_sql_connection.py

# Verificar variables de entorno
echo $DB_SERVER
echo $DB_DATABASE
echo $DB_USER
# No mostrar la contraseña por seguridad
```

## Contactos de Soporte

- **Azure SQL**: Portal de Azure > Support
- **Render**: Render Dashboard > Support
- **Aplicación**: Verificar logs y endpoints de diagnóstico

## Notas Importantes

- Los cambios en variables de entorno requieren redeploy
- Azure SQL puede tardar varios minutos en resumir
- Los timeouts de conexión son de 60 segundos
- La aplicación funcionará parcialmente sin BD (frontend estático OK)