"""
Servicios para el sistema dinámico de cuestionarios.
Contiene la lógica de negocio para crear, gestionar y procesar cuestionarios.
"""

import os
import sys
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import json
from datetime import datetime

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.models import (
    Cuestionario, Pregunta, OpcionPregunta, 
    RespuestaCuestionario, RespuestaUsuario, Usuario
)


class CuestionarioService:
    """Servicio para gestionar cuestionarios dinámicos."""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def crear_cuestionario(self, nombre: str, descripcion: str = None, tipo: str = None) -> Cuestionario:
        """Crea un nuevo cuestionario."""
        cuestionario = Cuestionario(
            nombre=nombre,
            descripcion=descripcion,
            tipo=tipo,
            activo=True
        )
        self.db.add(cuestionario)
        self.db.commit()
        self.db.refresh(cuestionario)
        return cuestionario
    
    def obtener_cuestionarios_activos(self) -> List[Cuestionario]:
        """Obtiene todos los cuestionarios activos."""
        return self.db.query(Cuestionario).filter(Cuestionario.activo == True).all()
    
    def obtener_cuestionario_por_id(self, id_cuestionario: int) -> Optional[Cuestionario]:
        """Obtiene un cuestionario por su ID."""
        return self.db.query(Cuestionario).filter(Cuestionario.id_cuestionario == id_cuestionario).first()
    
    def actualizar_cuestionario(self, id_cuestionario: int, **campos) -> Optional[Cuestionario]:
        """Actualiza los campos de un cuestionario."""
        cuestionario = self.obtener_cuestionario_por_id(id_cuestionario)
        if cuestionario:
            for campo, valor in campos.items():
                if hasattr(cuestionario, campo):
                    setattr(cuestionario, campo, valor)
            cuestionario.fecha_actualizacion = datetime.now()
            self.db.commit()
            self.db.refresh(cuestionario)
        return cuestionario
    
    def eliminar_cuestionario(self, id_cuestionario: int) -> bool:
        """Elimina un cuestionario (soft delete)."""
        cuestionario = self.obtener_cuestionario_por_id(id_cuestionario)
        if cuestionario:
            cuestionario.activo = False
            self.db.commit()
            return True
        return False


class PreguntaService:
    """Servicio para gestionar preguntas de cuestionarios."""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def crear_pregunta(self, id_cuestionario: int, texto: str, tipo_pregunta: str, 
                      requerida: bool = True, orden: int = None, auto_commit: bool = True, **kwargs) -> Pregunta:
        """Crea una nueva pregunta."""
        if orden is None:
            # Auto-asignar orden basado en preguntas existentes
            max_orden = self.db.query(Pregunta).filter(
                Pregunta.id_cuestionario == id_cuestionario
            ).count()
            orden = max_orden + 1
        
        pregunta = Pregunta(
            id_cuestionario=id_cuestionario,
            texto=texto,
            tipo_pregunta=tipo_pregunta,
            requerida=requerida,
            orden=orden,
            **kwargs
        )
        self.db.add(pregunta)
        
        if auto_commit:
            self.db.commit()
            self.db.refresh(pregunta)
        else:
            self.db.flush()  # Solo flush para obtener el ID sin commit
            self.db.refresh(pregunta)
            
        return pregunta
    
    def obtener_preguntas_cuestionario(self, id_cuestionario: int) -> List[Pregunta]:
        """Obtiene todas las preguntas de un cuestionario ordenadas."""
        return self.db.query(Pregunta).filter(
            Pregunta.id_cuestionario == id_cuestionario
        ).order_by(Pregunta.orden).all()
    
    def crear_opcion_pregunta(self, id_pregunta: int, texto: str, valor: str = None, orden: int = None, auto_commit: bool = True) -> OpcionPregunta:
        """Crea una opción para una pregunta de selección."""
        if orden is None:
            max_orden = self.db.query(OpcionPregunta).filter(
                OpcionPregunta.id_pregunta == id_pregunta
            ).count()
            orden = max_orden + 1
        
        if valor is None:
            valor = texto
        
        opcion = OpcionPregunta(
            id_pregunta=id_pregunta,
            texto=texto,
            valor=valor,
            orden=orden
        )
        self.db.add(opcion)
        
        if auto_commit:
            self.db.commit()
            self.db.refresh(opcion)
        else:
            self.db.flush()  # Solo flush para obtener el ID sin commit
            self.db.refresh(opcion)
            
        return opcion
    
    def obtener_pregunta(self, id_pregunta: int) -> Pregunta:
        """Obtiene una pregunta específica por ID."""
        return self.db.query(Pregunta).filter(Pregunta.id_pregunta == id_pregunta).first()
    
    def actualizar_pregunta(self, id_pregunta: int, texto: str = None, tipo_pregunta: str = None, 
                           requerida: bool = None, orden: int = None, **kwargs) -> Pregunta:
        """Actualiza una pregunta existente."""
        pregunta = self.obtener_pregunta(id_pregunta)
        if not pregunta:
            return None
        
        if texto is not None:
            pregunta.texto = texto
        if tipo_pregunta is not None:
            pregunta.tipo_pregunta = tipo_pregunta
        if requerida is not None:
            pregunta.requerida = requerida
        if orden is not None:
            pregunta.orden = orden
        
        # Actualizar campos adicionales si se proporcionan
        for key, value in kwargs.items():
            if hasattr(pregunta, key) and value is not None:
                setattr(pregunta, key, value)
        
        self.db.commit()
        self.db.refresh(pregunta)
        return pregunta
    
    def eliminar_pregunta(self, id_pregunta: int) -> bool:
        """Elimina una pregunta y todas sus opciones asociadas."""
        pregunta = self.obtener_pregunta(id_pregunta)
        if not pregunta:
            return False
        
        # Primero eliminar todas las opciones asociadas
        self.db.query(OpcionPregunta).filter(OpcionPregunta.id_pregunta == id_pregunta).delete()
        
        # Luego eliminar la pregunta
        self.db.delete(pregunta)
        self.db.commit()
        return True
    
    def obtener_opciones_pregunta(self, id_pregunta: int) -> List[OpcionPregunta]:
        """Obtiene todas las opciones de una pregunta."""
        return self.db.query(OpcionPregunta).filter(
            OpcionPregunta.id_pregunta == id_pregunta
        ).order_by(OpcionPregunta.orden).all()
    
    def eliminar_opciones_pregunta(self, id_pregunta: int) -> bool:
        """Elimina todas las opciones de una pregunta."""
        count = self.db.query(OpcionPregunta).filter(OpcionPregunta.id_pregunta == id_pregunta).delete()
        self.db.commit()
        return count > 0


