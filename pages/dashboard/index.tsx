import React, { useState, useEffect } from 'react';
import { fetchDashboardData, askDatabase, AskDatabaseRequest } from '../../utils/apiMocks';
import { DashboardDataType } from '../../types';

// Subnav items for dashboard
export const dashboardTabs = [
  { id: 'patient-retention', title: 'Patient Retention Analytics' },
  { id: 'doctor-performance', title: 'Doctor Performance' },
  { id: 'patient-demographics', title: 'Patient Demographics' },
  { id: 'treatment-analytics', title: 'Treatment Analytics' },
  { id: 'operational-efficiency', title: 'Operational Efficiency' },
  { id: 'insurance-analytics', title: 'Insurance Analytics' },
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  const [classDistribution, setClassDistribution] = useState<any>(null);
  const [classDataLoading, setClassDataLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const fetchClassDistribution = async () => {
      setClassDataLoading(true);
      try {
        // Using the ask_db API request format
        const dbRequest: AskDatabaseRequest = {
          user_id: "4044e57d-1630-44e3-b990-1f8320237cd1",
          thread_id: "",
          question: "Show the distribution based on class",
          dashboard: "dashboard_1",
          tile: "tile_1"
        };
        
        const response = await askDatabase(dbRequest);
        if (response?.data) {
          setClassDistribution(response.data);
        }
      } catch (error) {
        console.error('Error fetching class distribution:', error);
      } finally {
        setClassDataLoading(false);
      }
    };
    
    // Fetch class distribution after main dashboard data is loaded
    if (!loading && dashboardData) {
      fetchClassDistribution();
    }
  }, [loading, dashboardData]);

  const renderPieChart = (data: any) => {
    if (!data || !data.labels || !data.values) return null;
    
    const total = data.values.reduce((sum: number, value: number) => sum + value, 0);
    
    return (
      <div className="pie-chart">
        <div className="pie-chart-visualization">
          {/* Simple visualization of the pie chart segments */}
          <div className="pie-segments">
            {data.labels.map((label: string, index: number) => (
              <div key={index} className="pie-segment">
                <div 
                  className="segment-color" 
                  style={{ 
                    backgroundColor: getColorForIndex(index),
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    marginRight: '8px'
                  }}
                ></div>
                <div className="segment-label">
                  <span className="text-scale-03-medium">{label}:</span>
                  <span className="text-scale-03-regular"> {data.values[index]}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const getColorForIndex = (index: number): string => {
    const colors = [
      '#0052FF', '#4C82FB', '#7BABFF', '#A3D0FF', '#D8EBFF', 
      '#FF5252', '#FF9D9D', '#FFC107', '#FFE082', '#AFCA09'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="header">
        <h1 className="header-title text-scale-06">Patient Retention Analytics</h1>
        <button className="action-button">
          <span>Add Card</span>
        </button>
      </div>

      {dashboardData && (
        <>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-title">Products</div>
              <div className="card-value">{dashboardData.metrics.products.toLocaleString()}</div>
            </div>
            <div className="dashboard-card">
              <div className="card-title">Orders</div>
              <div className="card-value">{dashboardData.metrics.orders.toLocaleString()}</div>
            </div>
            <div className="dashboard-card">
              <div className="card-title">Customers</div>
              <div className="card-value">{dashboardData.metrics.customers.toLocaleString()}</div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart">
              <h2 className="card-title">Class Distribution</h2>
              {classDataLoading ? (
                <div className="chart-placeholder">Loading class data...</div>
              ) : classDistribution ? (
                renderPieChart(classDistribution)
              ) : (
                <div className="chart-placeholder">No class data available</div>
              )}
            </div>
            <div className="chart">
              <h2 className="card-title">Customers</h2>
              <div className="chart-placeholder">Donut chart visualization will be here</div>
            </div>
          </div>

          <div className="customer-table">
            <h2 className="card-title">Customers</h2>
            <p className="table-subtitle">These companies have purchased in the last 12 months.</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>About</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.customerList.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.company}</td>
                    <td>{customer.about}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;