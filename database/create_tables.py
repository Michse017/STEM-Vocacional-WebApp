from .models import Base
from .config import DATABASE_URL
from sqlalchemy import create_engine, text

def main():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # Ejecuta el schema.sql para crear/alterar tablas y restricciones
        print("Aplicando schema.sql (creación/alteración de tablas)...")
        with open("database/schema.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        for statement in sql.split(";"):
            stmt = statement.strip()
            if stmt:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    print(f"Error ejecutando statement:\n{stmt}\nError: {e}")
        print("¡Tablas y restricciones actualizadas!")
    # También crea las tablas con SQLAlchemy para sincronizar el modelo Python
    Base.metadata.create_all(engine)
    print("¡Tablas sincronizadas con SQLAlchemy!")

if __name__ == "__main__":
    main()