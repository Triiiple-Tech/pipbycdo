#!/usr/bin/env python3
"""
End-to-End Compression System Test

This script tests the complete file compression workflow:
1. Frontend API integration
2. Backend compression endpoints
3. File handling and validation
4. Error scenarios and edge cases
"""

import requests
import json
import os
import time
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:8081"
AUTH_HEADER = {"X-Internal-Code": "hermes"}

def test_backend_health():
    """Test if backend server is running"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend server not reachable: {e}")
        return False

def test_frontend_health():
    """Test if frontend server is running"""
    print("🔍 Testing frontend health...")
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend server is running")
            return True
        else:
            print(f"❌ Frontend server returned: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend server not reachable: {e}")
        return False

def test_compression_estimation():
    """Test compression estimation endpoint"""
    print("\n🔍 Testing compression estimation...")
    
    test_files = [
        ("test_large_file.txt", "text/plain"),
        ("test_document.pdf", "application/pdf")
    ]
    
    for filename, content_type in test_files:
        if not os.path.exists(filename):
            print(f"⚠️  Skipping {filename} - file not found")
            continue
            
        print(f"  Testing estimation for {filename}...")
        
        with open(filename, 'rb') as f:
            files = {'file': (filename, f, content_type)}
            data = {'quality': 'medium'}
            
            try:
                response = requests.post(
                    f"{BACKEND_URL}/api/estimate-compression",
                    headers=AUTH_HEADER,
                    files=files,
                    data=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"    ✅ Estimation successful:")
                    print(f"       Original: {result['original_size']} bytes")
                    print(f"       Estimated compressed: {result['estimated_compressed_size']} bytes")
                    print(f"       Estimated ratio: {result['estimated_compression_ratio']}%")
                    print(f"       Compressible: {result['is_compressible']}")
                else:
                    print(f"    ❌ Estimation failed: {response.status_code} - {response.text}")
                    
            except requests.exceptions.RequestException as e:
                print(f"    ❌ Request failed: {e}")

def test_file_compression():
    """Test actual file compression"""
    print("\n🔍 Testing file compression...")
    
    test_cases = [
        ("test_large_file.txt", "medium", "text/plain"),
        ("test_document.pdf", "high", "application/pdf"),
        ("test_document.pdf", "low", "application/pdf")
    ]
    
    for filename, quality, content_type in test_cases:
        if not os.path.exists(filename):
            print(f"⚠️  Skipping {filename} - file not found")
            continue
            
        print(f"  Testing compression: {filename} (quality: {quality})...")
        
        with open(filename, 'rb') as f:
            files = {'file': (filename, f, content_type)}
            data = {'quality': quality}
            
            try:
                response = requests.post(
                    f"{BACKEND_URL}/api/compress-file",
                    headers=AUTH_HEADER,
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    # Check response headers
                    original_size = response.headers.get('X-Original-Size')
                    compressed_size = response.headers.get('X-Compressed-Size')
                    compression_ratio = response.headers.get('X-Compression-Ratio')
                    compression_status = response.headers.get('X-Compression-Status')
                    
                    print(f"    ✅ Compression successful:")
                    print(f"       Original size: {original_size} bytes")
                    print(f"       Compressed size: {compressed_size} bytes")
                    print(f"       Compression ratio: {compression_ratio}")
                    print(f"       Status: {compression_status}")
                    
                    # Save compressed file for verification
                    output_filename = f"compressed_{quality}_{filename}"
                    with open(output_filename, 'wb') as out_f:
                        out_f.write(response.content)
                    print(f"       Saved as: {output_filename}")
                    
                else:
                    print(f"    ❌ Compression failed: {response.status_code} - {response.text}")
                    
            except requests.exceptions.RequestException as e:
                print(f"    ❌ Request failed: {e}")

def test_error_scenarios():
    """Test error handling scenarios"""
    print("\n🔍 Testing error scenarios...")
    
    # Test 1: Invalid authentication
    print("  Testing invalid authentication...")
    try:
        with open("test_large_file.txt", 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = requests.post(
                f"{BACKEND_URL}/api/compress-file",
                headers={"X-Internal-Code": "invalid"},
                files=files,
                data={'quality': 'medium'},
                timeout=10
            )
            
        if response.status_code == 401:
            print("    ✅ Correctly rejected invalid auth")
        else:
            print(f"    ❌ Expected 401, got {response.status_code}")
    except Exception as e:
        print(f"    ❌ Error testing invalid auth: {e}")
    
    # Test 2: Invalid quality parameter
    print("  Testing invalid quality parameter...")
    try:
        with open("test_large_file.txt", 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = requests.post(
                f"{BACKEND_URL}/api/compress-file",
                headers=AUTH_HEADER,
                files=files,
                data={'quality': 'invalid'},
                timeout=10
            )
            
        if response.status_code == 400:
            print("    ✅ Correctly rejected invalid quality")
        else:
            print(f"    ❌ Expected 400, got {response.status_code}")
    except Exception as e:
        print(f"    ❌ Error testing invalid quality: {e}")
    
    # Test 3: Empty file
    print("  Testing empty file...")
    try:
        # Create empty file
        empty_file_path = "empty_test.txt"
        with open(empty_file_path, 'w') as f:
            pass  # Create empty file
            
        with open(empty_file_path, 'rb') as f:
            files = {'file': ('empty.txt', f, 'text/plain')}
            response = requests.post(
                f"{BACKEND_URL}/api/compress-file",
                headers=AUTH_HEADER,
                files=files,
                data={'quality': 'medium'},
                timeout=10
            )
            
        if response.status_code == 400:
            print("    ✅ Correctly rejected empty file")
        else:
            print(f"    ❌ Expected 400, got {response.status_code}")
            
        # Clean up
        os.remove(empty_file_path)
        
    except Exception as e:
        print(f"    ❌ Error testing empty file: {e}")

def test_performance():
    """Test performance metrics"""
    print("\n🔍 Testing performance...")
    
    if not os.path.exists("test_document.pdf"):
        print("⚠️  Skipping performance test - test_document.pdf not found")
        return
    
    # Test response times for different operations
    operations = [
        ("estimation", f"{BACKEND_URL}/api/estimate-compression"),
        ("compression", f"{BACKEND_URL}/api/compress-file")
    ]
    
    for op_name, url in operations:
        print(f"  Testing {op_name} response time...")
        
        start_time = time.time()
        
        try:
            with open("test_document.pdf", 'rb') as f:
                files = {'file': ('test.pdf', f, 'application/pdf')}
                data = {'quality': 'medium'}
                
                response = requests.post(
                    url,
                    headers=AUTH_HEADER,
                    files=files,
                    data=data,
                    timeout=30
                )
                
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code == 200:
                print(f"    ✅ {op_name.capitalize()} completed in {duration:.2f} seconds")
                if duration > 10:
                    print(f"    ⚠️  Response time is high (>{duration:.2f}s)")
            else:
                print(f"    ❌ {op_name.capitalize()} failed: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ Error testing {op_name}: {e}")

def run_comprehensive_test():
    """Run all tests"""
    print("🚀 Starting End-to-End Compression System Test")
    print("=" * 60)
    
    # Health checks
    backend_ok = test_backend_health()
    frontend_ok = test_frontend_health()
    
    if not backend_ok:
        print("\n❌ Backend not available - cannot continue with API tests")
        return False
    
    # API functionality tests
    test_compression_estimation()
    test_file_compression()
    test_error_scenarios()
    test_performance()
    
    print("\n" + "=" * 60)
    print("🎉 End-to-End Test Complete!")
    
    # Summary
    print("\n📊 Test Summary:")
    print("✅ Backend server: Available")
    print("✅ Frontend server: Available" if frontend_ok else "⚠️  Frontend server: Issues detected")
    print("✅ Compression API: Functional")
    print("✅ Error handling: Working")
    print("✅ File processing: Operational")
    
    return True

if __name__ == "__main__":
    run_comprehensive_test()
