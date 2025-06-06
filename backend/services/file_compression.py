# pipbycdo/backend/services/file_compression.py
"""
File compression service for the PIP AI application.
Supports compression of PDF, DOCX, XLSX, and image files to reduce file sizes.
"""

import io
import logging
from typing import Dict, Any, Union, Callable
from PIL import Image
from pypdf import PdfReader, PdfWriter
import zipfile
import tempfile

logger = logging.getLogger(__name__)

class FileCompressionService:
    """
    Service for compressing various file types to reduce size while maintaining quality.
    Supports PDF optimization, image compression, and archive creation for office documents.
    """
    
    # Compression quality settings
    QUALITY_SETTINGS: Dict[str, Dict[str, Union[int, str]]] = {
        "high": {"image_quality": 85, "pdf_quality": "high"},
        "medium": {"image_quality": 70, "pdf_quality": "medium"},
        "low": {"image_quality": 55, "pdf_quality": "low"}
    }
    
    def __init__(self):
        # Define the type for compress method: (bytes, str, Dict[str, Union[int, str]]) -> bytes
        self.supported_types: Dict[str, Callable[[bytes, str, Dict[str, Union[int, str]]], bytes]] = {
            'application/pdf': self._compress_pdf,
            'image/jpeg': self._compress_image,
            'image/jpg': self._compress_image,
            'image/png': self._compress_image,
            'image/gif': self._compress_image,
            'image/bmp': self._compress_image,
            'image/tiff': self._compress_image,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._compress_office_document,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': self._compress_office_document,
        }
    
    def compress_file(self, file_data: bytes, filename: str, content_type: str, 
                      quality: str = "medium") -> Dict[str, Any]:
        """
        Compress a file based on its type and return compressed data.
        
        Args:
            file_data: Original file data as bytes
            filename: Original filename
            content_type: MIME type of the file
            quality: Compression quality ("high", "medium", "low")
            
        Returns:
            Dictionary containing:
            - compressed_data: Compressed file data as bytes
            - original_size: Original file size in bytes
            - compressed_size: Compressed file size in bytes
            - compression_ratio: Percentage reduction in size
            - quality_used: Quality setting used
            - status: "success" or "error"
            - error: Error message if status is "error"
        """
        try:
            original_size = len(file_data)
            
            # Check if compression is supported for this file type
            if content_type not in self.supported_types:
                return {
                    "compressed_data": file_data,  # Return original if unsupported
                    "original_size": original_size,
                    "compressed_size": original_size,
                    "compression_ratio": 0.0,
                    "quality_used": quality,
                    "status": "unsupported",
                    "error": f"Compression not supported for {content_type}"
                }
            
            # Get quality settings
            quality_settings = self.QUALITY_SETTINGS.get(quality, self.QUALITY_SETTINGS["medium"])
            
            # Perform compression based on file type
            compressor = self.supported_types[content_type]
            compressed_data = compressor(file_data, filename, quality_settings)
            
            compressed_size = len(compressed_data)
            compression_ratio = ((original_size - compressed_size) / original_size) * 100
            
            logger.info(f"Compressed {filename}: {original_size} -> {compressed_size} bytes "
                       f"({compression_ratio:.1f}% reduction)")
            
            return {
                "compressed_data": compressed_data,
                "original_size": original_size,
                "compressed_size": compressed_size,
                "compression_ratio": compression_ratio,
                "quality_used": quality,
                "status": "success",
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error compressing file {filename}: {str(e)}", exc_info=True)
            return {
                "compressed_data": file_data,  # Return original on error
                "original_size": len(file_data),
                "compressed_size": len(file_data),
                "compression_ratio": 0.0,
                "quality_used": quality,
                "status": "error",
                "error": str(e)
            }
    
    def _compress_pdf(self, file_data: bytes, filename: str, quality_settings: Dict[str, Union[int, str]]) -> bytes:
        """Compress PDF files by optimizing images and removing unnecessary data."""
        try:
            # Read the PDF
            input_stream = io.BytesIO(file_data)
            reader = PdfReader(input_stream)
            writer = PdfWriter()
            
            # Copy pages with optimization
            for page in reader.pages:
                # Remove or compress images if needed
                writer.add_page(page)
            
            # Apply compression
            writer.compress_identical_objects()
            # Note: remove_duplication() method doesn't exist in pypdf
            # writer.remove_duplication()  # Removed - not available in current pypdf version
            
            # Write compressed PDF
            output_stream = io.BytesIO()
            writer.write(output_stream)
            
            return output_stream.getvalue()
            
        except Exception as e:
            logger.warning(f"PDF compression failed for {filename}: {str(e)}")
            # Return original if compression fails
            return file_data
    
    def _compress_image(self, file_data: bytes, filename: str, quality_settings: Dict[str, Union[int, str]]) -> bytes:
        """Compress image files by reducing quality and optimizing format."""
        try:
            # Open image
            input_stream = io.BytesIO(file_data)
            image = Image.open(input_stream)
            
            # Convert to RGB if necessary (for JPEG compression)
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            
            # Compress and save
            output_stream = io.BytesIO()
            
            # Determine format - prefer JPEG for photos, PNG for graphics
            format_to_use = "JPEG"
            if filename.lower().endswith('.png') and self._is_graphic_image(image):
                format_to_use = "PNG"
                image.save(output_stream, format=format_to_use, optimize=True)
            else:
                image.save(output_stream, format=format_to_use, 
                          quality=quality_settings["image_quality"], optimize=True)
            
            return output_stream.getvalue()
            
        except Exception as e:
            logger.warning(f"Image compression failed for {filename}: {str(e)}")
            return file_data
    
    def _compress_office_document(self, file_data: bytes, filename: str, quality_settings: Dict[str, Union[int, str]]) -> bytes:
        """
        Compress Office documents by creating an optimized ZIP archive.
        Office documents are already ZIP files, so we optimize the internal structure.
        """
        try:
            # Office documents are ZIP files internally
            # We can repack them with better compression
            input_stream = io.BytesIO(file_data)
            
            with tempfile.NamedTemporaryFile() as temp_file:
                # Extract and recompress with better settings
                with zipfile.ZipFile(input_stream, 'r') as source_zip:
                    with zipfile.ZipFile(temp_file.name, 'w', 
                                       compression=zipfile.ZIP_DEFLATED, 
                                       compresslevel=9) as target_zip:
                        for item in source_zip.infolist():
                            data = source_zip.read(item.filename)
                            
                            # Compress images within the document more aggressively
                            if item.filename.startswith('word/media/') or \
                               item.filename.startswith('xl/media/') or \
                               item.filename.endswith(('.jpg', '.jpeg', '.png')):
                                data = self._compress_embedded_image(data, quality_settings)
                            
                            target_zip.writestr(item, data)
                
                # Read the recompressed file
                temp_file.seek(0)
                return temp_file.read()
                
        except Exception as e:
            logger.warning(f"Office document compression failed for {filename}: {str(e)}")
            return file_data
    
    def _compress_embedded_image(self, image_data: bytes, quality_settings: Dict[str, Union[int, str]]) -> bytes:
        """Compress images embedded within office documents."""
        try:
            input_stream = io.BytesIO(image_data)
            image = Image.open(input_stream)
            
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            
            output_stream = io.BytesIO()
            image.save(output_stream, format="JPEG", 
                      quality=quality_settings["image_quality"], optimize=True)
            
            return output_stream.getvalue()
        except:
            # Return original if compression fails
            return image_data
    
    def _is_graphic_image(self, image: Image.Image) -> bool:
        """Determine if an image is likely a graphic/diagram vs a photo."""
        # Simple heuristic: count unique colors
        if image.mode == "P":  # Palette mode usually indicates graphics
            return True
        
        try:
            colors = image.getcolors(maxcolors=256)
            if colors and len(colors) < 64:  # Few colors = likely graphic
                return True
        except:
            pass
        
        return False
    
    def get_compression_estimate(self, file_size: int, content_type: str) -> Dict[str, Any]:
        """
        Estimate compression results without actually compressing the file.
        Useful for UI to show expected results.
        """
        estimates = {
            'application/pdf': {"ratio": 15, "time": 3},  # 15% reduction, 3 seconds
            'image/jpeg': {"ratio": 25, "time": 1},       # 25% reduction, 1 second
            'image/png': {"ratio": 30, "time": 1},        # 30% reduction, 1 second
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
                {"ratio": 10, "time": 2},  # 10% reduction, 2 seconds
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 
                {"ratio": 12, "time": 2},  # 12% reduction, 2 seconds
        }
        
        default_estimate = {"ratio": 5, "time": 2}
        estimate = estimates.get(content_type, default_estimate)
        
        estimated_compressed_size = int(file_size * (100 - estimate["ratio"]) / 100)
        
        return {
            "estimated_compression_ratio": estimate["ratio"],
            "estimated_compressed_size": estimated_compressed_size,
            "estimated_time_seconds": estimate["time"],
            "supported": content_type in self.supported_types
        }


# Create singleton instance
file_compression_service = FileCompressionService()
