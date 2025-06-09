from .config import DATABASE_URL
from sqlalchemy import create_engine, inspect

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

for table in inspector.get_table_names():
    print(f"Restricciones en {table}:")
    for constraint in inspector.get_unique_constraints(table):
        print(f"  Unique: {constraint['name']} - Columnas: {constraint['column_names']}")
    for pk in inspector.get_pk_constraint(table).get('constrained_columns', []):
        print(f"  Primary Key: {pk}")
    for fk in inspector.get_foreign_keys(table):
        print(f"  ForeignKey: {fk['constrained_columns']} -> {fk['referred_table']}({fk['referred_columns']})")
    for check in inspector.get_check_constraints(table):
        print(f"  Check: {check['name']} - SQL: {check['sqltext']}")
    print("-" * 40)