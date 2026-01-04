'use client';

import { Badge, Alert } from 'react-bootstrap';
import { useState } from 'react';
import { FiShield } from 'react-icons/fi';
import {
  EBAY_OAUTH_SCOPES,
  SCOPE_CATEGORIES,
} from '@/app/lib/constants/ebayScopes';
import EbayScopeCategory from './scope/EbayScopeCategory';

interface EbayScopeSelectorProps {
  selectedScopes: string[];
  onScopeChange: (scopeIds: string[]) => void;
  disabled?: boolean;
}

export default function EbayScopeSelector({
  selectedScopes,
  onScopeChange,
  disabled = false,
}: EbayScopeSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const handleScopeToggle = (scopeId: string, isRequired: boolean = false) => {
    if (disabled || isRequired) return;

    const newScopes = selectedScopes.includes(scopeId)
      ? selectedScopes.filter(id => id !== scopeId)
      : [...selectedScopes, scopeId];

    onScopeChange(newScopes);
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryKey)
        ? prev.filter(cat => cat !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const totalSelectedCount = selectedScopes.length;
  const totalAvailableCount = EBAY_OAUTH_SCOPES.length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Permissions & Scopes</h5>
          <Badge bg={totalSelectedCount > 0 ? 'primary' : 'secondary'}>
            {totalSelectedCount}/{totalAvailableCount} permissions selected
          </Badge>
        </div>

        <p className="small text-muted mb-3">
          Choose which eBay data and operations this account can access. Required permissions are pre-selected and cannot be changed.
        </p>
      </div>

      {/* Categories */}
      <div className="d-flex flex-column gap-4">
        {Object.keys(SCOPE_CATEGORIES).map((categoryKey) => (
          <EbayScopeCategory
            key={categoryKey}
            categoryKey={categoryKey}
            isExpanded={expandedCategories.includes(categoryKey)}
            onToggle={() => handleCategoryToggle(categoryKey)}
            selectedScopes={selectedScopes}
            onScopeToggle={handleScopeToggle}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Footer Info */}
      <Alert variant="warning" className="d-flex align-items-start gap-2 mb-0">
        <FiShield size={16} className="mt-1" />
        <div className="small">
          <strong>Security Note:</strong> You can revoke these permissions at any time through your eBay account settings.
          Only select the permissions your application actually needs.
        </div>
      </Alert>
    </div>
  );
}
