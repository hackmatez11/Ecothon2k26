export default function Medcare() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border">
      <iframe
        src="https://healthcare-final-one.vercel.app"
        title="Medcare"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
