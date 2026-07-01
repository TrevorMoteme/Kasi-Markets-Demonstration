import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import Button from './Button';
import LoadingSpinner from '../common/LoadingSpinner';
import './ConnectionTest.css';

const ConnectionTest = () => {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('testing');

    try {
      const response = await apiService.get('/health');
      setResult({
        success: true,
        data: response,
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus('success');
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const testSupabase = async () => {
    setLoading(true);
    setStatus('testing_supabase');

    try {
      const response = await apiService.get('/debug/supabase');
      setResult({
        success: true,
        data: response,
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus('success');
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-test on component mount
    testConnection();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'testing':
      case 'testing_supabase':
        return '⏳';
      default:
        return '🔍';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Connected Successfully';
      case 'error':
        return 'Connection Failed';
      case 'testing':
        return 'Testing API Connection...';
      case 'testing_supabase':
        return 'Testing Supabase Connection...';
      default:
        return 'Ready to Test';
    }
  };

  return (
    <div className="connection-test">
      <div className="connection-test__header">
        <h3 className="connection-test__title">Connection Test</h3>
        <div className="connection-test__status">
          <span className="connection-test__status-icon">
            {getStatusIcon()}
          </span>
          <span className="connection-test__status-text">
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="connection-test__actions">
        <Button
          variant="outline"
          size="small"
          onClick={testConnection}
          loading={loading && status === 'testing'}
          disabled={loading}
        >
          Test API
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={testSupabase}
          loading={loading && status === 'testing_supabase'}
          disabled={loading}
        >
          Test Supabase
        </Button>
      </div>

      {result && (
        <div className="connection-test__result">
          <div className="connection-test__result-header">
            <span className="connection-test__result-timestamp">
              {result.timestamp}
            </span>
            <span className={`connection-test__result-badge ${result.success ? 'connection-test__result-badge--success' : 'connection-test__result-badge--error'}`}>
              {result.success ? 'SUCCESS' : 'ERROR'}
            </span>
          </div>

          <pre className="connection-test__result-data">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}

      {loading && (
        <div className="connection-test__loading">
          <LoadingSpinner size="small" />
          <span>Testing connection...</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
