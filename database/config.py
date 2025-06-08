import os

DB_USER = os.getenv("DB_USER", "stemuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "stem2025")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "stemvocacional")

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)