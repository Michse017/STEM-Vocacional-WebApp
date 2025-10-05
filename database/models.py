from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, UniqueConstraint
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
    # Deprecated: estado de finalización a nivel de usuario (reemplazado por assignments dinámicos)
    finalizado = Column(Boolean, nullable=False, default=False)


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