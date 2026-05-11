import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { stateCourtData } from "@/data/stateCourtData";
import GuidedFilingModal from "@/components/GuidedFilingModal";
import type { StateCourtEntry } from "@/data/stateCourtData";

export default function Resources() {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<StateCourtEntry | null>(null);

  const filteredData = stateCourtData.filter(d =>
    d.state.toLowerCase().includes(search.toLowerCase()) ||
    d.abbr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-4">State Resources &amp; Limits</h1>
          <p className="text-muted-foreground max-w-3xl">
            Every state has different limits for small claims court and varying filing fees. Find the quick reference
            for your state below, then use Guided Filing to step through the process without leaving the app.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Small Claims Quick Reference</CardTitle>
                <CardDescription>Maximum claim amounts by state — click "File in [State]" for guided steps</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search state..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[160px] font-semibold text-foreground">State</TableHead>
                    <TableHead className="font-semibold text-foreground">Maximum Limit</TableHead>
                    <TableHead className="font-semibold text-foreground">Filing Fee (Est.)</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-foreground">Notes</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Guided Filing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row) => (
                      <TableRow key={row.state} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{row.state}</TableCell>
                        <TableCell className="font-bold text-primary">{row.limit}</TableCell>
                        <TableCell className="text-muted-foreground">{row.filingFee}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{row.notes}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => setSelectedState(row)}
                          >
                            File in {row.abbr}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No states found matching &ldquo;{search}&rdquo;.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <GuidedFilingModal
        open={!!selectedState}
        onClose={() => setSelectedState(null)}
        stateData={selectedState}
      />
    </div>
  );
}
