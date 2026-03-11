import pandas as pd
import uuid
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


# Brand colours (hex without #)
_HEADER_FILL  = "0B1F3A"   # navy
_ACCENT_FILL  = "E8911F"   # amber
_ALT_FILL     = "EEF4FB"   # pale blue


def _style_sheet(ws, header_row: int, n_cols: int, n_data_rows: int):
    """Apply branded styling to the data table in a worksheet."""
    thin = Side(style="thin", color="C8D8EF")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    for col_idx in range(1, n_cols + 1):
        cell = ws.cell(row=header_row, column=col_idx)
        cell.font      = Font(bold=True, color="FFFFFF", size=9)
        cell.fill      = PatternFill("solid", fgColor=_HEADER_FILL)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border    = border
        # auto-width hint
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = max(
            14, len(str(cell.value or "")) + 4
        )

    for row_idx in range(header_row + 1, header_row + 1 + n_data_rows):
        fill_hex = _ALT_FILL if (row_idx - header_row) % 2 == 0 else "FFFFFF"
        for col_idx in range(1, n_cols + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.fill      = PatternFill("solid", fgColor=fill_hex)
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border    = border
            cell.font      = Font(size=8)


def generate_excel(report_data: dict) -> str:
    file_name = f"/tmp/report_{uuid.uuid4()}.xlsx"

    title         = report_data.get("title", "Report")
    metadata      = report_data.get("metadata", {})
    table_section = report_data.get("table", {})
    headers       = table_section.get("headers", [])
    rows          = table_section.get("rows", [])

    # Convert all headers to strings (sitewise uses int day numbers)
    str_headers = [str(h) for h in headers]

    with pd.ExcelWriter(file_name, engine="openpyxl") as writer:
        sheet_name = "Report"

        current_row = 0  # 0-based for startrow

        # ── Title row ────────────────────────────────────────────
        title_df = pd.DataFrame([[title]], columns=[""])
        title_df.to_excel(writer, sheet_name=sheet_name,
                          index=False, header=False,
                          startrow=current_row)
        current_row += 2

        # ── Metadata section ─────────────────────────────────────
        if metadata:
            meta_df = pd.DataFrame(
                list(metadata.items()),
                columns=["Field", "Value"]
            )
            meta_df.to_excel(writer, sheet_name=sheet_name,
                             index=False, startrow=current_row)
            current_row += len(meta_df) + 3   # header + rows + gap

        # ── Data table ────────────────────────────────────────────
        if str_headers:
            # Ensure every row has the right number of columns
            n_cols = len(str_headers)
            safe_rows = []
            for row in rows:
                r = list(row)
                # pad or trim
                if len(r) < n_cols:
                    r += [""] * (n_cols - len(r))
                safe_rows.append(r[:n_cols])

            table_df = pd.DataFrame(safe_rows, columns=str_headers)
            table_df.to_excel(writer, sheet_name=sheet_name,
                              index=False, startrow=current_row)

            # Apply styling
            ws = writer.sheets[sheet_name]
            header_excel_row = current_row + 1   # openpyxl is 1-based
            _style_sheet(ws, header_excel_row, n_cols, len(safe_rows))

        # ── Global sheet tweaks ───────────────────────────────────
        ws = writer.sheets[sheet_name]

        # Style title cell
        title_cell = ws.cell(row=1, column=1)
        title_cell.font      = Font(bold=True, size=14, color=_HEADER_FILL)
        title_cell.alignment = Alignment(horizontal="left")

        # Freeze pane at first data row of the table
        ws.freeze_panes = ws.cell(row=current_row + 2, column=2)

    return file_name