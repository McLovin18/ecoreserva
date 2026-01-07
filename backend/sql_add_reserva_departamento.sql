-- Agregar columna opcional de departamento a la tabla Reserva
-- para poder vincular una reserva a un departamento específico.

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE Name = N'id_departamento'
      AND Object_ID = Object_ID(N'dbo.Reserva')
)
BEGIN
    ALTER TABLE dbo.Reserva
        ADD id_departamento INT NULL;

    ALTER TABLE dbo.Reserva
        ADD CONSTRAINT FK_Reserva_Departamento
            FOREIGN KEY (id_departamento) REFERENCES dbo.Departamento(id_departamento);

    CREATE INDEX IX_Reserva_departamento ON dbo.Reserva(id_departamento);
END;
