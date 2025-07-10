import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import userManagementService, { UserListParams, UserUpdateRequest, UserCreateRequest, getUserName } from '../services/api/userManagementService';
import { useAuth } from '../components/auth/AuthContext';
import UsersTab from '../components/user-management/UsersTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

// Define Role type locally
interface Role {
  id: string;
  name: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth(); // Retrieve user object from AuthContext
  const companyId = user?.companyId; // Extract companyId dynamically
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Add availableRoles state
  const [availableRoles] = useState<Role[]>([
    { id: 'admin', name: 'Admin' },
    { id: 'manager', name: 'Manager' },
    { id: 'staff', name: 'Staff' },
  ]);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users based on search query
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: UserListParams = {
        company_id: companyId,
        search: searchQuery || undefined,
      };
      const response = await userManagementService.getUsers(params);
      setUsers(response || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };  // User form handlers
  const openUserDialog = (user: any = null) => {
    if (user) {
      setSelectedUser(user);
      const { firstName, lastName } = getUserName(user);
      setUserFormData({
        name: `${firstName} ${lastName}`.trim() || '',
        email: user.email || '',
        role: user.role || '',
        isActive: user.status === 'active'
      });
    } else {
      setSelectedUser(null);
      setUserFormData({
        name: '',
        email: '',
        role: '',
        isActive: true
      });
    }
    setUserFormErrors({});
    setUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserFormChange = (field: string, value: any) => {
    if (field === 'role' && !availableRoles.some(role => role.id === value)) {
      setUserFormErrors((prev) => ({ ...prev, role: 'Invalid role selected' }));
      return;
    }

    setUserFormData((prev) => ({ ...prev, [field]: value }));
    if (userFormErrors[field]) {
      setUserFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateUserForm = () => {
    const errors: Record<string, string> = {};
    
    if (!userFormData.name.trim()) {
      errors['name'] = 'Name is required';
    }
    
    if (!userFormData.email.trim()) {
      errors['email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      errors['email'] = 'Invalid email format';
    }
    
    if (!userFormData.role) {
      errors['role'] = 'Role is required';
    }
    
    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserSave = async () => {
    if (!validateUserForm()) return;
    
    setLoading(true);
    try {
      if (selectedUser) {
        // Only send allowed fields for update
        const updateData: UserUpdateRequest = {
          email: userFormData.email,
          role: userFormData.role as UserUpdateRequest['role'],
          status: userFormData.isActive ? 'active' : 'inactive',
        };
        await userManagementService.updateUser(selectedUser.id, updateData);
      } else {
        const createData: UserCreateRequest = {
          first_name: userFormData.name.split(' ')[0],
          last_name: userFormData.name.split(' ').slice(1).join(' ') || '',
          email: userFormData.email,
          password: 'defaultPassword123', // Placeholder password
          role: userFormData.role as UserCreateRequest['role'],
          status: userFormData.isActive ? 'active' : 'inactive',
          company_id: companyId ?? '',
        };
        await userManagementService.createUser(createData);
      }
      
      fetchUsers();
      closeUserDialog();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };  const handleDeleteUser = (userId: string) => {
    setConfirmTitle('Delete User');
    setConfirmMessage('Are you sure you want to delete this user? This action cannot be undone.');
    setConfirmAction(async () => {
      try {
        await userManagementService.deleteUser(userId);
        fetchUsers();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError(err.message || 'Failed to delete user');
      }
    });
    setConfirmDialogOpen(true);
  };

  if (!companyId) {
    return <Typography variant="h6">Company ID is not available. Please log in again.</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
            <Tab label="Users" {...a11yProps(0)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UsersTab
            users={users}
            loading={loading}
            fetchUsers={fetchUsers}
            openUserDialog={openUserDialog}
            handleDeleteUser={handleDeleteUser}
          />        </TabPanel>
      </Paper>

      {/* User Dialog */}
      <Dialog 
        open={userDialogOpen} 
        onClose={closeUserDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={userFormData.name}
              onChange={(e) => handleUserFormChange('name', e.target.value)}
              error={!!userFormErrors.name}
              helperText={userFormErrors.name}
            />
            
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={userFormData.email}
              onChange={(e) => handleUserFormChange('email', e.target.value)}
              error={!!userFormErrors.email}
              helperText={userFormErrors.email}
              disabled={!!selectedUser} // Email can't be changed for existing users
            />
              <FormControl fullWidth error={!!userFormErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                value={userFormData.role}
                label="Role"
                onChange={(e) => handleUserFormChange('role', e.target.value)}
              >
                {availableRoles.map((role: Role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
              {userFormErrors.role && (
                <FormHelperText>{userFormErrors.role}</FormHelperText>
              )}
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={userFormData.isActive}
                  onChange={(e) => handleUserFormChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDialog}>Cancel</Button>
          <Button 
            onClick={handleUserSave} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>      
        </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (confirmAction) {
                setLoading(true);
                await confirmAction();
                setLoading(false);
              }
              setConfirmDialogOpen(false);
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;