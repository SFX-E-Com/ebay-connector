'use client';

import React from 'react';
import { Card, Badge } from 'react-bootstrap';

interface InfoCardProps {
  title: string;
  description: string;
  icon?: string;
  iconColor?: any;
  iconBgColor?: any;
  badgeText?: string;
  badgeColorPalette?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  iconBgColor,
  badgeText,
  badgeColorPalette,
  onClick,
  children,
  variant = 'blue',
}) => {
  // Map variant to Bootstrap badge variant
  const getBadgeVariant = (variant: string) => {
    const mapping: Record<string, string> = {
      blue: 'info',
      green: 'success',
      purple: 'primary',
      orange: 'warning',
      red: 'danger',
      teal: 'info',
    };
    return badgeColorPalette || mapping[variant] || 'info';
  };

  // Map variant to border and icon colors
  const getVariantClasses = (variant: string) => {
    const mapping: Record<string, string> = {
      blue: 'border-info',
      green: 'border-success',
      purple: 'border-primary',
      orange: 'border-warning',
      red: 'border-danger',
      teal: 'border-info',
    };
    return mapping[variant] || 'border-info';
  };

  const getIconBgClass = (variant: string) => {
    const mapping: Record<string, string> = {
      blue: 'bg-info-subtle',
      green: 'bg-success-subtle',
      purple: 'bg-primary-subtle',
      orange: 'bg-warning-subtle',
      red: 'bg-danger-subtle',
      teal: 'bg-info-subtle',
    };
    return mapping[variant] || 'bg-info-subtle';
  };

  const getIconColorClass = (variant: string) => {
    const mapping: Record<string, string> = {
      blue: 'text-info',
      green: 'text-success',
      purple: 'text-primary',
      orange: 'text-warning',
      red: 'text-danger',
      teal: 'text-info',
    };
    return mapping[variant] || 'text-info';
  };

  const cardStyle: React.CSSProperties = {
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 1rem 3rem rgba(0,0,0,.175)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }
  };

  return (
    <Card
      className={`border ${getVariantClasses(variant)} rounded-lg shadow`}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card.Body className="p-4">
        <div className="d-flex flex-column gap-4">
          <div className="d-flex gap-3">
            {icon && (
              <div
                className={`d-flex align-items-center justify-content-center rounded p-3 ${getIconBgClass(variant)} ${getIconColorClass(variant)}`}
                style={{ minWidth: '48px', height: '48px' }}
              >
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
              </div>
            )}
            <div className="d-flex flex-column gap-1 flex-fill">
              <span className="fw-semibold text-dark fs-5">{title}</span>
              <span className="small text-muted" style={{ lineHeight: 1.4 }}>
                {description}
              </span>
              {badgeText && (
                <div className="mt-1">
                  <Badge bg={getBadgeVariant(variant)} className="small">
                    {badgeText}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          {children}
        </div>
      </Card.Body>
    </Card>
  );
};

export default InfoCard;