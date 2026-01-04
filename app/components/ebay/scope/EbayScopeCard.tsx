'use client';

import { Badge, Form } from 'react-bootstrap';
import { SCOPE_CATEGORIES, type EbayScope } from '@/app/lib/constants/ebayScopes';

interface EbayScopeCardProps {
  scope: EbayScope;
  isSelected: boolean;
  onToggle: (scopeId: string, isRequired?: boolean) => void;
  disabled?: boolean;
}

export default function EbayScopeCard({
  scope,
  isSelected,
  onToggle,
  disabled = false,
}: EbayScopeCardProps) {
  const isRequired = scope.isRequired;

  return (
    <div
      className={`p-3 border rounded ${isSelected ? 'bg-light' : 'bg-white'}`}
      style={{
        cursor: disabled || isRequired ? 'not-allowed' : 'pointer',
        opacity: disabled && !isSelected ? 0.6 : 1,
        transition: 'all 0.2s'
      }}
      onClick={() => onToggle(scope.id, isRequired)}
    >
      <div className="d-flex align-items-start gap-3">
        <Form.Check
          type="checkbox"
          checked={isSelected}
          disabled={disabled || isRequired}
          onChange={() => onToggle(scope.id, isRequired)}
          onClick={(e) => e.stopPropagation()}
        />

        <div className="d-flex flex-column align-items-start gap-2 flex-fill">
          <div className="d-flex gap-2 flex-wrap">
            <p className="fw-semibold small mb-0">
              {scope.name}
            </p>
            {isRequired && (
              <Badge bg="danger" className="small">
                Required
              </Badge>
            )}
          </div>

          <p className="small text-muted mb-0">
            {scope.description}
          </p>
        </div>
      </div>
    </div>
  );
}
