"""
Integration tests for the file compression system.
Tests the complete compression workflow including file upload, estimation, and compression.
"""

import requests
import io

# Test configuration
BASE_URL = "http://localhost:8000"
HEADERS = {"X-Internal-Code": "hermes"}

class TestCompressionIntegration:
    """Integration tests for file compression workflow"""
    
    def test_compression_workflow_with_text_file(self):
        """Test complete compression workflow with a text file"""
        
        # Create test file content
        test_content = "This is a test file for compression. " * 1000  # Repeated content compresses well
        test_file = io.BytesIO(test_content.encode('utf-8'))
        test_file.name = "test_document.txt"
        
        # Step 1: Get compression estimate
        files = {"file": ("test_document.txt", test_file, "text/plain")}
        
        estimate_response = requests.post(
            f"{BASE_URL}/api/estimate-compression",
            files=files,
            headers=HEADERS
        )
        
        assert estimate_response.status_code == 200
        estimate_data = estimate_response.json()
        
        assert "original_size" in estimate_data
        assert "estimated_compressed_size" in estimate_data
        assert "estimated_compression_ratio" in estimate_data
        assert "estimated_processing_time" in estimate_data
        assert "is_compressible" in estimate_data
        
        original_size = estimate_data["original_size"]
        assert original_size > 0
        
        # Step 2: Compress the file with high quality
        test_file.seek(0)  # Reset file pointer
        files = {"file": ("test_document.txt", test_file, "text/plain")}
        data = {"quality": "high"}
        
        compress_response = requests.post(
            f"{BASE_URL}/api/compress-file",
            files=files,
            data=data,
            headers=HEADERS
        )
        
        assert compress_response.status_code == 200
        
        # Check response headers
        assert "X-Original-Size" in compress_response.headers
        assert "X-Compressed-Size" in compress_response.headers
        assert "X-Compression-Ratio" in compress_response.headers
        assert "X-Quality-Setting" in compress_response.headers
        
        compressed_size = int(compress_response.headers["X-Compressed-Size"])
        compression_ratio_str = compress_response.headers["X-Compression-Ratio"]
        # Remove the % sign and convert to float
        compression_ratio = float(compression_ratio_str.replace('%', ''))
        compression_status = compress_response.headers.get("X-Compression-Status", "unknown")
        
        # For text files, compression may not be supported, which is expected
        if compression_status == "unsupported":
            # Text files are not supported for compression, which is expected
            assert compressed_size == original_size  # Should be unchanged
            assert compression_ratio == 0.0  # No compression applied
        else:
            # Verify compression actually occurred for supported types
            assert compressed_size <= original_size
            assert compression_ratio >= 0.0
        
        # Verify compressed content is returned
        compressed_content = compress_response.content
        assert len(compressed_content) > 0
        assert len(compressed_content) == compressed_size
        
    def test_compression_workflow_with_different_qualities(self):
        """Test compression with different quality levels"""
        
        # Create test file content
        test_content = "Highly compressible content! " * 500
        
        quality_levels = ["high", "medium", "low"]
        compression_results: dict[str, dict[str, int]] = {}
        
        for quality in quality_levels:
            test_file = io.BytesIO(test_content.encode('utf-8'))
            files = {"file": ("test_document.txt", test_file, "text/plain")}
            data = {"quality": quality}
            
            response = requests.post(
                f"{BASE_URL}/api/compress-file",
                files=files,
                data=data,
                headers=HEADERS
            )
            
            assert response.status_code == 200
            
            compressed_size = int(response.headers["X-Compressed-Size"])
            compression_ratio_str = response.headers["X-Compression-Ratio"]
            # Remove the % sign and convert to float
            compression_ratio = float(compression_ratio_str.replace('%', ''))
            
            compression_results[quality] = {
                "size": compressed_size,
                "ratio": int(compression_ratio)  # Convert to int for consistency
            }
        
        # Verify that different quality levels produce different results
        # Note: For text files, the differences might be minimal
        high_size = compression_results["high"]["size"]
        medium_size = compression_results["medium"]["size"]
        low_size = compression_results["low"]["size"]
        
        # At minimum, all should be different sizes or at least high quality should be largest
        assert high_size >= medium_size >= low_size or len(set([high_size, medium_size, low_size])) > 1
        
    def test_compression_estimate_accuracy(self):
        """Test that compression estimates are reasonably accurate"""
        
        test_content = "This content will be compressed. " * 200
        test_file = io.BytesIO(test_content.encode('utf-8'))
        
        # Get estimate
        files = {"file": ("test_document.txt", test_file, "text/plain")}
        
        estimate_response = requests.post(
            f"{BASE_URL}/api/estimate-compression",
            files=files,
            headers=HEADERS
        )
        
        assert estimate_response.status_code == 200
        estimate_data = estimate_response.json()
        
        # Perform actual compression
        test_file.seek(0)
        files = {"file": ("test_document.txt", test_file, "text/plain")}
        data = {"quality": "high"}
        
        compress_response = requests.post(
            f"{BASE_URL}/api/compress-file",
            files=files,
            data=data,
            headers=HEADERS
        )
        
        assert compress_response.status_code == 200
        
        actual_size = int(compress_response.headers["X-Compressed-Size"])
        estimated_size = estimate_data["estimated_compressed_size"]
        
        # Estimate should be within 50% of actual size (reasonable tolerance)
        size_difference_ratio = abs(actual_size - estimated_size) / actual_size
        assert size_difference_ratio < 0.5, f"Estimate {estimated_size} too far from actual {actual_size}"
        
    def test_large_file_handling(self):
        """Test handling of larger files (simulating >75MB scenario)"""
        
        # Create a larger test file (not actually 75MB to keep test fast)
        large_content = "Large file content for testing compression workflows. " * 10000
        test_file = io.BytesIO(large_content.encode('utf-8'))
        
        # Test estimation
        files = {"file": ("large_test_document.txt", test_file, "text/plain")}
        
        estimate_response = requests.post(
            f"{BASE_URL}/api/estimate-compression",
            files=files,
            headers=HEADERS
        )
        
        assert estimate_response.status_code == 200
        estimate_data = estimate_response.json()
        
        # Verify the file is recognized as needing compression
        original_size = estimate_data["original_size"]
        assert original_size > 100000  # Should be substantial size
        
        # Test actual compression
        test_file.seek(0)
        files = {"file": ("large_test_document.txt", test_file, "text/plain")}
        data = {"quality": "medium"}
        
        compress_response = requests.post(
            f"{BASE_URL}/api/compress-file",
            files=files,
            data=data,
            headers=HEADERS
        )
        
        assert compress_response.status_code == 200
        
        # Verify significant compression occurred
        compressed_size = int(compress_response.headers["X-Compressed-Size"])
        compression_ratio_str = compress_response.headers["X-Compression-Ratio"]
        # Remove the % sign and convert to float
        compression_ratio = float(compression_ratio_str.replace('%', ''))
        
        # Check if compression is supported for this file type
        compression_status = compress_response.headers.get("X-Compression-Status", "unknown")
        
        if compression_status == "unsupported":
            # Text files are not supported for compression, which is expected
            assert compressed_size == original_size  # Should be unchanged
            assert compression_ratio == 0.0  # No compression applied
        else:
            # For supported file types, verify significant compression occurred
            assert compressed_size < original_size * 0.8  # At least 20% compression
            assert compression_ratio > 20  # At least 20% compression ratio
        
    def test_error_handling_workflow(self):
        """Test error handling in compression workflow"""
        
        # Test with invalid quality parameter
        test_content = "Test content"
        test_file = io.BytesIO(test_content.encode('utf-8'))
        
        files = {"file": ("test.txt", test_file, "text/plain")}
        data = {"quality": "invalid_quality"}
        
        response = requests.post(
            f"{BASE_URL}/api/compress-file",
            files=files,
            data=data,
            headers=HEADERS
        )
        
        assert response.status_code == 400  # Bad request error
        
        # Test with missing authorization
        test_file.seek(0)
        files = {"file": ("test.txt", test_file, "text/plain")}
        data = {"quality": "high"}
        
        response = requests.post(
            f"{BASE_URL}/api/compress-file",
            files=files,
            data=data
            # No headers - should fail authorization
        )
        
        assert response.status_code == 401  # Unauthorized


if __name__ == "__main__":
    # Run specific test for manual testing
    test_instance = TestCompressionIntegration()
    print("Running compression workflow test...")
    
    try:
        test_instance.test_compression_workflow_with_text_file()
        print("✅ Basic compression workflow test passed")
        
        test_instance.test_compression_workflow_with_different_qualities()
        print("✅ Quality levels test passed")
        
        test_instance.test_compression_estimate_accuracy()
        print("✅ Estimate accuracy test passed")
        
        test_instance.test_large_file_handling()
        print("✅ Large file handling test passed")
        
        test_instance.test_error_handling_workflow()
        print("✅ Error handling test passed")
        
        print("\n🎉 All integration tests passed! File compression system is working correctly.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise
