import React, { useState, useEffect } from 'react';
import { fetchReports } from '../../utils/apiMocks';
import { ReportType } from '../../types';

// Subnav items for reports (empty for now)
export const reportsTabs = [];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchReports();
        setReports(data);
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredReports = searchQuery
    ? reports.filter(report => 
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  if (loading) {
    return <div className="loading">Loading reports data...</div>;
  }

  return (
    <div className="reports-page">
      <div className="header">
        <div className="header-content">
          <h1 className="header-title">Reports</h1>
          <p className="header-description">
            Manage roles and permissions to control employee access and features within the software.
          </p>
        </div>
      </div>
      
      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 17.5L14.5834 14.5833M16.6667 9.58333C16.6667 13.4954 13.4954 16.6667 9.58333 16.6667C5.67132 16.6667 2.5 13.4954 2.5 9.58333C2.5 5.67132 5.67132 2.5 9.58333 2.5C13.4954 2.5 16.6667 5.67132 16.6667 9.58333Z" stroke="#667085" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <input 
            type="text"
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Id.no</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last modified</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.name}</td>
                <td>{report.email}</td>
                <td>{report.role}</td>
                <td>{report.lastModified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pagination-button prev">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.8334 10.0001H4.16675M4.16675 10.0001L10.0001 15.8334M4.16675 10.0001L10.0001 4.16675" stroke="#667085" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Previous
        </button>
        <div className="pagination-numbers">
          <button className="pagination-number active">1</button>
          <button className="pagination-number">2</button>
          <button className="pagination-number">3</button>
          <span className="pagination-ellipsis">...</span>
          <button className="pagination-number">8</button>
          <button className="pagination-number">9</button>
          <button className="pagination-number">10</button>
        </div>
        <button className="pagination-button next">
          Next
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.16663 10.0001H15.8333M15.8333 10.0001L9.99996 4.16675M15.8333 10.0001L9.99996 15.8334" stroke="#667085" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Reports;