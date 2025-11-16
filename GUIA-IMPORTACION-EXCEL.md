# 📊 Guía de Importación Masiva de Clientes con Excel

Esta guía te enseña cómo usar la funcionalidad de importación y exportación masiva de clientes en Digiautomatiza.

---

## 🎯 Características

✅ **Descargar Plantilla Excel** - Plantilla pre-configurada con ejemplos  
✅ **Importar Clientes** - Carga masiva desde archivo Excel  
✅ **Exportar Clientes** - Descarga tu base de datos completa  
✅ **Validación Automática** - Detecta errores en los datos  
✅ **Reporte Detallado** - Muestra éxitos y errores por fila  

---

## 📥 Paso 1: Descargar la Plantilla

1. Accede a la página de **Gestión de Clientes**
2. En la sección "Importación/Exportación Masiva"
3. Haz clic en **"📥 Descargar Plantilla"**
4. Se descargará un archivo: `Plantilla_Clientes_Digiautomatiza.xlsx`

### Contenido de la Plantilla

La plantilla incluye:
- **Hoja "Clientes"** con 2 ejemplos de cómo llenar los datos
- **Hoja "Instrucciones"** con toda la información necesaria

---

## ✏️ Paso 2: Llenar los Datos

Abre el archivo Excel y completa la información de tus clientes:

### Campos Requeridos (obligatorios)

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre Completo** | Nombre del cliente | Juan Pérez |
| **Email** | Correo electrónico | juan.perez@ejemplo.com |
| **Teléfono** | Número de contacto | +57 300 123 4567 |
| **Servicios de Interés** | Servicios separados por comas | paginas-web, chatbot-ia |

### Campos Opcionales

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Empresa** | Nombre de la empresa del cliente | Tech Solutions S.A.S |
| **Estado** | Estado del cliente | nuevo |
| **Notas** | Información adicional | Cliente muy interesado |

### Servicios Válidos

Usa estos valores **exactamente** como aparecen (separados por comas si son varios):

- `paginas-web` - Páginas Web
- `aplicaciones-web` - Aplicaciones Web  
- `chatbot-ia` - Chatbot con IA
- `automatizacion` - Automatización de Procesos
- `analisis-datos` - Análisis de Datos con Power BI

**Ejemplo:** `paginas-web, automatizacion`

### Estados Válidos

- `nuevo` - Cliente nuevo (por defecto)
- `contactado` - Ya fue contactado
- `interesado` - Mostró interés
- `en-negociacion` - En proceso de negociación
- `convertido` - Cliente convertido
- `inactivo` - Cliente inactivo

---

## 📤 Paso 3: Importar el Archivo

1. Ve a **Gestión de Clientes**
2. Haz clic en **"📤 Importar Excel"**
3. Selecciona tu archivo `.xlsx` o `.xls`
4. Espera a que se procese (aparecerá una animación de carga)

### Resultado de la Importación

Verás un modal con:

#### ✅ Clientes Importados Exitosamente
- Número total de clientes agregados
- Lista con nombre y email de cada uno

#### ❌ Errores Encontrados
- Fila donde ocurrió el error
- Descripción del problema
- Datos de esa fila para identificarla

**Ejemplo de error:**
```
Fila 5: Email es requerido
Juan Pérez - Sin email
```

---

## 💡 Consejos y Buenas Prácticas

### ✅ Recomendaciones

1. **Revisa la plantilla antes de empezar** - Mira los ejemplos incluidos
2. **Copia y pega con cuidado** - Mantén el formato de las columnas
3. **No elimines el encabezado** - Las columnas deben tener sus nombres originales
4. **Usa el formato correcto** - Revisa que los servicios y estados sean válidos
5. **Verifica los emails** - Deben tener formato válido (ejemplo@dominio.com)
6. **Teléfonos con código** - Incluye el código de país (+57 para Colombia)

### ❌ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Nombre Completo es requerido" | Celda vacía | Completa el nombre |
| "Email inválido" | Formato incorrecto | Usa formato: usuario@dominio.com |
| "Debe incluir al menos un servicio válido" | Servicio mal escrito | Copia exactamente de la lista de servicios válidos |
| "Estado no es válido" | Estado mal escrito | Usa uno de los estados válidos |

