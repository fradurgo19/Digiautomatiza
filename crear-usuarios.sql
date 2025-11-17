-- Script SQL simple para crear usuarios en Supabase
-- Ejecuta esto directamente en el SQL Editor de Supabase

-- Insertar Administrador
INSERT INTO usuarios (id, nombre, email, password, rol, activo)
VALUES ('admin-001', 'Admin Digiautomatiza', 'admin@digiautomatiza.com', 'Admin2025*', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insertar Luz Comercial
INSERT INTO usuarios (id, nombre, email, password, rol, activo)
VALUES ('luz-comercial-001', 'Luz Comercial', 'luz.comercial@digiautomatiza.com', 'Luz2025*', 'comercial', true)
ON CONFLICT (email) DO NOTHING;

-- Insertar Erika Comercial
INSERT INTO usuarios (id, nombre, email, password, rol, activo)
VALUES ('erika-comercial-001', 'Erika Comercial', 'erika.comercial@digiautomatiza.com', 'Erika2025*', 'comercial', true)
ON CONFLICT (email) DO NOTHING;

-- Verificar que se crearon
SELECT id, nombre, email, rol, activo FROM usuarios;

