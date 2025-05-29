import pytest
from unittest.mock import Mock, patch, AsyncMock
from backend.services import supabase_client

class TestSupabaseClient:
    def test_supabase_client_module_exists(self):
        """Test supabase_client module exists"""
        assert supabase_client is not None
        
    @patch('backend.services.supabase_client.create_client')
    def test_get_supabase_client_success(self, mock_create_client):
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
            
    def test_get_supabase_client_not_initialized(self):
        """Test error when client not initialized"""
        # Reset the global client to None
        supabase_client.supabase_client = None
        
        with pytest.raises(RuntimeError, match="Supabase client is not initialized"):
            supabase_client.get_supabase_client()
            
    @patch('backend.services.supabase_client.create_client')
    def test_client_initialization_with_env_vars(self, mock_create_client):
        """Test client initialization with environment variables"""
        mock_client = Mock()
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            # Reload the module to trigger initialization
            import importlib
            importlib.reload(supabase_client)
            
            mock_create_client.assert_called_with(
                'https://test.supabase.co',
                'test_key'
            )
            
            result = client.insert_project(project_data)
            
            assert result is not None
            mock_client.table.assert_called_with("projects")
            mock_table.insert.assert_called_with(project_data)
            
    @patch('utils.supabase_client.create_client')
    def test_insert_takeoff_data(self, mock_create_client):
        """Test inserting takeoff data"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value.execute.return_value = Mock(data=[{"id": 1}])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            takeoff_data = [
                {
                    "project_id": 1,
                    "description": "Electrical outlet",
                    "quantity": 25,
                    "unit": "each",
                    "trade": "electrical"
                }
            ]
            
            result = client.insert_takeoff_items(takeoff_data)
            
            assert result is not None
            mock_client.table.assert_called_with("takeoff_items")
            
    @patch('utils.supabase_client.create_client')
    def test_query_projects(self, mock_create_client):
        """Test querying projects"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.select.return_value.execute.return_value = Mock(data=[
            {"id": 1, "name": "Test Project"}
        ])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            projects = client.get_projects()
            
            assert len(projects) == 1
            assert projects[0]["name"] == "Test Project"
            mock_client.table.assert_called_with("projects")
            
    @patch('utils.supabase_client.create_client')
    def test_query_project_by_id(self, mock_create_client):
        """Test querying specific project by ID"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.execute.return_value = Mock(data=[
            {"id": 1, "name": "Test Project"}
        ])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            project = client.get_project_by_id(1)
            
            assert project["name"] == "Test Project"
            mock_table.select.return_value.eq.assert_called_with("id", 1)
            
    @patch('utils.supabase_client.create_client')
    def test_update_project_data(self, mock_create_client):
        """Test updating project data"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.update.return_value.eq.return_value.execute.return_value = Mock(data=[
            {"id": 1, "name": "Updated Project"}
        ])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            update_data = {"name": "Updated Project"}
            result = client.update_project(1, update_data)
            
            assert result is not None
            mock_table.update.assert_called_with(update_data)
            mock_table.update.return_value.eq.assert_called_with("id", 1)
            
    @patch('utils.supabase_client.create_client')
    def test_delete_project(self, mock_create_client):
        """Test deleting project"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.delete.return_value.eq.return_value.execute.return_value = Mock(data=[])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            result = client.delete_project(1)
            
            assert result is not None
            mock_table.delete.return_value.eq.assert_called_with("id", 1)
            
    @patch('utils.supabase_client.create_client')
    def test_get_takeoff_items_by_project(self, mock_create_client):
        """Test getting takeoff items for a specific project"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.execute.return_value = Mock(data=[
            {"id": 1, "description": "Outlet", "quantity": 25}
        ])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            items = client.get_takeoff_items_by_project(1)
            
            assert len(items) == 1
            assert items[0]["description"] == "Outlet"
            mock_table.select.return_value.eq.assert_called_with("project_id", 1)
            
    @patch('utils.supabase_client.create_client')
    def test_connection_error_handling(self, mock_create_client):
        """Test handling of connection errors"""
        mock_create_client.side_effect = Exception("Connection failed")
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            with pytest.raises(Exception):
                client = SupabaseClient()
                
    @patch('utils.supabase_client.create_client')
    def test_database_operation_error_handling(self, mock_create_client):
        """Test handling of database operation errors"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.insert.side_effect = Exception("Database error")
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            project_data = {"name": "Test Project"}
            
            with pytest.raises(Exception):
                client.insert_project(project_data)
                
    @patch('utils.supabase_client.create_client')
    def test_batch_insert_takeoff_items(self, mock_create_client):
        """Test batch insertion of multiple takeoff items"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value.execute.return_value = Mock(data=[
            {"id": 1}, {"id": 2}, {"id": 3}
        ])
        mock_create_client.return_value = mock_client
        
        with patch.dict('os.environ', {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_KEY': 'test_key'
        }):
            client = SupabaseClient()
            
            takeoff_items = [
                {"description": "Item 1", "quantity": 10},
                {"description": "Item 2", "quantity": 20},
                {"description": "Item 3", "quantity": 30}
            ]
            
            result = client.batch_insert_takeoff_items(takeoff_items)
            
            assert len(result) == 3
            mock_table.insert.assert_called_with(takeoff_items)
