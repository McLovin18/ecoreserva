-- Crear tabla Departamento para vincular departamentos a hoteles (Hospedaje)
-- Asegúrate de estar en la base correcta
-- Si tu BD se llama distinto, cambia ReservasHospedajesDB

USE ReservasHospedajesDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Departamento' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Departamento (
        id_departamento INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_hospedaje INT NOT NULL,
        nombre NVARCHAR(120) NOT NULL,
        descripcion NVARCHAR(600) NULL,
        precio_noche DECIMAL(10,2) NOT NULL,
        capacidad INT NULL,
        estado NVARCHAR(30) NOT NULL CONSTRAINT DF_Departamento_estado DEFAULT N'Activo',
        CONSTRAINT FK_Departamento_Hospedaje FOREIGN KEY (id_hospedaje)
            REFERENCES dbo.Hospedaje(id_hospedaje)
            ON DELETE CASCADE
    );
END;
GO
