export default function HospitalManagement() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border">
      <iframe
        src="https://hackgenex-final.vercel.app/"
        title="Hospital Management"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
