from .models import Base
from .config import DATABASE_URL
from sqlalchemy import create_engine

def main():
    engine = create_engine(DATABASE_URL)
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(engine)
    print("¡Tablas creadas exitosamente!")

if __name__ == "__main__":
    main()