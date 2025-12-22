IF DB_ID(N'ReservasHospedajesDB') IS NULL
BEGIN
    CREATE DATABASE ReservasHospedajesDB;
END
GO

USE ReservasHospedajesDB;
GO

CREATE TABLE dbo.Rol (
    id_rol        INT IDENTITY(1,1) NOT NULL,
    nombre_rol    NVARCHAR(50) NOT NULL,
    descripcion   NVARCHAR(200) NULL,
    CONSTRAINT PK_Rol PRIMARY KEY (id_rol),
    CONSTRAINT UQ_Rol_nombre UNIQUE (nombre_rol)
);
GO

CREATE TABLE dbo.Region (
    id_region      INT IDENTITY(1,1) NOT NULL,
    nombre_region  NVARCHAR(50) NOT NULL,
    CONSTRAINT PK_Region PRIMARY KEY (id_region),
    CONSTRAINT UQ_Region_nombre UNIQUE (nombre_region)
);
GO

CREATE TABLE dbo.EstadoHospedaje (
    id_estado_hospedaje INT IDENTITY(1,1) NOT NULL,
    nombre_estado       NVARCHAR(30) NOT NULL,
    CONSTRAINT PK_EstadoHospedaje PRIMARY KEY (id_estado_hospedaje),
    CONSTRAINT UQ_EstadoHospedaje_nombre UNIQUE (nombre_estado)
);
GO

CREATE TABLE dbo.TipoHospedaje (
    id_tipo_hospedaje INT IDENTITY(1,1) NOT NULL,
    nombre_tipo       NVARCHAR(60) NOT NULL,
    descripcion       NVARCHAR(200) NULL,
    CONSTRAINT PK_TipoHospedaje PRIMARY KEY (id_tipo_hospedaje),
    CONSTRAINT UQ_TipoHospedaje_nombre UNIQUE (nombre_tipo)
);
GO

CREATE TABLE dbo.EstadoReserva (
    id_estado_reserva INT IDENTITY(1,1) NOT NULL,
    nombre_estado     NVARCHAR(30) NOT NULL,
    CONSTRAINT PK_EstadoReserva PRIMARY KEY (id_estado_reserva),
    CONSTRAINT UQ_EstadoReserva_nombre UNIQUE (nombre_estado)
);
GO

CREATE TABLE dbo.TipoActividad (
    id_tipo_actividad INT IDENTITY(1,1) NOT NULL,
    nombre_tipo       NVARCHAR(60) NOT NULL,
    descripcion       NVARCHAR(200) NULL,
    CONSTRAINT PK_TipoActividad PRIMARY KEY (id_tipo_actividad),
    CONSTRAINT UQ_TipoActividad_nombre UNIQUE (nombre_tipo)
);
GO

CREATE TABLE dbo.MetodoPago (
    id_metodo_pago INT IDENTITY(1,1) NOT NULL,
    nombre_metodo  NVARCHAR(40) NOT NULL,
    CONSTRAINT PK_MetodoPago PRIMARY KEY (id_metodo_pago),
    CONSTRAINT UQ_MetodoPago_nombre UNIQUE (nombre_metodo)
);
GO



CREATE TABLE dbo.Ubicacion (
    id_ubicacion INT IDENTITY(1,1) NOT NULL,
    comunidad    NVARCHAR(80) NOT NULL,
    canton       NVARCHAR(80) NOT NULL,
    provincia    NVARCHAR(80) NOT NULL,
    id_region    INT NOT NULL,
    CONSTRAINT PK_Ubicacion PRIMARY KEY (id_ubicacion),
    CONSTRAINT FK_Ubicacion_Region
        FOREIGN KEY (id_region) REFERENCES dbo.Region(id_region)
);
GO

CREATE TABLE dbo.Usuario (
    id_usuario      INT IDENTITY(1,1) NOT NULL,
    nombre          NVARCHAR(80) NOT NULL,
    apellido        NVARCHAR(80) NOT NULL,
    correo          NVARCHAR(150) NOT NULL,
    contrasena      NVARCHAR(255) NOT NULL,
    telefono        NVARCHAR(20) NULL,
    id_rol          INT NOT NULL,
    fecha_registro  DATETIME2(0) NOT NULL
        CONSTRAINT DF_Usuario_fecha_registro DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Usuario PRIMARY KEY (id_usuario),
    CONSTRAINT UQ_Usuario_correo UNIQUE (correo),
    CONSTRAINT FK_Usuario_Rol
        FOREIGN KEY (id_rol) REFERENCES dbo.Rol(id_rol)
);
GO

