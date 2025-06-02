import pytest
import io
from unittest.mock import Mock, patch
from backend.agents.file_reader_agent import handle
from backend.app.schemas import AppState, File


class TestFileReaderAgent:
    
    def test_handle_no_files(self):
        """Test handling when no files are provided."""
        state_dict = {
            "files": [],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content == {}
        assert len(result_state.agent_trace) > 0
        assert result_state.agent_trace[-1].agent == "file_reader"
    
    def test_handle_text_file(self):
        """Test handling plain text files."""
        test_content = "This is a test file content."
        
        state_dict = {
            "files": [
                {
                    "filename": "test.txt",
                    "data": test_content.encode('utf-8'),
                    "metadata": {"content_type": "text/plain"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.txt" in result_state.processed_files_content
        assert test_content in result_state.processed_files_content["test.txt"]
    
    def test_handle_missing_content(self):
        """Test handling files with missing content."""
        state_dict = {
            "files": [
                {
                    "filename": "empty.txt",
                    "data": None,
                    "metadata": {"content_type": "text/plain"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "empty.txt" in result_state.processed_files_content
        assert "Error: File content is missing" in result_state.processed_files_content["empty.txt"]
    
    @patch('backend.services.utils.file_parser.PdfReader')
    def test_handle_pdf_file_success(self, mock_pdf_reader):
        """Test successful PDF file processing."""
        # Mock PDF reader
        mock_page = Mock()
        mock_page.extract_text.return_value = "PDF content text"
        
        mock_reader = Mock()
        mock_reader.pages = [mock_page]
        
        mock_pdf_reader.return_value = mock_reader
        
        state_dict = {
            "files": [
                {
                    "filename": "test.pdf",
                    "data": b"fake_pdf_content",
                    "metadata": {"content_type": "application/pdf"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.pdf" in result_state.processed_files_content
        assert "PDF content text" in result_state.processed_files_content["test.pdf"]
    
    @patch('backend.services.utils.file_parser.docx')
    def test_handle_docx_file_success(self, mock_docx):
        """Test successful DOCX file processing."""
        # Mock DOCX document
        mock_para1 = Mock()
        mock_para1.text = "First paragraph"
        mock_para2 = Mock()
        mock_para2.text = "Second paragraph"
        
        mock_document = Mock()
        mock_document.paragraphs = [mock_para1, mock_para2]
        mock_document.tables = []
        
        mock_docx.Document.return_value = mock_document
        
        state_dict = {
            "files": [
                {
                    "filename": "test.docx",
                    "data": b"fake_docx_content",
                    "metadata": {"content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.docx" in result_state.processed_files_content
        assert "First paragraph" in result_state.processed_files_content["test.docx"]
        assert "Second paragraph" in result_state.processed_files_content["test.docx"]
    
    @patch('backend.services.utils.file_parser.load_workbook')
    def test_handle_xlsx_file_success(self, mock_load_workbook):
        """Test successful XLSX file processing."""
        # Mock worksheet
        mock_cell1 = Mock()
        mock_cell1.value = "Header1"
        mock_cell2 = Mock()
        mock_cell2.value = "Header2"
        mock_cell3 = Mock()
        mock_cell3.value = "Data1"
        mock_cell4 = Mock()
        mock_cell4.value = "Data2"
        
        mock_worksheet = Mock()
        mock_worksheet.max_row = 2
        mock_worksheet.max_column = 2
        
        def mock_cell(row, col):
            if row == 1 and col == 1:
                return mock_cell1
            elif row == 1 and col == 2:
                return mock_cell2
            elif row == 2 and col == 1:
                return mock_cell3
            elif row == 2 and col == 2:
                return mock_cell4
            else:
                empty_cell = Mock()
                empty_cell.value = None
                return empty_cell
        
        mock_worksheet.cell = mock_cell
        
        # Mock workbook
        mock_workbook = Mock()
        mock_workbook.sheetnames = ["Sheet1"]
        mock_workbook.__getitem__ = lambda self, key: mock_worksheet
        mock_workbook.close = Mock()
        
        mock_load_workbook.return_value = mock_workbook
        
        state_dict = {
            "files": [
                {
                    "filename": "test.xlsx",
                    "data": b"fake_xlsx_content",
                    "metadata": {"content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.xlsx" in result_state.processed_files_content
        assert "Header1" in result_state.processed_files_content["test.xlsx"]
        assert "Data1" in result_state.processed_files_content["test.xlsx"]
    
    def test_handle_unsupported_file_type(self):
        """Test handling unsupported file types."""
        state_dict = {
            "files": [
                {
                    "filename": "test.xyz",
                    "data": b"some_content",
                    "metadata": {"content_type": "application/unknown"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.xyz" in result_state.processed_files_content
        # Should still process as plain text since it has binary content
        assert len(result_state.processed_files_content["test.xyz"]) > 0
    
    @patch('backend.services.utils.file_parser.load_workbook')
    def test_xlsx_empty_sheet(self, mock_load_workbook):
        """Test XLSX extraction with empty sheet."""
        mock_cell = Mock()
        mock_cell.value = None
        
        mock_worksheet = Mock()
        mock_worksheet.max_row = 1
        mock_worksheet.max_column = 1
        mock_worksheet.cell.return_value = mock_cell
        
        mock_workbook = Mock()
        mock_workbook.sheetnames = ["EmptySheet"]
        mock_workbook.__getitem__ = lambda self, key: mock_worksheet
        mock_workbook.close = Mock()
        
        mock_load_workbook.return_value = mock_workbook
        
        state_dict = {
            "files": [
                {
                    "filename": "empty.xlsx",
                    "data": b"fake_content",
                    "metadata": {"content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "empty.xlsx" in result_state.processed_files_content
    
    @patch('backend.services.utils.file_parser.load_workbook', None)
    def test_xlsx_no_openpyxl(self):
        """Test XLSX extraction when openpyxl is not available."""
        state_dict = {
            "files": [
                {
                    "filename": "test.xlsx",
                    "data": b"fake_content",
                    "metadata": {"content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                }
            ],
            "processed_files_content": None
        }
        
        result = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.xlsx" in result_state.processed_files_content
        assert "openpyxl library not available" in result_state.processed_files_content["test.xlsx"]
