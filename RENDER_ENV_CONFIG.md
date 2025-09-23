# Variables de Entorno Requeridas para Render

## Para que la aplicación funcione correctamente, necesitas configurar estas variables en Render:

### 1. Base de Datos Azure SQL
```
DB_SERVER=stemdb.database.windows.net
DB_DATABASE=StemDB  
DB_USER=michsega17@gmail.com@stemdb
DB_PASSWORD=[TU_CONTRASEÑA_AQUÍ]
DB_DRIVER={ODBC Driver 17 for SQL Server}
DB_PORT=1433
```

### 2. Configuración de Flask
```
FLASK_ENV=production
SECRET_KEY=[GENERAR_UNA_CLAVE_SECRETA_SEGURA]
```

### 3. Frontend URL (Opcional)
```
FRONTEND_URL=https://stem-vocacional-web-app.vercel.app
```

## Cómo Configurar en Render:

1. Ve a tu servicio en Render Dashboard
2. Click en la pestaña "Environment" 
3. Click "Add Environment Variable"
4. Agregar cada variable una por una
5. Click "Save Changes" después de agregar todas
6. Render hará redeploy automáticamente

## Verificar Azure SQL Database:

1. Ve al Portal de Azure
2. Busca "SQL databases" 
3. Click en "StemDB"
4. Verifica que el estado sea "Online" (no "Paused")
5. Si está pausado, click "Resume"

## Problemas Comunes:

### Error: "Database not currently available"
- **Causa**: La BD está pausada para ahorrar costos
- **Solución**: Resumir la BD en Azure Portal

### Error CORS: "Response to preflight request doesn't pass access control check"  
- **Causa**: Variables no configuradas hacen que la BD no responda
- **Solución**: Configurar todas las variables de entorno

### Error: "It does not have HTTP ok status"
- **Causa**: El endpoint devuelve 503/500 por BD no disponible
- **Solución**: Verificar que la BD esté online y variables configuradas

## Test después de configurar:

```bash
# Verificar estado general
curl https://stem-backend-9sc0.onrender.com/api/health

# Verificar estado de BD (después del redeploy)  
curl https://stem-backend-9sc0.onrender.com/api/database/status

# Verificar admin routes (después del redeploy)
curl https://stem-backend-9sc0.onrender.com/api/admin/status
```

## URLs de Debugging:

- **Health Check**: https://stem-backend-9sc0.onrender.com/api/health
- **Database Status**: https://stem-backend-9sc0.onrender.com/api/database/status  
- **Admin Status**: https://stem-backend-9sc0.onrender.com/api/admin/status
- **Render Logs**: [Tu Dashboard de Render] > [Tu Servicio] > Logs

La aplicación debería funcionar completamente una vez que:
1. ✅ Variables de entorno estén configuradas en Render
2. ✅ Azure SQL Database esté "Online" 
3. ✅ Redeploy de Render se complete con éxito