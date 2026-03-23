import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGrievance, useUpdateGrievance } from "@/hooks/use-grievances";
import { useToast } from "@/hooks/use-toast";
import type { Grievance } from "@workspace/api-client-react";

const grievanceSchema = z.object({
  ownerName: z.string().min(2, "Owner name is required"),
  propertyAddress: z.string().min(5, "Property address is required"),
  county: z.string().min(2, "County is required"),
  municipality: z.string().min(2, "Municipality/Town is required"),
  taxYear: z.coerce.number().min(2020).max(2030),
  currentAssessment: z.coerce.number().positive("Must be a positive number"),
  equalizationRate: z.coerce.number().optional(),
  estimatedMarketValue: z.coerce.number().positive("Must be a positive number"),
  requestedAssessment: z.coerce.number().positive("Must be a positive number"),
  filingDeadline: z.string().optional(),
  notes: z.string().optional(),
});

type GrievanceFormValues = z.infer<typeof grievanceSchema>;

interface GrievanceFormProps {
  initialData?: Grievance;
  onSuccess?: () => void;
}

export function GrievanceForm({ initialData, onSuccess }: GrievanceFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateGrievance();
  const updateMutation = useUpdateGrievance();
  
  const isEditing = !!initialData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<GrievanceFormValues>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: initialData ? {
      ownerName: initialData.ownerName,
      propertyAddress: initialData.propertyAddress,
      county: initialData.county,
      municipality: initialData.municipality,
      taxYear: initialData.taxYear,
      currentAssessment: initialData.currentAssessment,
      equalizationRate: initialData.equalizationRate || undefined,
      estimatedMarketValue: initialData.estimatedMarketValue,
      requestedAssessment: initialData.requestedAssessment,
      filingDeadline: initialData.filingDeadline || undefined,
      notes: initialData.notes || undefined,
    } : {
      taxYear: new Date().getFullYear(),
      county: "Nassau",
    },
  });

  const onSubmit = async (data: GrievanceFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: data,
        });
        toast({ title: "Grievance updated successfully" });
      } else {
        await createMutation.mutateAsync({
          data: data,
        });
        toast({ title: "Grievance created successfully" });
      }
      onSuccess?.();
    } catch (error) {
      toast({ 
        title: "Error saving grievance", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner Name</Label>
          <Input id="ownerName" placeholder="Jane Doe" {...form.register("ownerName")} />
          {form.formState.errors.ownerName && (
            <p className="text-sm text-destructive">{form.formState.errors.ownerName.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="propertyAddress">Property Address</Label>
          <Input id="propertyAddress" placeholder="123 Main St, Town, NY 12345" {...form.register("propertyAddress")} />
          {form.formState.errors.propertyAddress && (
            <p className="text-sm text-destructive">{form.formState.errors.propertyAddress.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Select 
            onValueChange={(val) => form.setValue("county", val)} 
            defaultValue={form.getValues("county")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nassau">Nassau</SelectItem>
              <SelectItem value="Suffolk">Suffolk</SelectItem>
              <SelectItem value="Westchester">Westchester</SelectItem>
              <SelectItem value="New York City">New York City</SelectItem>
              <SelectItem value="Erie">Erie</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="municipality">Municipality / Town</Label>
          <Input id="municipality" placeholder="e.g. Town of Hempstead" {...form.register("municipality")} />
        </div>
      </div>

      <div className="bg-secondary/30 p-4 rounded-xl border border-secondary space-y-4">
        <h4 className="font-serif font-semibold text-lg">Assessment Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxYear">Tax Year</Label>
            <Input id="taxYear" type="number" {...form.register("taxYear")} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="equalizationRate">Equalization Rate (%)</Label>
            <Input id="equalizationRate" type="number" step="0.01" placeholder="e.g. 0.17" {...form.register("equalizationRate")} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filingDeadline">Filing Deadline</Label>
            <Input id="filingDeadline" type="date" {...form.register("filingDeadline")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentAssessment">Current Assessment ($)</Label>
            <Input id="currentAssessment" type="number" {...form.register("currentAssessment")} />
            {form.formState.errors.currentAssessment && (
              <p className="text-sm text-destructive">{form.formState.errors.currentAssessment.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedMarketValue">Est. Market Value ($)</Label>
            <Input id="estimatedMarketValue" type="number" {...form.register("estimatedMarketValue")} />
            <p className="text-xs text-muted-foreground">What the property would sell for.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requestedAssessment">Requested Assessment ($)</Label>
            <Input id="requestedAssessment" type="number" {...form.register("requestedAssessment")} />
            <p className="text-xs text-muted-foreground">Often: Est Market Value × Eq. Rate</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Case Notes</Label>
        <Textarea id="notes" placeholder="Any special conditions? (e.g. recent fire, needed repairs)" className="min-h-24" {...form.register("notes")} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-lg shadow-primary/20"
        >
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Case"}
        </Button>
      </div>
    </form>
  );
}
