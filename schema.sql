
-- ========= PASO 1: Eliminar tablas antiguas (si existen) para empezar de cero =========
-- Esto asegura que no haya conflictos con versiones anteriores.
DROP TABLE IF EXISTS public.roi_campaigns CASCADE;
DROP TABLE IF EXISTS public.visit_materials CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.executives CASCADE; -- Nueva tabla
DROP TABLE IF EXISTS public.visits CASCADE;


-- ========= PASO 2: Crear la tabla principal de VISITAS =========
-- Guarda la información general de cada visita.
CREATE TABLE public.visits (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "EJECUTIVA DE TRADE" TEXT,
  "ASESOR COMERCIAL" TEXT,
  "CANAL" TEXT,
  "CADENA" TEXT,
  "DIRECCIÓN DEL PDV" TEXT,
  "ACTIVIDAD" TEXT,
  "HORARIO" TEXT,
  "CIUDAD" TEXT,
  "ZONA" TEXT,
  "FECHA" TIMESTAMPTZ,
  "PRESUPUESTO" NUMERIC,
  "AFLUENCIA ESPERADA" INTEGER,
  "FECHA DE ENTREGA DE MATERIAL" TIMESTAMPTZ,
  "OBJETIVO DE LA ACTIVIDAD" TEXT,
  "CANTIDAD DE MUESTRAS" INTEGER,
  "OBSERVACION" TEXT
);

-- ========= PASO 3: Crear el catálogo de MATERIALES con sus precios =========
-- Aquí vivirán todos los materiales que puedes crear, editar y eliminar desde la app.
CREATE TABLE public.materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    unit_price NUMERIC NOT NULL DEFAULT 0
);

-- ========= PASO 4: Crear la tabla de EJECUTIVAS (NUEVO) =========
-- Almacenará los nombres y URLs de las fotos de las ejecutivas.
CREATE TABLE public.executives (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    photo_url TEXT
);

-- ========= PASO 5: Crear la tabla de enlace VISIT_MATERIALS =========
-- Esta tabla conecta las visitas con los materiales y almacena la cantidad usada en cada una.
CREATE TABLE public.visit_materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    visit_id BIGINT NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    material_id BIGINT NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    UNIQUE(visit_id, material_id)
);

-- ========= PASO 6: Crear la tabla de ANÁLISIS DE ROI (versión con cliente y utilidad) =========
-- Almacena los datos y resultados de las campañas de marketing.
CREATE TABLE public.roi_campaigns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    zone TEXT NOT NULL,
    responsible TEXT NOT NULL,
    investment_type TEXT NOT NULL,
    amount_invested NUMERIC NOT NULL CHECK (amount_invested > 0),
    revenue_generated NUMERIC NOT NULL,
    profit_generated NUMERIC NOT NULL,
    units_sold INTEGER,
    comment TEXT,
    roi NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN amount_invested = 0 THEN 0
            ELSE (profit_generated / amount_invested) * 100
        END
    ) STORED
);


-- ========= PASO 7: Configurar la Seguridad a Nivel de Fila (RLS) =========
-- Habilitamos la seguridad en todas las tablas.
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executives ENABLE ROW LEVEL SECURITY; -- Seguridad para la nueva tabla

-- Creamos políticas que permiten a los usuarios autenticados interactuar con las tablas.
CREATE POLICY "Public full access on visits" ON public.visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK(true);
CREATE POLICY "Public full access on visit_materials" ON public.visit_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on roi_campaigns" ON public.roi_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on executives" ON public.executives FOR ALL TO authenticated USING (true) WITH CHECK (true); -- Política para la nueva tabla


-- ========= PASO 8: Insertar los datos iniciales =========
-- Materiales que aparecerán la primera vez.
INSERT INTO public.materials (name, unit_price) VALUES
    ('AFICHE', 1.50), ('CARPA', 150.00), ('EXHIBIDOR MADERA', 80.00), ('FUNDA', 0.50),
    ('GANCHOS', 0.25), ('HABLADORES ACRILICO', 5.00), ('PLUMA', 0.75), ('ROMPETRAFICO', 2.00),
    ('SERVILLETA', 0.10), ('OTROS', 0.00), ('FLAYER', 0.20), ('ROLL UP', 45.00),
    ('LLAVERO', 1.00), ('PORTAVASO', 0.30), ('STAND', 250.00), ('VIBRIN', 3.00),
    ('EXHIBIDOR ACRILICO', 60.00)
ON CONFLICT (name) DO NOTHING;

-- Ejecutivas de ejemplo. ¡Puedes modificarlas desde la app!
INSERT INTO public.executives (name, photo_url) VALUES
    ('CAROLINA CAICEDO', 'https://placehold.co/100x100.png'),
    ('JOHANA CORTES', 'https://placehold.co/100x100.png'),
    ('KATHERINE PARRA', 'https://placehold.co/100x100.png'),
    ('Luisa Perez', 'https://placehold.co/100x100.png')
ON CONFLICT (name) DO NOTHING;
