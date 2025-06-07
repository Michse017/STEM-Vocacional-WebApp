import pandas as pd
import os

EXCEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "DataProyecto#1.xlsx")
EXCEL_PATH = os.path.abspath(EXCEL_PATH)

# Cargar TODAS las hojas y unirlas en un DataFrame
all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)  # sheet_name=None devuelve un dict {hoja: DataFrame}
df = pd.concat(all_sheets.values(), ignore_index=True)

def authenticate_user(user_id):
    """Busca el ID en cualquier hoja del Excel, retorna dict de usuario si existe, si no retorna None."""
    user_row = df[df["Id"] == user_id]
    if not user_row.empty:
        return user_row.iloc[0].to_dict()
    return None