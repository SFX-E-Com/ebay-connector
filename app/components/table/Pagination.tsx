'use client';

import { Card, Button, Form } from 'react-bootstrap';
import {
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage
} from 'react-icons/md';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showNavButtons?: boolean;
  maxVisiblePages?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showPageInfo = true,
  showNavButtons = true,
  maxVisiblePages = 5,
  className,
  size = 'sm'
}: PaginationProps) {
  const { currentPage, totalPages, pageSize, totalItems, startIndex, endIndex } = pagination;

  // Calculate which page numbers to show
  const getVisiblePages = () => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (totalItems === 0) {
    return null;
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : undefined;

  return (
    <Card className={className}>
      <Card.Body className="p-4">
        <div className="d-flex flex-column gap-4">
          {/* Page Info */}
          {showPageInfo && (
            <div className="d-flex justify-content-between align-items-center w-100">
              <span className="small text-dark">
                Showing {startIndex + 1} to {endIndex} of {totalItems} results
              </span>

              {showPageSizeSelector && (
                <div className="d-flex gap-2 align-items-center">
                  <span className="small text-dark">
                    Show
                  </span>
                  <Form.Select
                    size={buttonSize}
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    style={{ width: '80px' }}
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Select>
                  <span className="small text-dark">
                    per page
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {showNavButtons && totalPages > 1 && (
            <div className="d-flex gap-1 justify-content-center">
              {/* First Page */}
              <Button
                aria-label="First page"
                size={buttonSize}
                variant="outline-secondary"
                onClick={() => onPageChange(1)}
                disabled={!canGoPrevious}
              >
                <MdFirstPage />
              </Button>

              {/* Previous Page */}
              <Button
                aria-label="Previous page"
                size={buttonSize}
                variant="outline-secondary"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrevious}
              >
                <MdChevronLeft />
              </Button>

              {/* Page Numbers */}
              {visiblePages.map((page) => (
                <Button
                  key={page}
                  size={buttonSize}
                  variant={page === currentPage ? 'primary' : 'outline-secondary'}
                  onClick={() => onPageChange(page)}
                  style={{ minWidth: '40px' }}
                >
                  {page}
                </Button>
              ))}

              {/* Show ellipsis if there are more pages */}
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 small text-secondary align-self-center">
                  ...
                </span>
              )}

              {/* Last page number if not visible */}
              {visiblePages[visiblePages.length - 1] < totalPages && (
                <Button
                  size={buttonSize}
                  variant="outline-secondary"
                  onClick={() => onPageChange(totalPages)}
                  style={{ minWidth: '40px' }}
                >
                  {totalPages}
                </Button>
              )}

              {/* Next Page */}
              <Button
                aria-label="Next page"
                size={buttonSize}
                variant="outline-secondary"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext}
              >
                <MdChevronRight />
              </Button>

              {/* Last Page */}
              <Button
                aria-label="Last page"
                size={buttonSize}
                variant="outline-secondary"
                onClick={() => onPageChange(totalPages)}
                disabled={!canGoNext}
              >
                <MdLastPage />
              </Button>
            </div>
          )}

          {/* Simple page info for single page */}
          {totalPages === 1 && showPageInfo && (
            <p className="small text-dark text-center mb-0">
              Page 1 of 1
            </p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
