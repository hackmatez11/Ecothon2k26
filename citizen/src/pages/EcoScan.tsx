const ECO_SCAN_URL = import.meta.env.VITE_ECO_SCAN_URL as string;

export default function EcoScan() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border">
      <iframe
        src={ECO_SCAN_URL}
        title="EcoScan"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
