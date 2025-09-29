# 📹 Funcionalidad de Videos de YouTube

¡Ahora puedes añadir enlaces de YouTube a los partidos jugados para que todos puedan ver los videos del partido!

## 🎯 ¿Cómo funciona?

### **1. Cuando editas un partido jugado**
- Ve a **"Calendario"** → Selecciona un partido → **"Editar"**
- Marca el partido como **"Jugado"**
- Aparecerá una nueva sección: **"Video del Partido"**
- Introduce el enlace de YouTube del partido
- Guarda los cambios

### **2. Indicadores visuales**
- **En la lista de partidos**: Los partidos con video muestran un 🔴 ícono de YouTube
- **En detalles del partido**: Aparece un botón **"Ver Video"** si hay enlace disponible

### **3. Ver el video**
- **Desde la lista**: Haz clic en el partido → Aparece el botón "Ver Video"
- **Automáticamente**: Se abre YouTube con el video del partido

## 🛠️ Configuración inicial (Solo una vez)

### **Paso 1: Añadir campo a la base de datos**

Ejecuta este SQL en el **Dashboard de Supabase** → **SQL Editor**:

```sql
-- Añadir campo youtube_url a la tabla matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Añadir comentario para documentar el campo
COMMENT ON COLUMN matches.youtube_url IS 'URL del video de YouTube del partido (opcional, solo para partidos jugados)';
```

### **Paso 2: Verificar**
```sql
-- Verificar que el campo se añadió correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'matches' AND column_name = 'youtube_url';
```

## ✨ Características

### **🎬 Enlaces compatibles**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

### **📱 Experiencia de usuario**
- **Indicador visual**: Ícono de YouTube en partidos con video
- **Acceso rápido**: Botón "Ver Video" en detalles del partido
- **Validación**: Solo se guarda si el partido está marcado como jugado
- **Opcional**: Los partidos pueden no tener video

### **🔄 Sincronización en tiempo real**
- Los enlaces de YouTube se sincronizan automáticamente
- Si alguien añade un video, todos lo ven inmediatamente
- Los indicadores visuales se actualizan al momento

## 📋 Casos de uso

1. **Partido importante**: Guardar el video completo del partido
2. **Jugadas destacadas**: Enlace a un highlights del partido
3. **Análisis**: Video con comentarios tácticos
4. **Recuerdos**: Momentos especiales o celebraciones

## 🎨 Diseño

### **Botón en detalles del partido**
- 🔴 Ícono de YouTube + texto "Ver Video"
- Fondo semi-transparente rojo
- Solo visible en partidos jugados con enlace

### **Indicador en lista de partidos**
- Pequeño ícono de YouTube junto al resultado
- Fondo semi-transparente rojo con borde
- Aparece automáticamente cuando hay video

## 🚀 Beneficios

- **Memoria del equipo**: Conservar los mejores momentos
- **Análisis**: Revisar jugadas y tácticas
- **Motivación**: Ver las mejores actuaciones
- **Comunidad**: Compartir experiencias del equipo

¡Ahora podrás revivir todos los grandes momentos del TIESADA FC! ⚽🎬

