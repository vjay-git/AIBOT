import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../../utils/apiMocks';
import { UserType } from '../../types';

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="user-management-container">
      <h1 className="page-title">User Management</h1>
      <p className="page-description">
        Manage roles and permissions to control employee access and features within the software.
      </p>

      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by Name, Id.no" 
            className="search-input"
          />
        </div>
        <button className="invite-button">
          <span className="button-icon">+</span>
          Invite
        </button>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div className="table-cell id-cell">Id.no</div>
          <div className="table-cell name-cell">Name</div>
          <div className="table-cell email-cell">Email</div>
          <div className="table-cell role-cell">Role</div>
          <div className="table-cell status-cell">Status</div>
          <div className="table-cell actions-cell"></div>
        </div>

        {currentUsers.map(user => (
          <div className="table-row" key={user.id}>
            <div className="table-cell id-cell">{user.id}</div>
            <div className="table-cell name-cell">{user.name}</div>
            <div className="table-cell email-cell">{user.email}</div>
            <div className="table-cell role-cell">{user.role}</div>
            <div className="table-cell status-cell">
              <span className={`status-badge ${user.status === 'Active' ? 'active' : 'inactive'}`}>
                {user.status}
              </span>
            </div>
            <div className="table-cell actions-cell">
              <button className="action-button edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="action-button delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length > usersPerPage && (
        <div className="pagination">
          <button 
            className="pagination-button prev" 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                onClick={() => paginate(number)}
              >
                {number}
              </button>
            ))}
          </div>
          <button 
            className="pagination-button next"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 