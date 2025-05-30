from backend.app.schemas import AppState, File
from backend.agents.base_agent import BaseAgent
from backend.services.utils.file_parser import MultimodalFileParser
from typing import Dict, Any


class FileReaderAgent(BaseAgent):
    """
    Agent responsible for reading and processing various file types.
    Uses the multimodal file parser for comprehensive file processing.
    """
    
    def __init__(self):
        super().__init__("file_reader")
        self.file_parser = MultimodalFileParser()
    
    def process(self, state: AppState) -> AppState:
        """Main processing method for the file reader agent."""
        
        self.log_interaction(state, "Starting file processing", "File Reader Agent invoked")
        
        # Initialize processed files content if not exists
        if state.processed_files_content is None:
            state.processed_files_content = {}
        
        # Check if there are files to process
        if not state.files or len(state.files) == 0:
            self.log_interaction(state, "No files to process", "No files found in state.files")
            return state
        
        self.log_interaction(state, f"Processing {len(state.files)} files", 
                           f"Found {len(state.files)} files to process")
        
        # Process each file
        for file_data in state.files:
            try:
                self._process_single_file(file_data, state)
            except Exception as e:
                error_msg = f"Error processing file {file_data.filename}: {str(e)}"
                self.log_interaction(state, f"File processing error: {file_data.filename}", 
                                   error_msg, level="error")
                # Store error info for this file
                if state.processed_files_content is None:
                    state.processed_files_content = {}
                state.processed_files_content[file_data.filename] = f"[Error processing file: {str(e)}]"
        
        # Log completion summary
        total_files = len(state.files)
        successful_files = len([f for f in state.processed_files_content.values() 
                               if not f.startswith("[Error")])
        
        self.log_interaction(state, "File processing complete", 
                           f"Processed {total_files} files. "
                           f"Success rate: {successful_files}/{total_files}")
        
        return state
    
    def _process_single_file(self, file_data: File, state: AppState) -> None:
        """Process a single file using the multimodal file parser."""
        
        file_name = file_data.filename
        file_content_bytes = file_data.data
        content_type = file_data.metadata.get('content_type', 'application/octet-stream')
        
        self.log_interaction(state, f"Processing file: {file_name}", 
                           f"Starting to process {file_name} (type: {content_type})")
        
        # Check if file content exists
        if file_content_bytes is None:
            error_msg = f"File {file_name} has no content"
            self.log_interaction(state, f"Missing content: {file_name}", error_msg, level="error")
            
            # Initialize processed_files_content if needed
            if state.processed_files_content is None:
                state.processed_files_content = {}
            state.processed_files_content[file_name] = f"[Error: File content is missing]"
            return
        
        try:
            # Use the multimodal file parser
            result = self.file_parser.parse_file(file_data, state.model_dump())
            
            if result.get('status') == 'success' or result.get('content'):
                # Store the extracted content
                content_header = f"Content of {file_name} (type: {content_type}):\n"
                extracted_content = result.get('content') or "[No extractable content]"
                
                # Initialize processed_files_content if needed
                if state.processed_files_content is None:
                    state.processed_files_content = {}
                state.processed_files_content[file_name] = content_header + extracted_content
                
                # Log success with metadata
                success_msg = f"Successfully processed {file_name}"
                metadata = result.get('metadata', {})
                if metadata.get("page_count"):
                    success_msg += f" ({metadata['page_count']} pages)"
                elif metadata.get("sheet_count"):
                    success_msg += f" ({metadata['sheet_count']} sheets)"
                
                self.log_interaction(state, f"File processed: {file_name}", success_msg)
                
                # Store additional metadata if available
                if metadata:
                    # Update file metadata with parsing results
                    if not file_data.metadata:
                        file_data.metadata = {}
                    file_data.metadata.update({
                        "parsed_metadata": metadata,
                        "processing_status": "success"
                    })
            else:
                # Handle parsing failure
                error_msg = f"Failed to parse {file_name}: {result.get('error', 'Unknown error')}"
                self.log_interaction(state, f"Parsing failed: {file_name}", error_msg, level="error")
                
                # Initialize processed_files_content if needed
                if state.processed_files_content is None:
                    state.processed_files_content = {}
                state.processed_files_content[file_name] = f"[Error extracting content: {result.get('error', 'Unknown error')}]"
                
                # Update file metadata with error info
                if not file_data.metadata:
                    file_data.metadata = {}
                file_data.metadata.update({
                    "processing_status": "failed",
                    "error": result.get('error', 'Unknown error')
                })
                
        except Exception as e:
            error_msg = f"Unexpected error processing {file_name}: {str(e)}"
            self.log_interaction(state, f"Processing error: {file_name}", error_msg, level="error")
            
            # Initialize processed_files_content if needed
            if state.processed_files_content is None:
                state.processed_files_content = {}
            state.processed_files_content[file_name] = f"[Error processing file: {str(e)}]"


# Create instance for backward compatibility
file_reader_agent = FileReaderAgent()

# Legacy handle function for existing code
def handle(state_dict: dict) -> dict:
    """Legacy handle function that uses the new FileReaderAgent class."""
    return file_reader_agent.handle(state_dict)
                        
