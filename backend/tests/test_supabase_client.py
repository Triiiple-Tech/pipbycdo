import pytest
from unittest.mock import Mock, patch, MagicMock
from backend.services import supabase_client

class TestSupabaseClient:
    def test_supabase_client_module_exists(self) -> None:
        """Test supabase_client module exists"""
        assert supabase_client is not None
        
    @patch('backend.services.supabase_client.create_client')
    def test_get_supabase_client_success(self, mock_create_client: MagicMock) -> None:
        """Test successful client retrieval"""
        mock_client = Mock()
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            # Reset the global client
            supabase_client.supabase_client = mock_client
            
            client = supabase_client.get_supabase_client()
            assert client == mock_client
            
    def test_get_supabase_client_not_initialized(self) -> None:
        """Test error when client not initialized"""
        # Reset the global client to None
        supabase_client.supabase_client = None
        
        with pytest.raises(RuntimeError, match="Supabase client is not initialized"):
            supabase_client.get_supabase_client()
            
    @patch('backend.services.supabase_client.create_client')
    def test_client_initialization_with_env_vars(self, mock_create_client: MagicMock) -> None:
        """Test client initialization with environment variables"""
        mock_client = Mock()
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            # Reset client and call initialization
            supabase_client.supabase_client = None
            supabase_client.initialize_supabase_client()
            
            mock_create_client.assert_called_with(  # type: ignore[attr-defined]
                'https://test.supabase.co',
                'test_key'
            )
            
    @patch('backend.services.supabase_client.create_client')
    def test_initialization_failure_handling(self, mock_create_client: MagicMock) -> None:
        """Test handling of initialization failures"""
        mock_create_client.side_effect = Exception("Connection failed")
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            # Reset client and call initialization
            supabase_client.supabase_client = None
            supabase_client.initialize_supabase_client()
            
            # Client should be None after failed initialization
            assert supabase_client.supabase_client is None
            
    def test_initialization_without_env_vars(self) -> None:
        """Test initialization without environment variables"""
        with patch.dict('os.environ', {}, clear=True):
            # Reset client and call initialization
            supabase_client.supabase_client = None
            supabase_client.initialize_supabase_client()
            
            # Client should remain None when env vars are missing
            assert supabase_client.supabase_client is None
            
    @patch('backend.services.supabase_client.create_client')
    def test_raw_client_operations(self, mock_create_client: MagicMock) -> None:
        """Test that raw client operations work as expected"""
        mock_client = Mock()
        mock_table = Mock()
        mock_query = Mock()
        mock_response = Mock()
        
        # Set up mock chain: client.table().insert().execute()
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_query
        mock_query.execute.return_value = mock_response
        mock_response.data = [{"id": 1}]
        
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            # Reset client
            supabase_client.supabase_client = mock_client
            
            # Get client and perform operations like in the real code
            client = supabase_client.get_supabase_client()
            
            # Test table access and insert operation
            result = client.table("tasks").insert({"status": "pending"}).execute()  # type: ignore[attr-defined]
            
            assert result.data == [{"id": 1}]
            mock_client.table.assert_called_with("tasks")  # type: ignore[attr-defined]
            mock_table.insert.assert_called_with({"status": "pending"})  # type: ignore[attr-defined]
            
    def test_tasks_table_name_constant(self) -> None:
        """Test that TASKS_TABLE_NAME constant exists"""
        assert hasattr(supabase_client, 'TASKS_TABLE_NAME')
        assert supabase_client.TASKS_TABLE_NAME == "tasks"