CREATE TABLE dbo.Hospedaje (
    id_hospedaje          INT IDENTITY(1,1) NOT NULL,
    nombre                NVARCHAR(120) NOT NULL,
    descripcion           NVARCHAR(600) NULL,
    precio_base           DECIMAL(10,2) NOT NULL,
    fecha_registro        DATETIME2(0) NOT NULL
        CONSTRAINT DF_Hospedaje_fecha_registro DEFAULT (SYSDATETIME()),
    id_usuario_anfitrion  INT NOT NULL,
    id_tipo_hospedaje     INT NOT NULL,
    id_ubicacion          INT NOT NULL,
    id_estado_hospedaje   INT NOT NULL,
    CONSTRAINT PK_Hospedaje PRIMARY KEY (id_hospedaje),
    CONSTRAINT CK_Hospedaje_precio CHECK (precio_base >= 0),
    CONSTRAINT FK_Hospedaje_Anfitrion
        FOREIGN KEY (id_usuario_anfitrion) REFERENCES dbo.Usuario(id_usuario),
    CONSTRAINT FK_Hospedaje_Tipo
        FOREIGN KEY (id_tipo_hospedaje) REFERENCES dbo.TipoHospedaje(id_tipo_hospedaje),
    CONSTRAINT FK_Hospedaje_Ubicacion
        FOREIGN KEY (id_ubicacion) REFERENCES dbo.Ubicacion(id_ubicacion),
    CONSTRAINT FK_Hospedaje_Estado
        FOREIGN KEY (id_estado_hospedaje) REFERENCES dbo.EstadoHospedaje(id_estado_hospedaje)
);
GO

CREATE TABLE dbo.Actividad (
    id_actividad      INT IDENTITY(1,1) NOT NULL,
    nombre            NVARCHAR(120) NOT NULL,
    descripcion       NVARCHAR(600) NULL,
    precio            DECIMAL(10,2) NOT NULL,
    id_hospedaje      INT NOT NULL,
    id_tipo_actividad INT NOT NULL,
    id_ubicacion      INT NOT NULL,
    CONSTRAINT PK_Actividad PRIMARY KEY (id_actividad),
    CONSTRAINT CK_Actividad_precio CHECK (precio >= 0),
    CONSTRAINT FK_Actividad_Hospedaje
        FOREIGN KEY (id_hospedaje) REFERENCES dbo.Hospedaje(id_hospedaje),
    CONSTRAINT FK_Actividad_Tipo
        FOREIGN KEY (id_tipo_actividad) REFERENCES dbo.TipoActividad(id_tipo_actividad),
    CONSTRAINT FK_Actividad_Ubicacion
        FOREIGN KEY (id_ubicacion) REFERENCES dbo.Ubicacion(id_ubicacion)
);
GO

CREATE TABLE dbo.Reserva (
    id_reserva          INT IDENTITY(1,1) NOT NULL,
    fecha_ingreso       DATE NOT NULL,
    fecha_salida        DATE NOT NULL,
    num_personas        SMALLINT NOT NULL,
    fecha_reserva       DATETIME2(0) NOT NULL
        CONSTRAINT DF_Reserva_fecha_reserva DEFAULT (SYSDATETIME()),
    id_usuario_turista  INT NOT NULL,
    id_hospedaje        INT NOT NULL,
    id_estado_reserva   INT NOT NULL,
    CONSTRAINT PK_Reserva PRIMARY KEY (id_reserva),
    CONSTRAINT CK_Reserva_fechas CHECK (fecha_salida > fecha_ingreso),
    CONSTRAINT CK_Reserva_num_personas CHECK (num_personas > 0),
    CONSTRAINT FK_Reserva_Turista
        FOREIGN KEY (id_usuario_turista) REFERENCES dbo.Usuario(id_usuario),
    CONSTRAINT FK_Reserva_Hospedaje
        FOREIGN KEY (id_hospedaje) REFERENCES dbo.Hospedaje(id_hospedaje),
    CONSTRAINT FK_Reserva_Estado
        FOREIGN KEY (id_estado_reserva) REFERENCES dbo.EstadoReserva(id_estado_reserva)
);
GO

CREATE TABLE dbo.Pago (
    id_pago            INT IDENTITY(1,1) NOT NULL,
    monto              DECIMAL(10,2) NOT NULL,
    fecha_pago         DATETIME2(0) NOT NULL
        CONSTRAINT DF_Pago_fecha_pago DEFAULT (SYSDATETIME()),
    id_reserva         INT NOT NULL,
    id_metodo_pago     INT NOT NULL,
    id_usuario_turista INT NOT NULL,
    CONSTRAINT PK_Pago PRIMARY KEY (id_pago),
    CONSTRAINT CK_Pago_monto CHECK (monto > 0),
    CONSTRAINT UQ_Pago_reserva UNIQUE (id_reserva),
    CONSTRAINT FK_Pago_Reserva
        FOREIGN KEY (id_reserva) REFERENCES dbo.Reserva(id_reserva),
    CONSTRAINT FK_Pago_Metodo
        FOREIGN KEY (id_metodo_pago) REFERENCES dbo.MetodoPago(id_metodo_pago),
    CONSTRAINT FK_Pago_Usuario
        FOREIGN KEY (id_usuario_turista) REFERENCES dbo.Usuario(id_usuario)
);
GO

