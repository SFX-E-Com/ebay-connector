'use client';

import { Table, Card, Button, Alert, Spinner } from 'react-bootstrap';
import {
  MdArrowUpward,
  MdArrowDownward,
  MdRefresh
} from 'react-icons/md';
import { ReactNode } from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  sortConfig?: { key: string; order: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  error,
  onRefresh,
  sortConfig,
  onSort,
  emptyMessage = 'No data available',
  className,
  size = 'md'
}: DataTableProps<T>) {
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }

    return sortConfig.order === 'asc' ?
      <MdArrowUpward size={16} /> :
      <MdArrowDownward size={16} />;
  };

  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
            <div className="d-flex flex-column gap-3 align-items-center">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="text-dark mb-0">Loading data...</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="d-flex align-items-center justify-content-between">
        <div>
          <Alert.Heading className="h6">Error Loading Data</Alert.Heading>
          <p className="mb-0">{error}</p>
        </div>
        {onRefresh && (
          <Button
            aria-label="Retry"
            size="sm"
            variant="outline-danger"
            onClick={onRefresh}
          >
            <MdRefresh />
          </Button>
        )}
      </Alert>
    );
  }

  const tableSize = size === 'sm' ? 'sm' : size === 'lg' ? undefined : undefined;

  return (
    <Card className={className}>
      <Table striped bordered hover size={tableSize} responsive>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  width: column.width,
                  cursor: column.sortable && onSort ? 'pointer' : 'default'
                }}
                onClick={() => column.sortable && handleSort(column.key)}
                className={column.sortable && onSort ? 'user-select-none' : ''}
              >
                <div className="d-flex gap-2 justify-content-between align-items-center">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ?
                    column.render(item, index) :
                    String(getNestedValue(item, column.key) || '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      {data.length === 0 && (
        <div className="p-5 text-center">
          <p className="text-muted mb-0">{emptyMessage}</p>
        </div>
      )}
    </Card>
  );
}