import pytest
import io
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.fixture
def sample_pdf_content():
    """Create a simple PDF content for testing"""
    # This is a minimal PDF content (not a real PDF, just for testing)
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000109 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF"

@pytest.fixture
def sample_text_content():
    """Create simple text content for testing"""
    return b"This is a sample text file for compression testing. " * 100

def test_compress_file_endpoint_with_valid_headers():
    """Test the compress-file endpoint with valid internal code"""
    content = b"This is a test file content for compression"
    
    response = client.post(
        "/api/compress-file",
        headers={"X-Internal-Code": "hermes"},
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        data={"quality": "medium"}
    )
    
    assert response.status_code == 200
    assert "X-Original-Size" in response.headers
    assert "X-Compressed-Size" in response.headers
    assert "X-Compression-Ratio" in response.headers
    assert "X-Quality-Setting" in response.headers
    
    # Check that we get file content back
    compressed_content = response.content
    assert len(compressed_content) > 0

def test_compress_file_endpoint_unauthorized():
    """Test compression endpoint without proper authorization"""
    content = b"This is a test file content"
    
    response = client.post(
        "/api/compress-file",
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        data={"quality": "medium"}
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"

def test_compress_file_endpoint_invalid_quality():
    """Test compression endpoint with invalid quality setting"""
    content = b"This is a test file content"
    
    response = client.post(
        "/api/compress-file",
        headers={"X-Internal-Code": "hermes"},
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        data={"quality": "invalid"}
    )
    
    assert response.status_code == 400
    assert "Quality must be" in response.json()["detail"]

def test_compress_file_endpoint_empty_file():
    """Test compression endpoint with empty file"""
    response = client.post(
        "/api/compress-file",
        headers={"X-Internal-Code": "hermes"},
        files={"file": ("test.txt", io.BytesIO(b""), "text/plain")},
        data={"quality": "medium"}
    )
    
    assert response.status_code == 400
    assert "Empty file provided" in response.json()["detail"]

def test_estimate_compression_endpoint():
    """Test the estimate-compression endpoint"""
    content = b"This is a test file content for compression estimation"
    
    response = client.post(
        "/api/estimate-compression",
        headers={"X-Internal-Code": "hermes"},
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        data={"quality": "medium"}
    )
    
    assert response.status_code == 200
    
    result = response.json()
    assert "original_size" in result
    assert "estimated_compressed_size" in result
    assert "estimated_compression_ratio" in result
    assert "estimated_processing_time" in result
    assert "quality_setting" in result
    assert "is_compressible" in result
    
    assert result["original_size"] == len(content)
    assert result["quality_setting"] == "medium"

def test_estimate_compression_endpoint_unauthorized():
    """Test estimation endpoint without proper authorization"""
    content = b"This is a test file content"
    
    response = client.post(
        "/api/estimate-compression",
        files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        data={"quality": "medium"}
    )
    
    assert response.status_code == 401

def test_compress_file_different_quality_levels():
    """Test compression with different quality levels"""
    content = b"This is a test file content for compression" * 50
    
    for quality in ["high", "medium", "low"]:
        response = client.post(
            "/api/compress-file",
            headers={"X-Internal-Code": "hermes"},
            files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
            data={"quality": quality}
        )
        
        assert response.status_code == 200
        assert response.headers["X-Quality-Setting"] == quality
        
        # Verify headers contain numeric values
        original_size = int(response.headers["X-Original-Size"])
        compressed_size = int(response.headers["X-Compressed-Size"])
        
        assert original_size == len(content)
        assert compressed_size > 0
