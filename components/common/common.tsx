import React from 'react';

export const renderSearchBox = (
  activeNav: string,
  searchTerm: string,
  setSearchTerm: (v: string) => void
) => {
  if (['schema', 'customer-onboarding', 'dashboard', 'database'].includes(activeNav)) {
    const placeholder =
      activeNav === 'customer-onboarding' ? "Search by Name, Id.no" : "Search";
    return (
      <div className="search-input-container">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          className="search-input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    );
  }
  return null;
};

export const renderFilters = (activeNav: string) => {
  if (['schema', 'dashboard', 'customer-onboarding'].includes(activeNav)) {
    return (
      <button className="filter-button-container">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6H21M3 12H21M3 18H21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Filters</span>
      </button>
    );
  }
  return null;
};

export const renderAdditionalControls = (
  activeNav: string
) => {
  if (activeNav === 'customer-onboarding') {
    return (
      <button className="invite-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Invite
      </button>
    );
  }
  if (activeNav === 'dashboard' ) {
    return (
      <button className="add-card-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Add Card
      </button>
    );
  }
  return null;
};