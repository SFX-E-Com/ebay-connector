'use client';

import { Badge, Row, Col } from 'react-bootstrap';
import { FiUser, FiShoppingCart, FiTrendingUp, FiBarChart, FiSettings } from 'react-icons/fi';
import {
  SCOPE_CATEGORIES,
  getScopesByCategory,
} from '@/app/lib/constants/ebayScopes';
import EbayScopeCard from './EbayScopeCard';

const categoryIcons = {
  identity: FiUser,
  selling: FiShoppingCart,
  buying: FiShoppingCart,
  marketing: FiTrendingUp,
  analytics: FiBarChart,
  other: FiSettings,
} as const;

interface EbayScopeCategoryProps {
  categoryKey: string;
  isExpanded: boolean;
  onToggle: () => void;
  selectedScopes: string[];
  onScopeToggle: (scopeId: string, isRequired?: boolean) => void;
  disabled?: boolean;
}

export default function EbayScopeCategory({
  categoryKey,
  isExpanded,
  onToggle,
  selectedScopes,
  onScopeToggle,
  disabled = false,
}: EbayScopeCategoryProps) {
  const category = SCOPE_CATEGORIES[categoryKey as keyof typeof SCOPE_CATEGORIES];
  const scopes = getScopesByCategory(categoryKey as keyof typeof SCOPE_CATEGORIES);
  const CategoryIcon = categoryIcons[categoryKey as keyof typeof categoryIcons];

  if (scopes.length === 0) return null;

  const selectedCount = scopes.filter(scope => selectedScopes.includes(scope.id)).length;
  const totalCount = scopes.length;

  return (
    <div>
      <div
        className="p-3 bg-white border rounded"
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={onToggle}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex gap-3 align-items-center">
            <CategoryIcon size={20} />
            <div className="d-flex flex-column align-items-start gap-1">
              <h6 className="mb-0">{category.name}</h6>
              <p className="small text-muted mb-0">{category.description}</p>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <Badge bg={selectedCount > 0 ? 'primary' : 'secondary'} className="small">
              {selectedCount}/{totalCount} selected
            </Badge>
            <span className="fs-4 text-muted">
              {isExpanded ? '−' : '+'}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 ms-4">
          <Row className="g-3">
            {scopes.map((scope) => (
              <Col key={scope.id} xs={12} md={6} lg={4}>
                <EbayScopeCard
                  scope={scope}
                  isSelected={selectedScopes.includes(scope.id)}
                  onToggle={onScopeToggle}
                  disabled={disabled}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
