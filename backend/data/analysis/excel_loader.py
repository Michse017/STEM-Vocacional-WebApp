import pandas as pd

EXCEL_PATH = "../DataProyecto#1.xlsx"

def main():
    # Cargar el archivo Excel
    xls = pd.ExcelFile(EXCEL_PATH)
    print("Número de hojas en el archivo:", len(xls.sheet_names))
    print("Lista de hojas:\n", xls.sheet_names)

    for sheet_name in xls.sheet_names:
        print("\n--- Hoja:", sheet_name, "---")
        df = pd.read_excel(EXCEL_PATH, sheet_name=sheet_name)
        print(f"Filas: {df.shape[0]}, Columnas: {df.shape[1]}")
        print("Columnas:", df.columns.tolist())
        print("\nPrimeras 3 filas:")
        print(df.head(3))
        print("\nÚltimas 3 filas:")
        print(df.tail(3))
        print("-" * 50)

if __name__ == "__main__":
    main()