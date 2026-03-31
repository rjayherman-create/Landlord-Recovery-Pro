import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CaseState = "NY" | "NJ" | "TX" | "FL";
export type CaseStatus = "draft" | "submitted" | "hearing_scheduled" | "approved" | "denied";

export interface Case {
  id: string;
  state: CaseState;
  propertyAddress: string;
  county: string;
  municipality: string;
  parcelId: string;
  ownerName: string;
  currentAssessment: number;
  estimatedMarketValue: number;
  requestedAssessment: number;
  taxYear: number;
  status: CaseStatus;
  approvalScore: number;
  createdAt: string;
  notes: string;
}

interface CasesContextValue {
  cases: Case[];
  addCase: (c: Omit<Case, "id" | "createdAt" | "status">) => Case;
  updateCase: (id: string, updates: Partial<Case>) => void;
  deleteCase: (id: string) => void;
  isLoaded: boolean;
}

const CasesContext = createContext<CasesContextValue | null>(null);
const STORAGE_KEY = "taxappeal_cases_v1";

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setCases(JSON.parse(raw));
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    }
  }, [cases, isLoaded]);

  function addCase(data: Omit<Case, "id" | "createdAt" | "status">): Case {
    const newCase: Case = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    setCases((prev) => [newCase, ...prev]);
    return newCase;
  }

  function updateCase(id: string, updates: Partial<Case>) {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  function deleteCase(id: string) {
    setCases((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <CasesContext.Provider value={{ cases, addCase, updateCase, deleteCase, isLoaded }}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within CasesProvider");
  return ctx;
}