class RespuestaService:
    """Servicio para gestionar respuestas de usuarios a cuestionarios."""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def iniciar_cuestionario(self, id_usuario: int, id_cuestionario: int) -> RespuestaCuestionario:
        """Inicia un cuestionario para un usuario."""
        # Verificar si ya existe una respuesta
        respuesta_existente = self.db.query(RespuestaCuestionario).filter(
            and_(
                RespuestaCuestionario.id_usuario == id_usuario,
                RespuestaCuestionario.id_cuestionario == id_cuestionario
            )
        ).first()
        
        if respuesta_existente:
            return respuesta_existente
        
        respuesta_cuestionario = RespuestaCuestionario(
            id_usuario=id_usuario,
            id_cuestionario=id_cuestionario,
            completado=False
        )
        self.db.add(respuesta_cuestionario)
        self.db.commit()
        self.db.refresh(respuesta_cuestionario)
        return respuesta_cuestionario
    
    def guardar_respuesta(self, id_respuesta_cuestionario: int, id_pregunta: int, valor: Any) -> RespuestaUsuario:
        """Guarda la respuesta de un usuario a una pregunta específica."""
        # Convertir valor a string si es necesario
        if isinstance(valor, (list, dict)):
            valor_str = json.dumps(valor)
        else:
            valor_str = str(valor)
        
        # Verificar si ya existe una respuesta para esta pregunta
        respuesta_existente = self.db.query(RespuestaUsuario).filter(
            and_(
                RespuestaUsuario.id_respuesta_cuestionario == id_respuesta_cuestionario,
                RespuestaUsuario.id_pregunta == id_pregunta
            )
        ).first()
        
        if respuesta_existente:
            respuesta_existente.valor_respuesta = valor_str
            respuesta_existente.fecha_respuesta = datetime.now()
            self.db.commit()
            return respuesta_existente
        
        respuesta = RespuestaUsuario(
            id_respuesta_cuestionario=id_respuesta_cuestionario,
            id_pregunta=id_pregunta,
            valor_respuesta=valor_str
        )
        self.db.add(respuesta)
        self.db.commit()
        self.db.refresh(respuesta)
        return respuesta
    
    def completar_cuestionario(self, id_respuesta_cuestionario: int) -> bool:
        """Marca un cuestionario como completado."""
        respuesta_cuestionario = self.db.query(RespuestaCuestionario).filter(
            RespuestaCuestionario.id_respuesta_cuestionario == id_respuesta_cuestionario
        ).first()
        
        if respuesta_cuestionario:
            respuesta_cuestionario.completado = True
            respuesta_cuestionario.fecha_completado = datetime.now()
            self.db.commit()
            return True
        return False
    
    def obtener_respuestas_usuario(self, id_usuario: int, id_cuestionario: int) -> Optional[Dict]:
        """Obtiene todas las respuestas de un usuario para un cuestionario."""
        respuesta_cuestionario = self.db.query(RespuestaCuestionario).filter(
            and_(
                RespuestaCuestionario.id_usuario == id_usuario,
                RespuestaCuestionario.id_cuestionario == id_cuestionario
            )
        ).first()
        
        if not respuesta_cuestionario:
            return None
        
        respuestas = self.db.query(RespuestaUsuario).filter(
            RespuestaUsuario.id_respuesta_cuestionario == respuesta_cuestionario.id_respuesta_cuestionario
        ).all()
        
        return {
            'cuestionario_info': {
                'id_respuesta_cuestionario': respuesta_cuestionario.id_respuesta_cuestionario,
                'completado': respuesta_cuestionario.completado,
                'fecha_inicio': respuesta_cuestionario.fecha_inicio,
                'fecha_completado': respuesta_cuestionario.fecha_completado
            },
            'respuestas': {
                str(resp.id_pregunta): resp.valor_respuesta for resp in respuestas
            }
        }