export default function Footer() {
  return (
    <div className="bg-light border-top mt-auto">
      <div className="container-fluid py-4 px-3 px-sm-4 px-lg-5" style={{ maxWidth: '1280px' }}>
        <div className="d-flex flex-column gap-4">
          <hr className="my-0" />

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center w-100 gap-3">
            <p className="small text-muted mb-0">
              © 2025 eBay Connector. All rights reserved.
            </p>
            <p className="small text-muted mb-0">
              Developed by - SFX E-commerce
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}