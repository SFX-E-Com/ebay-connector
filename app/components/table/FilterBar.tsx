'use client';

import { Form, Button, Card, Badge } from 'react-bootstrap';
import {
  MdSearch,
  MdClear,
  MdFilterList
} from 'react-icons/md';
import { ReactNode } from 'react';
import { FilterConfig, FilterValue } from '@/app/hooks/useFilters';

export interface FilterBarProps {
  filters: Record<string, FilterValue>;
  filterConfigs: FilterConfig[];
  onFilterChange: (key: string, value: FilterValue) => void;
  onClearFilter: (key: string) => void;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
  showFilterCount?: boolean;
  className?: string;
}

export function FilterBar({
  filters,
  filterConfigs,
  onFilterChange,
  onClearFilter,
  onClearAllFilters,
  hasActiveFilters,
  showFilterCount = true,
  className
}: FilterBarProps) {
  const activeFilterCount = Object.keys(filters).filter(key =>
    filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  const renderFilter = (config: FilterConfig) => {
    const value = filters[config.key] || '';

    switch (config.type) {
      case 'search':
        return (
          <div className="position-relative" style={{ minWidth: '250px' }}>
            <Form.Control
              placeholder={config.placeholder || `Search ${config.label?.toLowerCase() || 'items'}...`}
              value={value as string}
              onChange={(e) => onFilterChange(config.key, e.target.value)}
              size="sm"
              style={{ paddingLeft: '2.5rem' }}
            />
            <div className="position-absolute top-50 translate-middle-y" style={{ left: '0.75rem' }}>
              <MdSearch color="#4a5568" size={16} />
            </div>
            {value && (
              <Button
                aria-label="Clear search"
                size="sm"
                variant="link"
                className="position-absolute top-50 translate-middle-y text-secondary p-0 border-0"
                style={{ right: '0.5rem' }}
                onClick={() => onClearFilter(config.key)}
              >
                <MdClear size={14} />
              </Button>
            )}
          </div>
        );

      case 'select': {
        const selectOptions = [
          { label: `All ${config.label}`, value: 'ALL' },
          ...(config.options || [])
        ];
        const currentValue = (value as string) || 'ALL';

        return (
          <div style={{ minWidth: '150px' }}>
            <Form.Select
              size="sm"
              value={currentValue}
              onChange={(e) => {
                const newValue = e.target.value;
                onFilterChange(config.key, newValue === 'ALL' ? '' : newValue);
              }}
            >
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </div>
        );
      }

      case 'boolean': {
        const booleanOptions = [
          { label: `All ${config.label}`, value: 'ALL' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' }
        ];
        const currentValue = value === null || value === undefined ? 'ALL' : String(value);

        return (
          <div style={{ minWidth: '120px' }}>
            <Form.Select
              size="sm"
              value={currentValue}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue === 'ALL') {
                  onFilterChange(config.key, null);
                } else {
                  onFilterChange(config.key, newValue === 'true');
                }
              }}
            >
              {booleanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </div>
        );
      }

      case 'dateRange':
        // For now, implement as simple date inputs
        // Could be enhanced with a proper date range picker
        const dateValue = value as { from?: string; to?: string } || {};
        return (
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              type="date"
              size="sm"
              placeholder="From"
              value={dateValue.from || ''}
              onChange={(e) => onFilterChange(config.key, {
                ...dateValue,
                from: e.target.value
              })}
              style={{ width: '130px' }}
            />
            <span className="small text-dark">to</span>
            <Form.Control
              type="date"
              size="sm"
              placeholder="To"
              value={dateValue.to || ''}
              onChange={(e) => onFilterChange(config.key, {
                ...dateValue,
                to: e.target.value
              })}
              style={{ width: '130px' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <Card.Body className="p-4">
        <div className="d-flex flex-column gap-3">
          {/* Filter Header */}
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2 align-items-center">
              <MdFilterList size={20} color="#4a5568" />
              <span className="fw-medium text-dark">
                Filters
              </span>
              {showFilterCount && activeFilterCount > 0 && (
                <Badge bg="info" className="small">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={onClearAllFilters}
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="d-flex flex-wrap gap-3 align-items-end">
            {filterConfigs.map((config) => (
              <div key={config.key} className="d-flex flex-column gap-1">
                <label className="small fw-medium text-dark mb-0">
                  {config.label}
                </label>
                {renderFilter(config)}
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}