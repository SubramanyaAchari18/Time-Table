const PdfViewer = ({ url }) => {
  if (!url) return null;

  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="flex flex-col items-center bg-muted/10 p-4 max-h-[75vh] w-full rounded-b-xl overflow-hidden">
      <iframe
        src={viewerUrl}
        width="100%"
        height="600"
        style={{ border: "none" }}
        title="PDF Viewer"
        className="rounded-md shadow-sm w-full h-[600px]"
      />
    </div>
  );
};

export default PdfViewer;
