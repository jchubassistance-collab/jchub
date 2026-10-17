export function PageLoader() {
  return (
    <div className="loading-screen" aria-label="Chargement" role="status">
      <div className="loading-mark">
        <span className="loading-ring" aria-hidden="true" />
        <img src="/jchub-icon-192.png" alt="JcHub" className="loading-logo" />
      </div>
    </div>
  );
}
