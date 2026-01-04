'use client';

import { Form } from 'react-bootstrap';

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  currentUserRole?: string;
  includeAllOption?: boolean;
  width?: string;
}

const allRoles = [
  { label: 'User', value: 'USER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
];

export default function RoleSelect({
  value,
  onChange,
  placeholder = "Select role...",
  label,
  currentUserRole,
  includeAllOption = false,
  width
}: RoleSelectProps) {

  // Filter roles based on current user permissions
  const getAvailableRoles = () => {
    let availableRoles = [...allRoles];

    if (currentUserRole) {
      availableRoles = allRoles.filter(role => {
        if (currentUserRole === 'SUPER_ADMIN') return true;
        if (currentUserRole === 'ADMIN' && role.value !== 'SUPER_ADMIN') return true;
        return false;
      });
    }

    if (includeAllOption) {
      availableRoles = [{ label: 'All Roles', value: 'ALL' }, ...availableRoles];
    }

    return availableRoles;
  };

  const availableRoles = getAvailableRoles();

  const SelectComponent = (
    <Form.Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: width }}
    >
      {placeholder && !value && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {availableRoles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </Form.Select>
  );

  if (label) {
    return (
      <Form.Group>
        <Form.Label>{label}</Form.Label>
        {SelectComponent}
      </Form.Group>
    );
  }

  return SelectComponent;
}
