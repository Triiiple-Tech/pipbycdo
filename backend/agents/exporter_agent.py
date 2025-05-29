# pipbycdo/backend/agents/exporter_agent.py
import logging
import json # Added for JSON export
from typing import List # Added for type hinting
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry, EstimateItem # Use Pydantic models
from datetime import datetime, timezone
from io import BytesIO
from docx import Document
from openpyxl import Workbook
from fpdf import FPDF

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def log_interaction(state: AppState, decision: str, message: str, level: str = "info"):
    """Helper function to log agent interactions consistently."""
    timestamp = datetime.now(timezone.utc)
    
    state.agent_trace.append(AgentTraceEntry(
        agent="exporter",
        decision=decision,
        timestamp=timestamp,
        level=level if level == "error" else None, # Add level
        error=message if level == "error" else None # Add error message if applicable
    ))
    
    state.meeting_log.append(MeetingLogEntry(
        agent="exporter",
        message=message,
        timestamp=timestamp
    ))

    if level == "error":
        logger.error(f"Exporter Agent: {message} - Decision: {decision}")
    else:
        logger.info(f"Exporter Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp


def handle(state_dict: dict) -> dict: # Expect and return dict
    state = AppState(**state_dict) # Convert dict to Pydantic model
    log_interaction(state, "Starting export process", "Exporter Agent invoked.")

    # Determine export format from state.metadata or a dedicated field if added
    export_format = state.export_options.get("format", "json") if state.export_options else "json"


    if not state.estimate: # Check if the list of EstimateItem is empty
        error_msg = "Export failed: Missing estimate data to export."
        state.error = error_msg
        log_interaction(state, "Export failed due to missing estimate data", error_msg, level="error")
        return state.model_dump()

    try:
        estimate_items: List[EstimateItem] = state.estimate
        grand_total = sum(item.total for item in estimate_items)

        # Attempt to get project name from metadata
        project_name = state.metadata.get("project_name", "N/A")
        # Fallback to query if project_name is not in metadata or is "N/A"
        if project_name == "N/A" and state.query:
            project_name = state.query # Or a more sophisticated way to extract from query

        if export_format == "json":
            # Create a dictionary for the JSON export that includes items and grand_total
            export_data = {
                "project_name": project_name,
                "date": datetime.now(timezone.utc).isoformat(),
                "grand_total": grand_total,
                "items": [item.model_dump() for item in estimate_items]
            }
            state.exported_file_content = json.dumps(export_data, indent=2).encode('utf-8')
            state.exported_file_name = f"estimate_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.json"
            state.exported_content_type = "application/json"
            log_interaction(state, f"Prepared JSON export: {state.exported_file_name}", "Successfully prepared estimate for JSON export.")

        elif export_format == "docx":
            document = Document()
            document.add_heading('Estimate', 0)
            
            document.add_paragraph(f"Project: {project_name}")
            document.add_paragraph(f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')}")
            document.add_paragraph(f"Grand Total: ${grand_total:,.2f}")
            document.add_paragraph()

            if estimate_items:
                table = document.add_table(rows=1, cols=6)
                hdr_cells = table.rows[0].cells
                hdr_cells[0].text = 'Item'
                hdr_cells[1].text = 'Description'
                hdr_cells[2].text = 'Qty'
                hdr_cells[3].text = 'Unit'
                hdr_cells[4].text = 'Unit Price'
                hdr_cells[5].text = 'Total'

                for item in estimate_items:
                    row_cells = table.add_row().cells
                    row_cells[0].text = str(item.item)
                    row_cells[1].text = str(item.description or "")
                    row_cells[2].text = str(item.qty)
                    row_cells[3].text = str(item.unit)
                    row_cells[4].text = f"${item.unit_price:,.2f}"
                    row_cells[5].text = f"${item.total:,.2f}"
            else:
                document.add_paragraph("No items in estimate.")

            output = BytesIO()
            document.save(output)
            state.exported_file_content = output.getvalue()
            state.exported_file_name = f"estimate_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.docx"
            state.exported_content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            log_interaction(state, f"Prepared DOCX export: {state.exported_file_name}", "Successfully prepared estimate for DOCX export.")

        elif export_format == "pdf":
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", "B", 16)
            pdf.cell(0, 10, "Estimate", 0, 1, "C")

            pdf.set_font("Arial", "", 12)
            pdf.cell(0, 10, f"Project: {project_name}", 0, 1)
            pdf.cell(0, 10, f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')}", 0, 1)
            pdf.cell(0, 10, f"Grand Total: ${grand_total:,.2f}", 0, 1)
            pdf.ln(5)

            if estimate_items:
                pdf.set_font("Arial", "B", 10)
                col_widths = [30, 70, 15, 15, 30, 30] # Adjusted Item width
                headers = ['Item', 'Description', 'Qty', 'Unit', 'Unit Price', 'Total']
                for i, header in enumerate(headers):
                    pdf.cell(col_widths[i], 7, header, 1, 0, "C")
                pdf.ln()

                pdf.set_font("Arial", "", 9) # Slightly smaller font for items
                for item in estimate_items:
                    pdf.cell(col_widths[0], 6, str(item.item), 1)
                    pdf.cell(col_widths[1], 6, str(item.description or ""), 1)
                    pdf.cell(col_widths[2], 6, str(item.qty), 1, 0, "R")
                    pdf.cell(col_widths[3], 6, str(item.unit), 1)
                    pdf.cell(col_widths[4], 6, f"${item.unit_price:,.2f}", 1, 0, "R")
                    pdf.cell(col_widths[5], 6, f"${item.total:,.2f}", 1, 0, "R")
                    pdf.ln()
            else:
                pdf.cell(0, 10, "No items in estimate.", 0, 1)
            
            state.exported_file_content = pdf.output(dest='B')
            state.exported_file_name = f"estimate_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.pdf"
            state.exported_content_type = "application/pdf"
            log_interaction(state, f"Prepared PDF export: {state.exported_file_name}", "Successfully prepared estimate for PDF export.")

        elif export_format == "xlsx":
            workbook = Workbook()
            sheet = workbook.active
            if sheet is None: # Should not happen with a new Workbook()
                # Handle error or create sheet explicitly if necessary, though .active should provide one.
                # For robustness, one could do: if sheet is None: sheet = workbook.create_sheet("Estimate")
                # However, openpyxl's Workbook() constructor ensures there's an active sheet.
                raise Exception("Failed to get active sheet from new workbook.")
            sheet.title = "Estimate"
            
            sheet.append([f"Project: {project_name}"])
            sheet.append([f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')}"])
            sheet.append([f"Grand Total:", grand_total]) # Store grand_total as number
            sheet['B3'].number_format = '$#,##0.00' # Format grand total cell
            sheet.append([]) 

            if estimate_items:
                headers = ['Item', 'Description', 'Qty', 'Unit', 'Unit Price', 'Total']
                sheet.append(headers)

                for item in estimate_items:
                    sheet.append([
                        item.item,
                        item.description or "",
                        item.qty,
                        item.unit,
                        item.unit_price,
                        item.total
                    ])
                # Apply currency formatting to Unit Price and Total columns
                # Start from row 6 (1-based index) if headers are on row 5
                # Adjust if more header rows are added before data
                price_col_letter = 'E'
                total_col_letter = 'F'
                header_rows = 5 # Project, Date, Grand Total, Spacer, Headers
                for row_idx in range(header_rows + 1, sheet.max_row + 1):
                    sheet[f'{price_col_letter}{row_idx}'].number_format = '$#,##0.00'
                    sheet[f'{total_col_letter}{row_idx}'].number_format = '$#,##0.00'
            else:
                sheet.append(["No items in estimate."])
            
            output = BytesIO()
            workbook.save(output)
            state.exported_file_content = output.getvalue()
            state.exported_file_name = f"estimate_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.xlsx"
            state.exported_content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            log_interaction(state, f"Prepared XLSX export: {state.exported_file_name}", "Successfully prepared estimate for XLSX export.")

        else:
            unsupported_format_msg = f"Export format '{export_format}' is not supported."
            state.error = unsupported_format_msg
            log_interaction(state, f"Unsupported export format: {export_format}", unsupported_format_msg, level="error")
            # Optionally, default to JSON or do nothing
            # For now, we'll just log the error and not produce an export.

    except Exception as e:
        error_msg = f"Export failed during file generation: {str(e)}"
        state.error = error_msg
        log_interaction(state, "Export file generation error", error_msg, level="error")
        # Clear any partial export data if an error occurs
        state.exported_file_content = None
        state.exported_file_name = None
        state.exported_content_type = None
    
    log_interaction(state, "Export process complete", "Exporter Agent finished.")
    return state.model_dump()
