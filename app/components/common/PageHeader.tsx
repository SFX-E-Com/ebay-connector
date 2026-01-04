"use client";

import { Button, Spinner } from "react-bootstrap";
import { MdAdd, MdRefresh } from "react-icons/md";
import { ReactNode } from "react";

interface ActionButton {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    colorPalette?: string;
    variant?: "solid" | "outline" | "ghost" | "subtle";
    size?: "xs" | "sm" | "md" | "lg";
    loading?: boolean;
    loadingText?: string;
    disabled?: boolean;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;

    // Refresh button
    showRefresh?: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;

    // Primary action button (like "Create" or "Connect")
    primaryAction?: ActionButton;

    // Additional action buttons
    actions?: ActionButton[];

    // Custom content in the action area
    children?: ReactNode;
}

// Helper to map Chakra color palette to Bootstrap variant
const getBootstrapVariant = (colorPalette?: string, variant?: string) => {
    const isOutline = variant === "outline";
    const prefix = isOutline ? "outline-" : "";

    switch (colorPalette) {
        case "orange":
            return `${prefix}primary`;
        case "green":
            return `${prefix}success`;
        case "red":
            return `${prefix}danger`;
        case "blue":
            return `${prefix}info`;
        case "gray":
        default:
            return `${prefix}secondary`;
    }
};

// Helper to map Chakra size to Bootstrap size
const getBootstrapSize = (size?: string) => {
    switch (size) {
        case "xs":
        case "sm":
            return "sm";
        case "lg":
            return "lg";
        default:
            return undefined;
    }
};

export default function PageHeader({
    title,
    subtitle,
    showRefresh = false,
    onRefresh,
    isRefreshing = false,
    primaryAction,
    actions = [],
    children,
}: PageHeaderProps) {
    return (
        <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex flex-column align-items-start gap-1">
                <h1 className="h2 text-dark mb-0">{title}</h1>
                {subtitle && (
                    <p className="text-muted mb-0">{subtitle}</p>
                )}
            </div>

            {(showRefresh || primaryAction || actions.length > 0 || children) && (
                <div className="d-flex gap-3">
                    {showRefresh && (
                        <Button
                            variant="outline-secondary"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            aria-label="Refresh"
                        >
                            {isRefreshing ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                <MdRefresh />
                            )}
                        </Button>
                    )}

                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={getBootstrapVariant(action.colorPalette || "gray", action.variant || "outline")}
                            size={getBootstrapSize(action.size)}
                            onClick={action.onClick}
                            disabled={action.disabled || action.loading}
                        >
                            {action.loading && (
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                            )}
                            {action.icon && <span className="me-2">{action.icon}</span>}
                            {action.loading && action.loadingText ? action.loadingText : action.label}
                        </Button>
                    ))}

                    {primaryAction && (
                        <Button
                            variant={getBootstrapVariant(primaryAction.colorPalette || "orange", primaryAction.variant || "solid")}
                            size={getBootstrapSize(primaryAction.size)}
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.disabled || primaryAction.loading}
                        >
                            {primaryAction.loading && (
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                            )}
                            {primaryAction.icon && <span className="me-2">{primaryAction.icon}</span>}
                            {primaryAction.loading && primaryAction.loadingText ? primaryAction.loadingText : primaryAction.label}
                        </Button>
                    )}

                    {children}
                </div>
            )}
        </div>
    );
}
