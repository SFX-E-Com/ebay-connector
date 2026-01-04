'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Badge, Alert, Spinner, Form, Card } from 'react-bootstrap';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdSearch,
} from 'react-icons/md';
import axios from 'axios';
import UserModal from '@/app/components/modals/UserModal';
import RoleSelect from '@/app/components/common/RoleSelect';
import DeleteConfirmDialog from '@/app/components/common/DeleteConfirmDialog';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface UserFormData {
  email: string;
  name: string;
  role: string;
  password?: string;
}


export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    fetchUsers();
    loadCurrentUser();
  }, [router]);

  const loadCurrentUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (formData: UserFormData) => {
    try {
      setSubmitting(true);

      if (editingUser) {
        // Update existing user
        const response = await axios.put(`/api/users/${editingUser.id}`, formData);
        if (response.data.success) {
          setUsers(users.map(user =>
            user.id === editingUser.id ? response.data.data : user
          ));
          handleModalClose();
        } else {
          setError(response.data.message || 'Failed to update user');
        }
      } else {
        // Create new user
        const response = await axios.post('/api/users', formData);
        if (response.data.success) {
          setUsers([response.data.data, ...users]);
          handleModalClose();
        } else {
          setError(response.data.message || 'Failed to create user');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
    setIsDeleting(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const response = await axios.delete(`/api/users/${userToDelete.id}`);
      if (response.data.success) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        closeDeleteDialog();
      } else {
        setError(response.data.message || 'Failed to delete user');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'red';
      case 'ADMIN':
        return 'orange';
      default:
        return 'blue';
    }
  };

  // Access control functions
  const canCreateUser = () => {
    return currentUser?.role === 'SUPER_ADMIN';
  };

  const canEditUser = (user: User) => {
    if (!currentUser) return false;

    // Users can't edit anyone
    if (currentUser.role === 'USER') return false;

    // Can't edit yourself
    if (currentUser.id === user.id) return false;

    // Super Admin can edit anyone except themselves
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Admin can't edit Super Admin or themselves
    if (currentUser.role === 'ADMIN') {
      return user.role !== 'SUPER_ADMIN';
    }

    return false;
  };

  const canDeleteUser = (user: User) => {
    if (!currentUser) return false;

    // Users can't delete anyone
    if (currentUser.role === 'USER') return false;

    // Can't delete yourself
    if (currentUser.id === user.id) return false;

    // Super Admin can delete anyone except themselves
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Admin can't delete Super Admin or themselves
    if (currentUser.role === 'ADMIN') {
      return user.role !== 'SUPER_ADMIN';
    }

    return false;
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="d-flex flex-column gap-3 align-items-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mb-0">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 p-md-5">
      <div className="d-flex flex-column gap-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex flex-column gap-1">
            <h1 className="display-6 fw-bold text-dark mb-0">User Management</h1>
            <p className="text-muted mb-0">Manage system users and their permissions</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              aria-label="Refresh"
              variant="outline-secondary"
              size="sm"
              onClick={fetchUsers}
            >
              <MdRefresh />
            </Button>
            {canCreateUser() && (
              <Button
                variant="primary"
                onClick={openCreateModal}
              >
                <MdAdd style={{ marginRight: '8px' }} />
                Add User
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Search and Stats */}
        <Card>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3">
                <div className="position-relative">
                  <Form.Control
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem', width: '300px' }}
                  />
                  <div className="position-absolute top-50 translate-middle-y" style={{ left: '0.75rem' }}>
                    <MdSearch color="#6c757d" />
                  </div>
                </div>
                <RoleSelect
                  value={roleFilter}
                  onChange={setRoleFilter}
                  placeholder="Filter by role..."
                  includeAllOption={true}
                  width="200px"
                />
              </div>
              <p className="text-muted small mb-0">
                {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </Card.Body>
        </Card>

        {/* Users Table */}
        <Card>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Created</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-medium text-dark">
                        {user.name || 'Unnamed User'}
                      </span>
                      <span className="small text-muted">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge bg={getRoleBadgeColor(user.role)} className="small">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>
                    <span className="small text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      {canEditUser(user) && (
                        <Button
                          aria-label="Edit user"
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => openEditModal(user)}
                        >
                          <MdEdit />
                        </Button>
                      )}
                      {canDeleteUser(user) && (
                        <Button
                          aria-label="Delete user"
                          size="sm"
                          variant="outline-danger"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <MdDelete />
                        </Button>
                      )}
                      {!canEditUser(user) && !canDeleteUser(user) && (
                        <span className="small text-muted">
                          No actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="p-5 text-center">
              <p className="text-muted mb-0">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          )}
        </Card>

        {/* User Modal */}
        <UserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleUserSubmit}
          user={editingUser}
          isSubmitting={submitting}
          currentUserRole={currentUser?.role || 'USER'}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteUser}
          itemName={userToDelete?.name || userToDelete?.email || ''}
          itemType="user"
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}