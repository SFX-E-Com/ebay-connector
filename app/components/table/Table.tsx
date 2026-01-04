"use client";

import { Button, Alert, Spinner, OverlayTrigger, Tooltip, Form } from "react-bootstrap";
import { MdRefresh } from "react-icons/md";
import { HiCheck, HiX } from "react-icons/hi";
import { useDataTable } from "@/app/hooks/useDataTable";
import { FilterConfig } from "@/app/hooks/useFilters";
import { DataTable } from "./DataTable";
import { FilterBar } from "./FilterBar";
import { Pagination } from "./Pagination";
import { TableColumn } from "./DataTable";
import { forwardRef, useImperativeHandle, useState, useMemo } from "react";
import axios from "axios";
import DeleteConfirmDialog from "@/app/components/common/DeleteConfirmDialog";

export interface TableProps<T = any> {
    // Data configuration
    endpoint: string;
    columns: TableColumn<T>[];

    // Page configuration
    title?: string;
    description?: string;

    // Filter configuration
    filterConfigs?: FilterConfig[];
    showFilters?: boolean;

    // Pagination configuration
    showPagination?: boolean;
    initialPageSize?: number;
    pageSizeOptions?: number[];

    // Header actions
    headerActions?: React.ReactNode;
    showRefreshButton?: boolean;

    // Row actions
    actions?: TableAction<T>[];
    showActions?: boolean;

    // Styling
    className?: string;

    // Data table options
    initialParams?: Record<string, any>;
    autoFetch?: boolean;
}

export interface TableRef {
    refetch: () => Promise<void>;
}

// Action configuration interfaces
export interface TableAction<T = any> {
    key: string;
    label: string;
    icon?: React.ComponentType;
    type: "edit" | "delete" | "status" | "switch" | "custom";

    // For edit actions
    modalComponent?: React.ComponentType<any>;
    editEndpoint?: string; // PUT /api/items/{id}

    // For delete actions
    deleteEndpoint?: string; // DELETE /api/items/{id}
    itemNameField?: keyof T; // field to show in delete confirmation

    // For status actions
    statusEndpoint?: string; // PATCH /api/items/{id}/status
    statusField?: keyof T; // field that contains the status boolean
    activeLabel?: string; // "Active", "Enabled", etc.
    inactiveLabel?: string; // "Inactive", "Disabled", etc.

    // For custom actions
    onClick?: (item: T, refetch: () => Promise<void>) => void;

    // Common options
    variant?: "ghost" | "solid" | "outline";
    colorPalette?: string;
    visible?: (item: T) => boolean;
    disabled?: (item: T) => boolean;
}

