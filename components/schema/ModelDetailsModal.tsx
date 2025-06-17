import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Database, Calendar, User, Clock, TrendingUp, BarChart3, Activity, Zap } from 'lucide-react';

const ModelDetailsModal = ({ isOpen, onClose, model }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !model) return null;

  // Parse metrics safely
  const parseMetrics = (metricsString) => {
    if (!metricsString || metricsString.trim() === '') {
      return null;
    }
    
    try {
      return JSON.parse(metricsString);
    } catch (error) {
      console.error('Error parsing metrics:', error);
      return null;
    }
  };

  const metrics = parseMetrics(model.metrics);

  // Format algorithm name
  const formatAlgorithmName = (algorithm) => {
    const names = {
      'linear_regression': 'Linear Regression',
      'random_forest': 'Random Forest',
      'arima': 'ARIMA',
      'prophet': 'Prophet',
      'xgboost': 'XGBoost'
    };
    return names[algorithm] || algorithm;
  };

  // Get algorithm color
  const getAlgorithmColor = (algorithm) => {
    const colors = {
      'linear_regression': '#10b981',
      'random_forest': '#8b5cf6', 
      'arima': '#f59e0b',
      'prophet': '#ef4444',
      'xgboost': '#06b6d4'
    };
    return colors[algorithm] || '#6b7280';
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  // Format numeric values
  const formatMetricValue = (value, metricType) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'number') {
      // Handle very large or very small numbers
      if (Math.abs(value) >= 1e6 || (Math.abs(value) < 0.001 && value !== 0)) {
        return value.toExponential(3);
      }
      
      // Regular formatting
      if (metricType === 'r2' || metricType === 'accuracy') {
        return value.toFixed(4);
      }
      
      return value.toLocaleString(undefined, { 
        maximumFractionDigits: 2,
        minimumFractionDigits: 0 
      });
    }
    
    return value.toString();
  };

  // Get metric performance indicator
  const getMetricPerformance = (value, metricType) => {
    if (value === null || value === undefined) return 'neutral';
    
    switch (metricType) {
      case 'r2':
        if (value >= 0.9) return 'excellent';
        if (value >= 0.7) return 'good';
        if (value >= 0.5) return 'fair';
        return 'poor';
      case 'mse':
      case 'rmse':
      case 'mae':
      case 'aic':
      case 'bic':
        // Lower is better for these metrics
        return 'neutral'; // We'd need domain knowledge to set thresholds
      default:
        return 'neutral';
    }
  };

  // Render algorithm-specific metrics
  const renderMetrics = () => {
    if (!metrics) {
      return (
        <div style={styles.noMetrics}>
          <Activity size={32} style={styles.noMetricsIcon} />
          <p style={styles.noMetricsText}>No performance metrics available</p>
          <span style={styles.noMetricsSubtext}>This model may still be training or metrics weren't recorded during training.</span>
        </div>
      );
    }

    const metricItems = [];

    // Common metrics
    if (metrics.mse !== undefined) {
      metricItems.push({
        key: 'mse',
        label: 'MSE',
        value: metrics.mse,
        description: 'Mean Squared Error',
        icon: <TrendingUp size={16} />
      });
    }

    if (metrics.r2 !== undefined) {
      metricItems.push({
        key: 'r2',
        label: 'R²',
        value: metrics.r2,
        description: 'Coefficient of Determination',
        icon: <BarChart3 size={16} />
      });
    }

    if (metrics.rmse !== undefined) {
      metricItems.push({
        key: 'rmse',
        label: 'RMSE',
        value: metrics.rmse,
        description: 'Root Mean Squared Error',
        icon: <Activity size={16} />
      });
    }

    if (metrics.mae !== undefined) {
      metricItems.push({
        key: 'mae',
        label: 'MAE',
        value: metrics.mae,
        description: 'Mean Absolute Error',
        icon: <TrendingUp size={16} />
      });
    }

    // Time series specific metrics
    if (metrics.aic !== undefined) {
      metricItems.push({
        key: 'aic',
        label: 'AIC',
        value: metrics.aic,
        description: 'Akaike Information Criterion',
        icon: <Zap size={16} />
      });
    }

    if (metrics.bic !== undefined) {
      metricItems.push({
        key: 'bic',
        label: 'BIC',
        value: metrics.bic,
        description: 'Bayesian Information Criterion',
        icon: <Zap size={16} />
      });
    }

    return (
      <div style={styles.metricsGrid}>
        {metricItems.map((metric) => {
          const performance = getMetricPerformance(metric.value, metric.key);
          return (
            <div key={metric.key} style={styles.metricCard}>
              <div style={styles.metricHeader}>
                {metric.icon}
                <span style={styles.metricLabel}>{metric.label}</span>
              </div>
              <div style={{...styles.metricValue, color: performance === 'excellent' ? '#059669' : performance === 'good' ? '#0891b2' : performance === 'fair' ? '#ea580c' : performance === 'poor' ? '#dc2626' : '#1e293b'}}>
                {formatMetricValue(metric.value, metric.key)}
              </div>
              <div style={styles.metricDescription}>
                {metric.description}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const modalContent = (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.titleSection}>
              <div 
                style={{
                  ...styles.algorithmBadge,
                  backgroundColor: `${getAlgorithmColor(model.algorithm)}15`,
                  color: getAlgorithmColor(model.algorithm)
                }}
              >
                {formatAlgorithmName(model.algorithm)}
              </div>
              <h2 style={styles.title}>{model.target_col}</h2>
              <p style={styles.subtitle}>
                Predicting {model.target_col} from {model.table_name} table
              </p>
            </div>
            <button style={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div style={styles.tabs}>
            <button 
              style={{...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'metrics' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('metrics')}
            >
              Metrics
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'details' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {activeTab === 'overview' && (
            <>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <Target size={14} />
                    Algorithm
                  </div>
                  <div style={styles.infoValue}>{formatAlgorithmName(model.algorithm)}</div>
                </div>
                
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <Database size={14} />
                    Table
                  </div>
                  <div style={styles.infoValue}>{model.table_name}</div>
                </div>
                
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <Target size={14} />
                    Target Column
                  </div>
                  <div style={styles.infoValue}>{model.target_col}</div>
                </div>
                
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <Clock size={14} />
                    Created
                  </div>
                  <div style={styles.infoValue}>{formatDate(model.created_timestamp)}</div>
                </div>
                
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <User size={14} />
                    Created By
                  </div>
                  <div style={styles.infoValue}>{model.created_by || 'Unknown'}</div>
                </div>
                
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <Calendar size={14} />
                    Date Column
                  </div>
                  <div style={styles.infoValue}>{model.date_col || 'None'}</div>
                </div>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Performance Overview</h3>
                {renderMetrics()}
              </div>
            </>
          )}

          {activeTab === 'metrics' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Detailed Performance Metrics</h3>
              {renderMetrics()}
              
              {metrics && (
                <div style={styles.rawMetrics}>
                  <h4 style={styles.rawTitle}>Raw Metrics Data</h4>
                  <pre style={styles.rawCode}>
                    {JSON.stringify(metrics, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Model Details</h3>
              
              <div style={styles.detailSection}>
                <h4 style={styles.detailTitle}>Configuration</h4>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Schema:</span>
                    <span style={styles.detailValue}>{model.schema}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Algorithm:</span>
                    <span style={styles.detailValue}>{model.algorithm}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Target:</span>
                    <span style={styles.detailValue}>{model.target_col}</span>
                  </div>
                  {model.date_col && (
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Date Column:</span>
                      <span style={styles.detailValue}>{model.date_col}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.detailSection}>
                <h4 style={styles.detailTitle}>Training Information</h4>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Created:</span>
                    <span style={styles.detailValue}>{formatDate(model.created_timestamp)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Created By:</span>
                    <span style={styles.detailValue}>{model.created_by || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

// Inline styles to ensure they work
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    flexShrink: 0
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '28px 32px 20px 32px',
    gap: '24px'
  },
  titleSection: {
    flex: 1,
    minWidth: 0
  },
  algorithmBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '12px',
    letterSpacing: '0.025em'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 6px 0',
    letterSpacing: '-0.025em',
    lineHeight: '1.2'
  },
  subtitle: {
    color: '#64748b',
    margin: 0,
    fontSize: '15px',
    lineHeight: '1.4'
  },
  closeButton: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  tabs: {
    display: 'flex',
    gap: 0,
    padding: '0 32px'
  },
  tab: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s ease',
    letterSpacing: '0.025em'
  },
  activeTab: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  infoValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: '1.4'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)'
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
    color: '#64748b'
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '6px',
    lineHeight: '1.2'
  },
  metricDescription: {
    fontSize: '11px',
    color: '#9ca3af',
    lineHeight: '1.3'
  },
  noMetrics: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b',
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
    border: '1px dashed #cbd5e1',
    borderRadius: '12px'
  },
  noMetricsIcon: {
    margin: '0 auto 16px auto',
    opacity: 0.6
  },
  noMetricsText: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#374151'
  },
  noMetricsSubtext: {
    fontSize: '14px',
    lineHeight: '1.4'
  },
  rawMetrics: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: 'rgba(248, 250, 252, 0.6)',
    border: '1px solid rgba(226, 232, 240, 0.6)',
    borderRadius: '12px'
  },
  rawTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 12px 0'
  },
  rawCode: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    color: '#e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
    fontSize: '12px',
    lineHeight: '1.5',
    overflowX: 'auto',
    margin: 0,
    whiteSpace: 'pre'
  },
  detailSection: {
    marginBottom: '28px'
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 16px 0'
  },
  detailGrid: {
    display: 'grid',
    gap: '12px'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(248, 250, 252, 0.6)',
    border: '1px solid rgba(226, 232, 240, 0.6)',
    borderRadius: '8px'
  },
  detailLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b'
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b',
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace"
  }
};

export default ModelDetailsModal;