import pytest
from typing import Dict, Any
from unittest.mock import patch, MagicMock
from backend.agents.file_reader_agent import handle
from backend.app.schemas import AppState


class TestFileReaderAgent:
    
    def test_handle_no_files(self) -> None:
        """Test handling when no files are provided."""
        state_dict: Dict[str, Any] = {
            "files": [],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content == {}
        assert len(result_state.agent_trace) > 0

    def test_handle_text_file(self) -> None:
        """Test handling a text file"""
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "test.txt",
                    "type": "text",
                    "data": b"This is test content",  # Use bytes data instead of content
                    "content": None,
                    "metadata": {"content_type": "text/plain"}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }

        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)

        assert result_state.processed_files_content is not None
        assert "test.txt" in result_state.processed_files_content
        assert "This is test content" in result_state.processed_files_content["test.txt"]
    
    def test_handle_missing_content(self) -> None:
        """Test handling when file has no content"""
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "empty.txt", 
                    "type": "text",
                    "data": None,  # No data provided
                    "content": None,
                    "metadata": {}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "empty.txt" in result_state.processed_files_content
        assert "[Error: File content is missing]" in result_state.processed_files_content["empty.txt"]

    @patch('backend.services.utils.file_parser.MultimodalFileParser.parse_file')
    def test_handle_pdf_file(self, mock_parse_file: MagicMock) -> None:
        """Test handling a PDF file"""
        mock_parse_file.return_value = {
            "content": "PDF content text",
            "status": "success",
            "metadata": {"pages": 5}
        }
        
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "test.pdf",
                    "type": "PDF",
                    "data": b"fake pdf content",  # Use data instead of content
                    "content": None,
                    "metadata": {"content_type": "application/pdf"}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.pdf" in result_state.processed_files_content
        mock_parse_file.assert_called_once()

    @patch('backend.services.utils.file_parser.MultimodalFileParser.parse_file')
    def test_handle_parse_error(self, mock_parse_file: MagicMock) -> None:
        """Test handling when file parsing fails"""
        mock_parse_file.side_effect = Exception("Parse error")
        
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "broken.pdf",
                    "type": "PDF", 
                    "data": b"broken pdf",
                    "content": None,
                    "metadata": {}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        # Should handle parse error gracefully
        assert result_state.processed_files_content is not None
        assert "broken.pdf" in result_state.processed_files_content
        assert "[Error processing file:" in result_state.processed_files_content["broken.pdf"]

    def test_handle_multiple_files(self) -> None:
        """Test handling multiple files"""        
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "file1.txt",
                    "type": "text",
                    "data": b"Content 1",
                    "content": None,
                    "metadata": {"content_type": "text/plain"}
                },
                {
                    "filename": "file2.txt",
                    "type": "text",
                    "data": b"Content 2",
                    "content": None,
                    "metadata": {"content_type": "text/plain"}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert len(result_state.processed_files_content) == 2
        assert "file1.txt" in result_state.processed_files_content
        assert "file2.txt" in result_state.processed_files_content

    @patch('backend.services.utils.file_parser.MultimodalFileParser.parse_file')
    def test_handle_docx_file(self, mock_parse_file: MagicMock) -> None:
        """Test handling a DOCX file"""
        mock_parse_file.return_value = {
            "content": "DOCX content text",
            "status": "success",
            "metadata": {"pages": 3}
        }
        
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "test.docx",
                    "type": "DOCX",
                    "data": b"fake docx content",
                    "content": None,
                    "metadata": {"content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        assert result_state.processed_files_content is not None
        assert "test.docx" in result_state.processed_files_content
        mock_parse_file.assert_called_once()

    def test_handle_unsupported_file_type(self) -> None:
        """Test handling unsupported file type"""
        state_dict: Dict[str, Any] = {
            "files": [
                {
                    "filename": "test.xyz",
                    "type": "UNKNOWN",
                    "data": b"Some content",
                    "content": None,
                    "metadata": {}
                }
            ],
            "processed_files_content": None,
            "agent_trace": [],
            "meeting_log": []
        }
        
        result: Dict[str, Any] = handle(state_dict)
        result_state = AppState(**result)
        
        # Should handle unsupported file type gracefully
        assert result_state.processed_files_content is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