export const Table = forwardRef<TableRef, TableProps<any>>(function Table<
    T = any
>(
    {
        endpoint,
        columns,
        title,
        description,
        filterConfigs = [],
        showFilters = true,
        showPagination = true,
        initialPageSize = 25,
        pageSizeOptions = [10, 25, 50, 100],
        headerActions,
        showRefreshButton = true,
        actions = [],
        showActions = true,
        className,
        initialParams,
        autoFetch = true,
    }: TableProps<T>,
    ref: React.Ref<TableRef>
) {
    // Action state management
    const [editItem, setEditItem] = useState<T | null>(null);
    const [deleteItem, setDeleteItem] = useState<T | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Local optimistic updates state
    const [optimisticUpdates, setOptimisticUpdates] = useState<
        Map<string, Partial<T>>
    >(new Map());
    const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());

    // Use our data table hook
    const dataTable = useDataTable<T>({
        endpoint,
        filterConfigs,
        initialParams,
        autoFetch,
        pagination: {
            initialPageSize,
            pageSizeOptions,
        },
    });

    // Apply optimistic updates to the display data
    const optimisticDisplayData = useMemo(() => {
        if (!dataTable.displayData) return [];

        return dataTable.displayData
            .filter((item) => !deletedItems.has((item as any).id))
            .map((item) => {
                const itemId = (item as any).id;
                const updates = optimisticUpdates.get(itemId);
                return updates ? { ...item, ...updates } : item;
            });
    }, [dataTable.displayData, optimisticUpdates, deletedItems]);

    // Expose refetch function via ref
    useImperativeHandle(
        ref,
        () => ({
            refetch: dataTable.refetch,
        }),
        [dataTable.refetch]
    );

    // Action handlers
    const handleEdit = (item: T) => {
        // Get the item with any optimistic updates applied
        const itemId = (item as any).id;
        const updates = optimisticUpdates.get(itemId);
        const itemWithUpdates = updates ? { ...item, ...updates } : item;
        setEditItem(itemWithUpdates);
    };

    const handleDelete = (item: T) => {
        setDeleteItem(item);
    };

    const handleStatusToggle = async (item: T, action: TableAction<T>) => {
        if (!action.statusEndpoint || !action.statusField) return;

        const itemId = (item as any).id;
        const currentStatus = (item as any)[action.statusField];
        const newStatus = !currentStatus;

        // Apply optimistic update to local state
        setOptimisticUpdates((prev) =>
            new Map(prev).set(itemId, {
                ...prev.get(itemId),
                [action.statusField as string]: newStatus,
            })
        );

        try {
            // Make API call
            await axios.patch(action.statusEndpoint.replace("{id}", itemId), {
                [action.statusField as string]: newStatus,
            });

            // Update the cached data directly and clear optimistic update
            dataTable.mutate((currentData) =>
                currentData.map((item) =>
                    (item as any).id === itemId
                        ? { ...item, [action.statusField as string]: newStatus }
                        : item
                )
            );
            setOptimisticUpdates((prev) => {
                const next = new Map(prev);
                next.delete(itemId);
                return next;
            });
        } catch (error) {
            console.error("Failed to toggle status:", error);
            // Revert optimistic update on error
            setOptimisticUpdates((prev) => {
                const next = new Map(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;

        const deleteAction = actions.find((a) => a.type === "delete");
        if (!deleteAction?.deleteEndpoint) return;

        const itemId = (deleteItem as any).id;

        // Apply optimistic delete to local state
        setDeletedItems((prev) => new Set(prev).add(itemId));
        setDeleteItem(null); // Close dialog immediately

        try {
            // Make API call
            await axios.delete(
                deleteAction.deleteEndpoint.replace("{id}", itemId)
            );

            // Remove item from cached data permanently
            dataTable.mutate((currentData) =>
                currentData.filter((item) => (item as any).id !== itemId)
            );
            // Remove from optimistic delete tracking since it's now permanently removed
            setDeletedItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        } catch (error) {
            console.error("Failed to delete item:", error);
            // Revert optimistic delete on error
            setDeletedItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    // Helper to render action button with tooltip
    const renderActionButton = (button: React.ReactNode, tooltip: string, key: string) => (
        <OverlayTrigger
            key={key}
            placement="top"
            overlay={<Tooltip id={`tooltip-${key}`}>{tooltip}</Tooltip>}
        >
            <span className="d-inline-block">{button}</span>
        </OverlayTrigger>
    );

    // Enhanced columns with actions
    const enhancedColumns: TableColumn<T>[] = [
        ...columns,
        ...(showActions && actions.length > 0
            ? [
                  {
                      key: "actions",
                      header: "Actions",
                      render: (item: T) => (
                          <div className="d-flex gap-1">
                              {actions.map((action) => {
                                  // Check visibility and disabled conditions
                                  if (action.visible && !action.visible(item))
                                      return null;
                                  const isDisabled = action.disabled
                                      ? action.disabled(item)
                                      : false;

                                  // Map Chakra variants to Bootstrap
                                  const getVariant = () => {
                                      if (action.variant === "ghost") return "outline-secondary";
                                      if (action.variant === "solid") return action.colorPalette || "primary";
                                      return action.variant || "outline-secondary";
                                  };

                                  // Handle different action types
                                  switch (action.type) {
                                      case "edit":
                                          return renderActionButton(
                                              <Button
                                                  size="sm"
                                                  variant={getVariant()}
                                                  disabled={isDisabled}
                                                  onClick={() => handleEdit(item)}
                                                  aria-label={action.label}
                                              >
                                                  {action.icon ? <action.icon /> : "Edit"}
                                              </Button>,
                                              action.label,
                                              `${action.key}-${(item as any).id || Math.random()}`
                                          );

                                      case "delete":
                                          return renderActionButton(
                                              <Button
                                                  size="sm"
                                                  variant="outline-danger"
                                                  disabled={isDisabled}
                                                  onClick={() => handleDelete(item)}
                                                  aria-label={action.label}
                                              >
                                                  {action.icon ? <action.icon /> : "Delete"}
                                              </Button>,
                                              action.label,
                                              `${action.key}-${(item as any).id || Math.random()}`
                                          );

                                      case "status":
                                          const currentStatus =
                                              action.statusField
                                                  ? (item as any)[action.statusField]
                                                  : false;
                                          const statusLabel = currentStatus
                                              ? action.inactiveLabel || "Deactivate"
                                              : action.activeLabel || "Activate";
                                          return renderActionButton(
                                              <Button
                                                  size="sm"
                                                  variant={currentStatus ? "outline-warning" : "outline-success"}
                                                  disabled={isDisabled}
                                                  onClick={() => handleStatusToggle(item, action)}
                                                  aria-label={statusLabel}
                                              >
                                                  {action.icon ? <action.icon /> : currentStatus ? "Pause" : "Play"}
                                              </Button>,
                                              statusLabel,
                                              `${action.key}-${(item as any).id || Math.random()}`
                                          );

                                      case "switch":
                                          const switchStatus =
                                              action.statusField
                                                  ? (item as any)[action.statusField]
                                                  : false;
                                          const switchId = `switch-${action.key}-${(item as any).id}`;
                                          return renderActionButton(
                                              <Form.Check
                                                  type="switch"
                                                  id={switchId}
                                                  checked={switchStatus}
                                                  onChange={() => handleStatusToggle(item, action)}
                                                  disabled={isDisabled}
                                              />,
                                              switchStatus
                                                  ? action.activeLabel || "Activate"
                                                  : action.inactiveLabel || "Deactivate",
                                              `${action.key}-${(item as any).id || Math.random()}`
                                          );

                                      case "custom":
                                          return renderActionButton(
                                              <Button
                                                  size="sm"
                                                  variant={getVariant()}
                                                  disabled={isDisabled}
                                                  onClick={() => action.onClick?.(item, dataTable.refetch)}
                                                  aria-label={action.label}
                                              >
                                                  {action.icon ? <action.icon /> : action.label}
                                              </Button>,
                                              action.label,
                                              `${action.key}-${(item as any).id || Math.random()}`
                                          );

                                      default:
                                          return null;
                                  }
                              })}
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <div className={className}>
            <div className="d-flex flex-column gap-4">
                {/* Header */}
                {(title || description || headerActions || showRefreshButton) && (
                    <div className="d-flex justify-content-between align-items-start">
                        {(title || description) && (
                            <div>
                                {title && (
                                    <h2 className="display-6 fw-bold mb-2">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-dark">{description}</p>
                                )}
                            </div>
                        )}

                        <div className="d-flex gap-2">
                            {showRefreshButton && (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip id="tooltip-refresh">Refresh data</Tooltip>}
                                >
                                    <Button
                                        aria-label="Refresh"
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => dataTable.refetch()}
                                    >
                                        <MdRefresh />
                                    </Button>
                                </OverlayTrigger>
                            )}
                            {headerActions}
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {dataTable.error && (
                    <Alert variant="danger" className="d-flex align-items-center justify-content-between">
                        <div>
                            <Alert.Heading className="h6">Error!</Alert.Heading>
                            <p className="mb-0">{dataTable.error}</p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => dataTable.refetch()}
                        >
                            Retry
                        </Button>
                    </Alert>
                )}

                {/* Filters */}
                {showFilters && filterConfigs.length > 0 && (
                    <FilterBar
                        filters={dataTable.filters}
                        filterConfigs={filterConfigs}
                        onFilterChange={dataTable.setFilter}
                        onClearFilter={dataTable.clearFilter}
                        onClearAllFilters={dataTable.clearAllFilters}
                        hasActiveFilters={dataTable.hasActiveFilters}
                    />
                )}

                {/* Data Table */}
                <DataTable
                    data={optimisticDisplayData}
                    columns={enhancedColumns}
                    loading={dataTable.loading}
                    error={dataTable.error}
                    onRefresh={() => dataTable.refetch()}
                    sortConfig={dataTable.sortConfig}
                    onSort={dataTable.toggleSorting}
                />

                {/* Pagination */}
                {showPagination && (
                    <Pagination
                        pagination={dataTable.pagination}
                        onPageChange={dataTable.goToPage}
                        onPageSizeChange={dataTable.setPageSize}
                        pageSizeOptions={pageSizeOptions}
                        showPageSizeSelector={true}
                        showPageInfo={true}
                        showNavButtons={true}
                    />
                )}

                {/* Table Stats */}
                {dataTable.stats.totalItems > 0 && (
                    <div>
                        <p className="small text-dark text-center mb-0">
                            Showing {dataTable.stats.displayedItems} of{" "}
                            {dataTable.stats.filteredItems} filtered results (
                            {dataTable.stats.totalItems} total items)
                        </p>
                    </div>
                )}

                {/* Built-in Delete Confirmation Dialog */}
                {deleteItem && (
                    <DeleteConfirmDialog
                        isOpen={!!deleteItem}
                        onClose={() => setDeleteItem(null)}
                        onConfirm={handleDeleteConfirm}
                        itemName={(() => {
                            const deleteAction = actions.find(
                                (a) => a.type === "delete"
                            );
                            if (deleteAction?.itemNameField) {
                                return String(
                                    (deleteItem as any)[
                                        deleteAction.itemNameField
                                    ]
                                );
                            }
                            return "this item";
                        })()}
                        itemType="item"
                        isDeleting={false}
                    />
                )}

                {/* Built-in Edit Modal */}
                {editItem &&
                    (() => {
                        const editAction = actions.find(
                            (a) => a.type === "edit"
                        );
                        if (editAction?.modalComponent) {
                            const ModalComponent = editAction.modalComponent;
                            return (
                                <ModalComponent
                                    isOpen={!!editItem}
                                    onClose={() => setEditItem(null)}
                                    token={editItem}
                                    onSubmit={async (data: any) => {
                                        if (editAction.editEndpoint) {
                                            const itemId = (editItem as any).id;

                                            // Apply optimistic update to local state
                                            setOptimisticUpdates((prev) =>
                                                new Map(prev).set(itemId, {
                                                    ...prev.get(itemId),
                                                    ...data,
                                                })
                                            );
                                            setEditItem(null); // Close modal immediately

                                            try {
                                                // Make API call
                                                await axios.put(
                                                    editAction.editEndpoint.replace(
                                                        "{id}",
                                                        itemId
                                                    ),
                                                    data
                                                );

                                                // Update the cached data directly and clear optimistic update
                                                dataTable.mutate((currentData) =>
                                                    currentData.map((item) =>
                                                        (item as any).id === itemId
                                                            ? { ...item, ...data }
                                                            : item
                                                    )
                                                );
                                                setOptimisticUpdates((prev) => {
                                                    const next = new Map(prev);
                                                    next.delete(itemId);
                                                    return next;
                                                });
                                            } catch (error) {
                                                console.error(
                                                    "Failed to update item:",
                                                    error
                                                );
                                                // Revert optimistic update on error
                                                setOptimisticUpdates((prev) => {
                                                    const next = new Map(prev);
                                                    next.delete(itemId);
                                                    return next;
                                                });
                                            }
                                        }
                                    }}
                                    isSubmitting={false} // Never show loading since we use optimistic updates
                                />
                            );
                        }
                        return null;
                    })()}
            </div>
        </div>
    );
});

export default Table;
