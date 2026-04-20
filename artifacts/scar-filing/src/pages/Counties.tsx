import { useListCounties } from "@workspace/api-client-react";
import { ExternalLink } from "lucide-react";

export function Counties() {
  const counties = useListCounties();

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">County Filing Guide</h1>
        <p className="text-lg text-muted-foreground">
          SCAR filing information by New York county.
        </p>
      </div>

      {counties.isPending && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {counties.isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          Failed to load county information. Please try again.
        </div>
      )}

      {counties.data && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-foreground">County</th>
                <th className="text-left px-4 py-3 font-medium text-foreground hidden md:table-cell">Region</th>
                <th className="text-left px-4 py-3 font-medium text-foreground hidden lg:table-cell">Form Required</th>
                <th className="text-left px-4 py-3 font-medium text-foreground hidden md:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Filing Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {counties.data.map((county) => (
                <tr key={county.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{county.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{county.region}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{county.formRequired}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {county.deadline ?? "Varies"}
                  </td>
                  <td className="px-4 py-3">
                    {county.filingPortal ? (
                      <a
                        href={county.filingPortal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        File online
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">In person</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        <strong className="text-foreground">Note:</strong> For SCAR specifically, file your petition at the small claims court in the county where the property is located. The $30 filing fee is the same statewide. The court will schedule a hearing date after you file.
      </div>
    </div>
  );
}
