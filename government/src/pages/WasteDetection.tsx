const WASTE_DETECTION_URL = import.meta.env.VITE_WASTE_DETECTION_URL as string;

export default function WasteDetection() {
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <iframe
        src={WASTE_DETECTION_URL}
        title="Waste Detection"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
