from .config import DATABASE_URL
from sqlalchemy import create_engine, inspect

def main():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    print("Tablas existentes en la base de datos:")
    for table_name in inspector.get_table_names():
        print(f"\nTabla: {table_name}")
        columns = inspector.get_columns(table_name)
        for col in columns:
            print(f"  - {col['name']}: {col['type']} (nullable={col['nullable']})")
        print("-" * 40)

if __name__ == "__main__":
    main()