import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const STATE_DATA = [
  { state: "California", limit: "$10,000", fee: "$30 - $75", limitNote: "$10k for individuals, $5k for businesses", link: "https://www.courts.ca.gov/selfhelp-smallclaims.htm" },
  { state: "Texas", limit: "$20,000", fee: "$34 - $54", limitNote: "Highest limit in the country", link: "https://tjctc.org/SRL/small-claims.html" },
  { state: "Florida", limit: "$8,000", fee: "$55 - $300", limitNote: "", link: "https://help.flcourts.gov/Other-Resources/Small-Claims" },
  { state: "New York", limit: "$10,000", fee: "$15 - $20", limitNote: "$10k in NYC, $5k in town/village courts", link: "https://www.nycourts.gov/courthelp/SmallClaims/index.shtml" },
  { state: "Illinois", limit: "$10,000", fee: "Varies by county", limitNote: "", link: "https://www.illinoiscourts.gov/forms/approved-forms/forms-approved-forms-circuit-court/small-claims" },
  { state: "Pennsylvania", limit: "$12,000", fee: "Varies by county", limitNote: "Handled by Magisterial District Judges", link: "https://www.pacourts.us/learn/representing-yourself/small-claims-court" },
  { state: "Ohio", limit: "$6,000", fee: "$30 - $100", limitNote: "", link: "https://www.ohiobar.org/public-resources/commonly-asked-law-questions-results/courts/small-claims-court-what-you-need-to-know/" },
  { state: "Georgia", limit: "$15,000", fee: "Varies by county", limitNote: "Magistrate Court", link: "https://georgiacourts.gov/magistrate/" },
  { state: "North Carolina", limit: "$10,000", fee: "$96", limitNote: "Magistrate Court", link: "https://www.nccourts.gov/help-topics/lawsuits-and-claims/small-claims" },
  { state: "New Jersey", limit: "$3,000", fee: "$35 - $50", limitNote: "Special Civil Part handles up to $15k", link: "https://www.njcourts.gov/self-help/small-claims-court" },
];

export default function Resources() {
  const [search, setSearch] = useState("");

  const filteredData = STATE_DATA.filter(d => d.state.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="py-12 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-4">State Resources & Limits</h1>
          <p className="text-muted-foreground max-w-3xl">
            Every state has different limits for small claims court and varying filing fees. Find the quick reference for your state below. Always verify current limits with your local court clerk.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Small Claims Quick Reference</CardTitle>
                <CardDescription>Maximum claim amounts by state</CardDescription>
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
                    <TableHead className="w-[150px] font-semibold text-foreground">State</TableHead>
                    <TableHead className="font-semibold text-foreground">Maximum Limit</TableHead>
                    <TableHead className="font-semibold text-foreground">Filing Fee (Est.)</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-foreground">Notes</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Court Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row) => (
                      <TableRow key={row.state} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{row.state}</TableCell>
                        <TableCell className="font-bold text-primary">{row.limit}</TableCell>
                        <TableCell className="text-muted-foreground">{row.fee}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{row.limitNote}</TableCell>
                        <TableCell className="text-right">
                          <a 
                            href={row.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title={`Official court site for ${row.state}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No states found matching "{search}".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
