import React from 'react';
import { clearCache, getCacheStats, getCurrentModelInfo, manuallySwitchModel, resetToFirstModel } from '../services/geminiService';

interface CacheManagerProps {
  className?: string;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ className = '' }) => {
  const [stats, setStats] = React.useState({ totalEntries: 0, validEntries: 0, expiredEntries: 0 });
  const [modelInfo, setModelInfo] = React.useState(getCurrentModelInfo());
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  const updateStats = React.useCallback(() => {
    const currentStats = getCacheStats();
    const currentModelInfo = getCurrentModelInfo();
    setStats(currentStats);
    setModelInfo(currentModelInfo);
    setLastUpdated(new Date());
  }, []);

  const handleClearCache = React.useCallback(() => {
    clearCache();
    updateStats();
  }, [updateStats]);

  const handleSwitchModel = React.useCallback((modelIndex: number) => {
    manuallySwitchModel(modelIndex);
    updateStats();
  }, [updateStats]);

  const handleResetModel = React.useCallback(() => {
    resetToFirstModel();
    updateStats();
  }, [updateStats]);

  React.useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <div className={`cache-manager ${className}`}>
      <div className="cache-stats">
        <h4>Cache & Model Statistics</h4>
        
        {/* Model Information */}
        <div className="model-section">
          <h5>Current Model</h5>
          <div className="model-info">
            <div className="model-current">
              <span className="model-label">Active:</span>
              <span className="model-value">{modelInfo.currentModel}</span>
            </div>
            <div className="model-position">
              <span className="model-label">Position:</span>
              <span className="model-value">{modelInfo.currentIndex + 1}/{modelInfo.totalModels}</span>
            </div>
          </div>
          
          <div className="model-actions">
            <select 
              value={modelInfo.currentIndex}
              onChange={(e) => handleSwitchModel(Number(e.target.value))}
              className="model-selector"
            >
              {modelInfo.availableModels.map((model, index) => (
                <option key={model} value={index}>
                  {model} {index === modelInfo.currentIndex ? '(Current)' : ''}
                </option>
              ))}
            </select>
            <button 
              onClick={handleResetModel}
              className="reset-model-btn"
              title="Reset to first model"
            >
              Reset Model
            </button>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="cache-section">
          <h5>Cache Statistics</h5>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Entries:</span>
              <span className="stat-value">{stats.totalEntries}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Valid Entries:</span>
              <span className="stat-value">{stats.validEntries}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expired Entries:</span>
              <span className="stat-value">{stats.expiredEntries}</span>
            </div>
          </div>
          <div className="cache-actions">
            <button 
              onClick={handleClearCache}
              className="clear-cache-btn"
              title="Clear all cached API responses"
            >
              Clear Cache
            </button>
            <button 
              onClick={updateStats}
              className="refresh-stats-btn"
              title="Refresh cache statistics"
            >
              Refresh Stats
            </button>
          </div>
        </div>
        
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
      
      <style jsx>{`
        .cache-manager {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          font-size: 14px;
        }
        
        .cache-stats h4 {
          margin: 0 0 12px 0;
          color: #495057;
          font-size: 16px;
        }
        
        .cache-stats h5 {
          margin: 0 0 8px 0;
          color: #495057;
          font-size: 14px;
          font-weight: 600;
        }
        
        .model-section, .cache-section {
          margin-bottom: 20px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }
        
        .model-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .model-current, .model-position {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .model-label {
          font-weight: 500;
          color: #6c757d;
        }
        
        .model-value {
          font-weight: bold;
          color: #495057;
        }
        
        .model-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .model-selector {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 12px;
          background: white;
        }
        
        .reset-model-btn {
          padding: 6px 12px;
          border: 1px solid #ffc107;
          background: #ffc107;
          color: #212529;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .reset-model-btn:hover {
          background: #e0a800;
          border-color: #e0a800;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }
        
        .stat-label {
          font-weight: 500;
          color: #6c757d;
        }
        
        .stat-value {
          font-weight: bold;
          color: #495057;
        }
        
        .cache-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .clear-cache-btn, .refresh-stats-btn {
          padding: 6px 12px;
          border: 1px solid #dc3545;
          background: #dc3545;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .clear-cache-btn:hover {
          background: #c82333;
          border-color: #c82333;
        }
        
        .refresh-stats-btn {
          border-color: #007bff;
          background: #007bff;
        }
        
        .refresh-stats-btn:hover {
          background: #0056b3;
          border-color: #0056b3;
        }
        
        .last-updated {
          font-size: 12px;
          color: #6c757d;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