CREATE TABLE dbo.Resena (
    id_resena          INT IDENTITY(1,1) NOT NULL,
    comentario         NVARCHAR(800) NULL,
    calificacion       TINYINT NOT NULL,
    fecha_resena       DATETIME2(0) NOT NULL
        CONSTRAINT DF_Resena_fecha_resena DEFAULT (SYSDATETIME()),
    id_usuario_turista INT NOT NULL,
    id_hospedaje       INT NOT NULL,
    id_reserva         INT NOT NULL,
    CONSTRAINT PK_Resena PRIMARY KEY (id_resena),
    CONSTRAINT CK_Resena_calificacion CHECK (calificacion BETWEEN 1 AND 5),
    CONSTRAINT UQ_Resena_reserva UNIQUE (id_reserva),
    CONSTRAINT FK_Resena_Turista
        FOREIGN KEY (id_usuario_turista) REFERENCES dbo.Usuario(id_usuario),
    CONSTRAINT FK_Resena_Hospedaje
        FOREIGN KEY (id_hospedaje) REFERENCES dbo.Hospedaje(id_hospedaje),
    CONSTRAINT FK_Resena_Reserva
        FOREIGN KEY (id_reserva) REFERENCES dbo.Reserva(id_reserva)
);
GO

CREATE TABLE dbo.DetalleHuesped (
    id_detalle  INT IDENTITY(1,1) NOT NULL,
    nombre      NVARCHAR(120) NOT NULL,
    documento   NVARCHAR(30) NOT NULL,
    edad        SMALLINT NULL,
    id_reserva  INT NOT NULL,
    CONSTRAINT PK_DetalleHuesped PRIMARY KEY (id_detalle),
    CONSTRAINT CK_DetalleHuesped_edad CHECK (edad IS NULL OR edad >= 0),
    CONSTRAINT FK_DetalleHuesped_Reserva
        FOREIGN KEY (id_reserva) REFERENCES dbo.Reserva(id_reserva)
);
GO



CREATE INDEX IX_Usuario_id_rol ON dbo.Usuario(id_rol);

CREATE INDEX IX_Hospedaje_anfitrion ON dbo.Hospedaje(id_usuario_anfitrion);
CREATE INDEX IX_Hospedaje_ubicacion ON dbo.Hospedaje(id_ubicacion);
CREATE INDEX IX_Hospedaje_tipo ON dbo.Hospedaje(id_tipo_hospedaje);
CREATE INDEX IX_Hospedaje_estado ON dbo.Hospedaje(id_estado_hospedaje);

CREATE INDEX IX_Actividad_hospedaje ON dbo.Actividad(id_hospedaje);
CREATE INDEX IX_Actividad_tipo ON dbo.Actividad(id_tipo_actividad);
CREATE INDEX IX_Actividad_ubicacion ON dbo.Actividad(id_ubicacion);

CREATE INDEX IX_Reserva_turista ON dbo.Reserva(id_usuario_turista);
CREATE INDEX IX_Reserva_hospedaje ON dbo.Reserva(id_hospedaje);
CREATE INDEX IX_Reserva_estado ON dbo.Reserva(id_estado_reserva);
CREATE INDEX IX_Reserva_fechas ON dbo.Reserva(fecha_ingreso, fecha_salida);

CREATE INDEX IX_Pago_usuario ON dbo.Pago(id_usuario_turista);
CREATE INDEX IX_Pago_metodo ON dbo.Pago(id_metodo_pago);

CREATE INDEX IX_Resena_hospedaje ON dbo.Resena(id_hospedaje);
CREATE INDEX IX_Resena_turista ON dbo.Resena(id_usuario_turista);

CREATE INDEX IX_DetalleHuesped_reserva ON dbo.DetalleHuesped(id_reserva);
GO

/* =========================================================
   5) DATOS BASE (catálogos mínimos)
   ========================================================= */
INSERT INTO dbo.Rol(nombre_rol, descripcion)
VALUES (N'Administrador', N'Administra la plataforma'),
       (N'Anfitrión',     N'Ofrece hospedajes/actividades'),
       (N'Turista',       N'Realiza reservas y reseñas');

INSERT INTO dbo.Region(nombre_region)
VALUES (N'Costa'), (N'Sierra'), (N'Oriente'), (N'Galae1pagos');

INSERT INTO dbo.EstadoHospedaje(nombre_estado)
VALUES (N'Activo'), (N'Inactivo');

INSERT INTO dbo.EstadoReserva(nombre_estado)
VALUES (N'Pendiente'), (N'Confirmada'), (N'Cancelada'), (N'Completada');

INSERT INTO dbo.TipoHospedaje(nombre_tipo, descripcion)
VALUES (N'Cabaña', N'Cabaña rural'),
       (N'Casa rural', N'Vivienda completa'),
       (N'Habitación', N'Habitación dentro de un hogar');

INSERT INTO dbo.TipoActividad(nombre_tipo, descripcion)
VALUES (N'Aventura', N'Actividades de aventura'),
       (N'Cultural', N'Experiencias culturales'),
       (N'Ecológica', N'Experiencias en naturaleza'),
       (N'Gastronómica', N'Comida y degustaciones');

INSERT INTO dbo.MetodoPago(nombre_metodo)
VALUES (N'Efectivo'), (N'Transferencia'), (N'Tarjeta');
GO
