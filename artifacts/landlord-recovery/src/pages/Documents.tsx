import { DocumentLibrary } from "@/components/shared/DocumentLibrary";

export default function Documents() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-serif font-bold text-foreground">Document Library</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Fill in your details, copy or print.</p>
      </div>
      <div className="flex-1 min-h-0">
        <DocumentLibrary />
      </div>
    </div>
  );
}
