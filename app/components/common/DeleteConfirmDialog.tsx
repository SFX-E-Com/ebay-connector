'use client';

import { Modal, Button, Alert, Spinner } from 'react-bootstrap';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType?: string;
  description?: string;
  isDeleting?: boolean;
  customWarning?: string;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'item',
  description,
  isDeleting = false,
  customWarning,
}: DeleteConfirmDialogProps) {
  const defaultTitle = `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const defaultDescription = `Are you sure you want to delete ${itemType.toLowerCase()}`;
  const defaultWarning = `This action cannot be undone. The ${itemType.toLowerCase()} will be permanently removed from the system.`;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton={!isDeleting}>
        <Modal.Title className="text-danger">
          {title || defaultTitle}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex flex-column gap-4">
          <p className="mb-0">
            {description || defaultDescription}{' '}
            <span className="fw-bold text-danger">
              {itemName}
            </span>
            ?
          </p>

          <Alert variant="warning" className="mb-0">
            <p className="small mb-0">
              {customWarning || defaultWarning}
            </p>
          </Alert>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex gap-3 justify-content-end w-100">
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
            )}
            {isDeleting
              ? "Deleting..."
              : `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
