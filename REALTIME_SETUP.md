# Configuración de Sincronización en Tiempo Real

Para habilitar la sincronización en tiempo real, sigue estos pasos en el **Dashboard de Supabase**:

## 1. Ir al SQL Editor

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Haz clic en "SQL Editor" en el menú lateral

## 2. Ejecutar el siguiente SQL

```sql
-- Habilitar Row Level Security para todas las tablas si no está habilitado
ALTER TABLE IF EXISTS matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bets ENABLE ROW LEVEL SECURITY;

-- Política permisiva para todas las operaciones (temporal para desarrollo)
-- En producción, deberías tener políticas más estrictas
DROP POLICY IF EXISTS "Enable all for matches" ON matches;
CREATE POLICY "Enable all for matches" ON matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for players" ON players;
CREATE POLICY "Enable all for players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for bets" ON bets;
CREATE POLICY "Enable all for bets" ON bets FOR ALL USING (true) WITH CHECK (true);

-- Habilitar realtime para las tablas
ALTER publication supabase_realtime ADD TABLE matches;
ALTER publication supabase_realtime ADD TABLE players;
ALTER publication supabase_realtime ADD TABLE bets;
```

## 3. Verificar la configuración

### Para verificar RLS:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('matches', 'players', 'bets');
```

### Para verificar Realtime:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## 4. Funcionalidades habilitadas

Una vez configurado, tendrás sincronización en tiempo real para:

- ✅ **Partidos**: Cuando alguien se apunta/desapunta, todos lo ven inmediatamente
- ✅ **Jugadores**: Cambios en fotos, monedas, etc. se sincronizan al instante
- ✅ **Apuestas**: Nuevas apuestas, aceptaciones PvP, resultados se actualizan en tiempo real
- ✅ **Estadísticas**: Se recalculan automáticamente cuando cambian los datos

## ¿Cómo probarlo?

1. Abre la app en **dos dispositivos/navegadores diferentes**
2. **Apúntate a un partido** desde un dispositivo
3. **Inmediatamente** verás el cambio reflejado en el otro dispositivo
4. **Sin necesidad de refrescar** la pantalla

¡La sincronización es instantánea! 🚀

