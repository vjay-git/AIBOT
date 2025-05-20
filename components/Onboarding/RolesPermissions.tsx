import React, { useState } from 'react';

interface Permission {
  id: string;
  name: string;
  description: string;
  roles: {
    subAdmin: boolean;
    manager: boolean;
    employee: boolean;
  };
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

const RolesPermissions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([
    {
      id: 'user-role-management',
      name: 'User & Role Management',
      description: 'Manage users, roles, permissions, and authentication settings for secure access.',
      permissions: [
        {
          id: 'manage-users',
          name: 'Manage users',
          description: 'Allows the user to add, modify, and remove user accounts, including role assignments and access permissions.',
          roles: {
            subAdmin: true,
            manager: true,
            employee: false
          }
        },
        {
          id: 'manage-roles',
          name: 'Manage Roles',
          description: 'Allows the user to assign, modify, or revoke roles and permissions for team members.',
          roles: {
            subAdmin: true,
            manager: false,
            employee: true
          }
        },
        {
          id: 'manage-account-status',
          name: 'Manage Account Status',
          description: 'Allows the user to activate or deactivate user accounts as needed.',
          roles: {
            subAdmin: true,
            manager: true,
            employee: false
          }
        },
        {
          id: 'authentication-settings',
          name: 'Authentication Settings',
          description: 'Allows the user to configure Single Sign-On (SSO) and Multi-Factor Authentication (MFA) for secure access.',
          roles: {
            subAdmin: false,
            manager: false,
            employee: true
          }
        }
      ]
    },
    {
      id: 'ai-llm-management',
      name: 'AI & LLM Management',
      description: 'Configure AI settings, automate workflows, and fine-tune chatbot responses.',
      permissions: [
        {
          id: 'manage-llm-settings',
          name: 'Manage LLM Settings',
          description: 'Allows the user to configure AI training, adjust response behavior, and set performance thresholds.',
          roles: {
            subAdmin: true,
            manager: true,
            employee: false
          }
        }
      ]
    }
  ]);

  const handleTogglePermission = (groupId: string, permissionId: string, role: keyof Permission['roles']) => {
    const updatedGroups = permissionGroups.map(group => {
      if (group.id === groupId) {
        const updatedPermissions = group.permissions.map(permission => {
          if (permission.id === permissionId) {
            return {
              ...permission,
              roles: {
                ...permission.roles,
                [role]: !permission.roles[role]
              }
            };
          }
          return permission;
        });
        return {
          ...group,
          permissions: updatedPermissions
        };
      }
      return group;
    });
    
    setPermissionGroups(updatedGroups);
    console.log(`Toggle ${role} permission for ${permissionId} in ${groupId}`);
  };

  const handleAddRole = () => {
    console.log('Add new role');
    // Add role functionality would go here
  };

  const filteredGroups = permissionGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
                         
    const hasMatchingPermissions = group.permissions.some(permission => 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return matchesSearch || hasMatchingPermissions;
  });

  return (
    <div className="roles-permissions-container">
      <div className="header-row">
        <div className="header-content">
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-description">Manage roles and permissions to control employee access and features within the software.</p>
        </div>
        <button className="add-role-button" onClick={handleAddRole}>
          <span className="button-icon">+</span>
          Add Role
        </button>
      </div>
      
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search action" 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredGroups.map(group => (
        <div key={group.id} className="permission-group">
          <div className="group-header">
            <h2 className="group-title">{group.name}</h2>
            <p className="group-description">{group.description}</p>
          </div>
          
          <div className="permissions-table">
            <div className="table-header">
              <div className="permission-action-column">{group.name} Actions</div>
              <div className="role-column">Sub-admin</div>
              <div className="role-column">Manager</div>
              <div className="role-column">Employee</div>
            </div>
            
            {group.permissions.map(permission => (
              <div key={permission.id} className="table-row">
                <div className="permission-action-column">
                  <div className="permission-name">{permission.name}</div>
                  <div className="permission-description">{permission.description}</div>
                </div>
                <div className="role-column">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={permission.roles.subAdmin}
                      onChange={() => handleTogglePermission(group.id, permission.id, 'subAdmin')}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="role-column">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={permission.roles.manager}
                      onChange={() => handleTogglePermission(group.id, permission.id, 'manager')}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="role-column">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={permission.roles.employee}
                      onChange={() => handleTogglePermission(group.id, permission.id, 'employee')}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RolesPermissions; 