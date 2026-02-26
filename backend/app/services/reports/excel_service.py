import pandas as pd
import uuid


def generate_excel(report_data):

    file_name = f"/tmp/report_{uuid.uuid4()}.xlsx"

    metadata = report_data.get("metadata", {})
    table_section = report_data.get("table", {})
    headers = table_section.get("headers", [])
    rows = table_section.get("rows", [])

    with pd.ExcelWriter(file_name, engine="openpyxl") as writer:

        current_row = 0

        # 🔹 Write Metadata
        if metadata:
            metadata_df = pd.DataFrame(
                list(metadata.items()),
                columns=["Field", "Value"]
            )

            metadata_df.to_excel(
                writer,
                index=False,
                startrow=current_row
            )

            current_row += len(metadata_df) + 2  # spacing

        # 🔹 Write Table (if exists)
        if headers:
            table_df = pd.DataFrame(rows, columns=headers)

            table_df.to_excel(
                writer,
                index=False,
                startrow=current_row
            )

    return file_name