### 🔧 Si hay errores

1. **No te preocupes** - Los clientes correctos sí se importaron
2. **Revisa el reporte** - Te dice exactamente qué líneas tienen error
3. **Corrige solo esas filas** - No necesitas reimportar todo
4. **Importa de nuevo** - Solo las filas corregidas

---

## 📊 Exportar Clientes

Si ya tienes clientes en el sistema y quieres:
- Hacer un respaldo
- Compartir la base de datos
- Editar masivamente en Excel

### Cómo exportar:

1. Ve a **Gestión de Clientes**
2. Haz clic en **"📊 Exportar a Excel"**
3. Se descargará: `Clientes_Digiautomatiza_YYYY-MM-DD.xlsx`

El archivo incluirá:
- Todos los clientes actuales
- Todos los campos
- Fecha de registro de cada uno

**Nota:** Si no hay clientes, el botón estará deshabilitado

---

## 🎬 Ejemplo Completo

### Archivo Excel de Ejemplo

```
| Nombre Completo    | Email                    | Teléfono         | Empresa          | Servicios de Interés        | Estado     | Notas                        |
|--------------------|--------------------------|------------------|------------------|----------------------------|------------|------------------------------|
| María González     | maria.g@empresa.com      | +57 301 234 5678 | Tech Solutions   | aplicaciones-web, chatbot-ia| interesado | Reunión agendada para el 25  |
| Carlos Ramírez     | carlos.r@startup.co      | +57 315 987 6543 | StartupCO        | paginas-web                | nuevo      | Contacto por LinkedIn        |
| Ana López          | ana.lopez@gmail.com      | +57 320 456 7890 |                  | analisis-datos             | contactado | Envió formulario web         |
```

### Resultado Esperado

✅ **3 clientes importados exitosamente**
- María González - maria.g@empresa.com
- Carlos Ramírez - carlos.r@startup.co
- Ana López - ana.lopez@gmail.com

---

## 🚀 Ventajas de la Importación Masiva

⏱️ **Ahorra Tiempo** - Importa 100 clientes en segundos vs. uno por uno  
📊 **Organizado** - Mantén tus datos en Excel para análisis  
🔄 **Respaldo** - Exporta regularmente como backup  
👥 **Trabajo en Equipo** - Varios pueden trabajar el mismo Excel  
✅ **Sin Errores** - Validación automática antes de importar  

---

## 🆘 Solución de Problemas

### El archivo no se carga

- **Verifica el formato:** Solo `.xlsx` o `.xls`
- **Tamaño del archivo:** Máximo recomendado 1000 clientes por archivo
- **Cierra Excel:** Si el archivo está abierto, ciérralo antes de importar

### Todos los clientes tienen error

- **Revisa el encabezado:** Los nombres de columnas deben ser exactos
- **Descarga la plantilla nueva:** Y copia tus datos ahí
- **Verifica el idioma:** Los nombres de columnas están en español

### Los servicios no se reconocen

- **Copia y pega:** De la lista de servicios válidos
- **Sin espacios extra:** `paginas-web` no `paginas-web ` (espacio al final)
- **Separador correcto:** Usa coma seguida de espacio: `, `

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa esta guía completa**
2. **Consulta la hoja "Instrucciones" en la plantilla**
3. **Verifica los ejemplos incluidos en la plantilla**
4. **Contacta al administrador del sistema**

---

## 🎯 Próximos Pasos

Después de importar tus clientes:

1. ✅ Revisa que todos se hayan importado correctamente
2. 📧 Usa **Envío Masivo de Correos** para contactarlos
3. 💬 Usa **Envío Masivo de WhatsApp** para ofertas especiales
4. 📅 **Programa Sesiones** con los clientes interesados
5. 📊 **Exporta regularmente** como respaldo

---

**¡Listo!** Ya puedes gestionar cientos de clientes de forma eficiente 🚀

*Documento actualizado: Octubre 2025*

