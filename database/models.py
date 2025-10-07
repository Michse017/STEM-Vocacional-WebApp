from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, UniqueConstraint, inspect, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Usuario(Base):
    """
    Tabla central que representa a un estudiante.
    """
    __tablename__ = 'usuarios'
    
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    codigo_estudiante = Column(String(20), unique=True, nullable=False, index=True)
    # Credenciales opcionales (admin pre-registra el código; el usuario luego define username/password)
    username = Column(String(64), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime)


# ============================
# Administración (MVP auth)
# ============================

class AdminUser(Base):
    __tablename__ = 'admin_users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('codigo', name='uq_admin_users_codigo'),
    )


# --- Schema guard for usuarios table ---
def ensure_user_schema(db_engine):
    """Ensure new auth columns exist and drop legacy 'finalizado'.

    Adds username, password_hash, created_at, updated_at, last_login_at if missing.
    Ensures filtered unique index on username (when not null).
    Drops column 'finalizado' if present.
    """
    try:
        print("[ensure_user_schema] Inspecting 'usuarios' table...")
        inspector = inspect(db_engine)
        cols = inspector.get_columns('usuarios')
        col_names = {c.get('name') or c.get('column_name') for c in cols}
        print(f"[ensure_user_schema] Existing columns: {sorted(col_names)}")
        with db_engine.begin() as conn:
            if 'username' not in col_names:
                print("[ensure_user_schema] Adding column username VARCHAR(64) NULL ...")
                conn.execute(text("ALTER TABLE dbo.usuarios ADD username VARCHAR(64) NULL"))
            if 'password_hash' not in col_names:
                print("[ensure_user_schema] Adding column password_hash VARCHAR(255) NULL ...")
                conn.execute(text("ALTER TABLE dbo.usuarios ADD password_hash VARCHAR(255) NULL"))
            if 'created_at' not in col_names:
                print("[ensure_user_schema] Adding column created_at DATETIME2 with default ...")
                conn.execute(text("ALTER TABLE dbo.usuarios ADD created_at DATETIME2 NULL CONSTRAINT DF_usuarios_created_at DEFAULT SYSUTCDATETIME()"))
            if 'updated_at' not in col_names:
                print("[ensure_user_schema] Adding column updated_at DATETIME2 with default ...")
                conn.execute(text("ALTER TABLE dbo.usuarios ADD updated_at DATETIME2 NULL CONSTRAINT DF_usuarios_updated_at DEFAULT SYSUTCDATETIME()"))
            if 'last_login_at' not in col_names:
                print("[ensure_user_schema] Adding column last_login_at DATETIME2 NULL ...")
                conn.execute(text("ALTER TABLE dbo.usuarios ADD last_login_at DATETIME2 NULL"))

            # Filtered unique index on username when not null
            print("[ensure_user_schema] Ensuring filtered unique index on username ...")
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_usuarios_username' AND object_id = OBJECT_ID('dbo.usuarios'))
                BEGIN
                    CREATE UNIQUE INDEX uq_usuarios_username ON dbo.usuarios(username) WHERE username IS NOT NULL;
                END
                """
            ))

            # Drop legacy column 'finalizado' if still present (handle default constraint on SQL Server)
            if 'finalizado' in col_names:
                print("[ensure_user_schema] Dropping legacy column 'finalizado' (and default constraint if any) ...")
                # Find and drop default constraint first
                row = conn.execute(text(
                    """
                    SELECT df.name AS df_name
                    FROM sys.default_constraints df
                    INNER JOIN sys.columns c ON c.default_object_id = df.object_id
                    INNER JOIN sys.tables t ON t.object_id = df.parent_object_id
                    WHERE t.name = 'usuarios' AND c.name = 'finalizado'
                    """
                )).first()
                if row and row[0]:
                    df_name = row[0]
                    conn.execute(text(f"ALTER TABLE dbo.usuarios DROP CONSTRAINT {df_name}"))
                conn.execute(text("ALTER TABLE dbo.usuarios DROP COLUMN finalizado"))
        print("[ensure_user_schema] Completed.")
    except Exception as e:
        # Non-fatal: print error for visibility
        try:
            import traceback; traceback.print_exc()
        except Exception:
            pass
        print(f"[ensure_user_schema] Skipped with error: {e}")