import pandas as pd
from fastapi.responses import FileResponse
import uuid

def generate_excel(data, report_type: str):

    df = pd.DataFrame(data)

    file_name = f"/tmp/{report_type}_{uuid.uuid4()}.xlsx"
    df.to_excel(file_name, index=False)

    return file_name
