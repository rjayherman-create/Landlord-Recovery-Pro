import { FileQuestion, PlusCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ElementType;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  actionHref,
  icon: Icon = FileQuestion
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-lg bg-card/50 text-center animate-in fade-in duration-500">
      <div className="bg-muted p-4 rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button asChild className="bg-primary text-primary-foreground">
          <Link href={actionHref}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
