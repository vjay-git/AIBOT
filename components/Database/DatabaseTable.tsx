import React from 'react';

interface TableRow {
  id: string;
  name: string;
  inputFolder: string;
  processedFolder: string;
}

interface DatabaseTableProps {
  data: TableRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectRow: (id: string, selected: boolean) => void;
  selectedRows: string[];
}

const DatabaseTable: React.FC<DatabaseTableProps> = ({ 
  data, 
  onEdit, 
  onDelete, 
  onSelectRow,
  selectedRows 
}) => {
  const handleCheckboxChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectRow(id, e.target.checked);
  };

  return (
    <div className="database-table-container">
      <div className="table-header">
        <div className="checkbox-cell table-cell">
          <input 
            type="checkbox" 
            className="checkbox"
            onChange={(e) => {
              // Select or deselect all rows
              const shouldSelect = e.target.checked;
              data.forEach(row => onSelectRow(row.id, shouldSelect));
            }}
            checked={selectedRows.length === data.length && data.length > 0}
          />
        </div>
        <div className="table-cell table-name-cell">Database Table</div>
        <div className="table-cell">Input Folder</div>
        <div className="table-cell">Processed Folder</div>
        <div className="table-cell actions-cell">Actions</div>
      </div>

      <div className="table-body">
        {data.map((row) => (
          <div key={row.id} className="table-row">
            <div className="checkbox-cell table-cell">
              <input 
                type="checkbox" 
                className="checkbox"
                checked={selectedRows.includes(row.id)}
                onChange={(e) => handleCheckboxChange(row.id, e)}
              />
            </div>
            <div className="table-cell table-name-cell">{row.name}</div>
            <div className="table-cell">{row.inputFolder}</div>
            <div className="table-cell">{row.processedFolder}</div>
            <div className="table-cell actions-cell">
              <button 
                className="icon-button" 
                onClick={() => onEdit(row.id)}
                aria-label={`Edit ${row.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.862 4.487L18.549 2.799C18.9007 2.44733 19.3777 2.25005 19.875 2.25005C20.3723 2.25005 20.8493 2.44733 21.201 2.799C21.5527 3.15068 21.75 3.62766 21.75 4.125C21.75 4.62235 21.5527 5.09933 21.201 5.451L10.582 16.07C10.0533 16.5985 9.40137 16.986 8.682 17.2L6 18L6.8 15.318C7.01405 14.5987 7.40153 13.9467 7.93 13.418L16.862 4.487Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 6.5L18 10" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="icon-button" 
                onClick={() => onDelete(row.id)}
                aria-label={`Delete ${row.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6H4M10 11V17M14 11V17M18 6L17 20C17 20.5304 16.7893 21.0391 16.4142 21.4142C16.0391 21.7893 15.5304 22 15 22H9C8.46957 22 7.96086 21.7893 7.58579 21.4142C7.21071 21.0391 7 20.5304 7 20L6 6M16 6V4C16 3.46957 15.7893 2.96086 15.4142 2.58579C15.0391 2.21071 14.5304 2 14 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4V6" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="empty-state">
            <p>No database tables found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTable; 