import { Link } from "wouter";
import { ArrowRight, Scale, FileText, MessageSquare, Sparkles, DollarSign, AlertCircle } from "lucide-react";

const STATE_INFO = [
  { state: "New York", abbr: "NY", limit: "$10,000", fee: "$15–$75", courts: "City, Town, or Village Courts" },
  { state: "New Jersey", abbr: "NJ", limit: "$3,000", fee: "$30–$75", courts: "Special Civil Part" },
  { state: "Florida", abbr: "FL", limit: "$8,000", fee: "$55–$300", courts: "County Court" },
  { state: "Texas", abbr: "TX", limit: "$20,000", fee: "$30–$100", courts: "Justice of the Peace Courts" },
  { state: "California", abbr: "CA", limit: "$12,500", fee: "$30–$100", courts: "Small Claims Court" },
];

const TIPS = [
  { icon: FileText, title: "Gather Evidence First", text: "Collect all contracts, receipts, photos, text messages, emails, and any written agreements before filing." },
  { icon: DollarSign, title: "Know Your Limits", text: "Each state caps how much you can claim. Check your state's limit before filing — you may need to reduce your claim or file in a higher court." },
  { icon: AlertCircle, title: "Serve the Defendant Properly", text: "You must notify the defendant of the lawsuit using legally valid service of process (certified mail, personal service, etc.)." },
  { icon: Scale, title: "Be Specific at the Hearing", text: "Bring organized evidence, stay calm, and focus on facts. Judges appreciate clear, chronological explanations." },
];

export function Guide() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Small Claims Court Guide</h1>
        <p className="text-muted-foreground">
          Everything you need to know about filing a small claims case — from eligibility to the hearing.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">What Is Small Claims Court?</h2>
        <div className="bg-card border border-card-border rounded-lg p-5 text-sm text-foreground leading-relaxed space-y-3">
          <p>
            Small claims court is a special division of civil court designed to resolve disputes involving relatively small amounts of money quickly and inexpensively — without requiring an attorney.
          </p>
          <p>
            It's ideal for disputes like unpaid debts, security deposits, property damage, breach of contract, and consumer complaints. Cases are typically resolved in a single hearing before a judge, usually within 30–70 days of filing.
          </p>
          <p>
            You represent yourself, present your evidence, and the judge issues a binding decision. If you win, you receive a judgment — a court order requiring the other party to pay you.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">State-by-State Quick Reference</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-foreground">State</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Claim Limit</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Filing Fee</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Court Name</th>
              </tr>
            </thead>
            <tbody>
              {STATE_INFO.map((s, i) => (
                <tr key={s.abbr} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{s.state}</td>
                  <td className="px-4 py-3 text-primary font-semibold">{s.limit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.fee}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.courts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Limits and fees change — always verify with your local courthouse.</p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">The Filing Process</h2>
        <div className="space-y-4">
          {[
            { n: "1", title: "Prepare Your Case", desc: "Gather all evidence: contracts, invoices, photos, messages. Know the defendant's full legal name and address." },
            { n: "2", title: "File at the Courthouse", desc: "Visit your local small claims court clerk. Bring your completed claim form, filing fee, and a copy of your evidence." },
            { n: "3", title: "Serve the Defendant", desc: "After filing, you must notify the defendant using an approved method (certified mail, sheriff, or process server)." },
            { n: "4", title: "Attend the Hearing", desc: "Appear on your scheduled date with organized evidence. Present your case clearly and concisely to the judge." },
            { n: "5", title: "Collect Your Judgment", desc: "If you win, the judge issues a judgment. You may need to garnish wages or bank accounts if the defendant doesn't pay voluntarily." },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                {n}
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground mb-0.5">{title}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Tips for Winning</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <div className="text-sm font-semibold text-foreground">{title}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <Scale className="w-8 h-8 text-primary mx-auto mb-3" />
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Ready to file?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Let our AI assistant help you prepare a strong case in under 15 minutes.
        </p>
        <Link href="/file" className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity">
          Start Filing Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
