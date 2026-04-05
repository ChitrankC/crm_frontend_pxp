"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSheetImportSettings,
  updateSheetImportSettings,
  syncSheetImport,
} from "@/services/api";
import type { User } from "@/services/api";

export default function SheetImportPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["sheet-import-settings"],
    queryFn: () => getSheetImportSettings(),
    enabled: !!user,
  });

  useEffect(() => {
    if (settings?.sheet_import_url != null) {
      setUrlDraft(settings.sheet_import_url);
    }
  }, [settings?.sheet_import_url]);

  const saveMutation = useMutation({
    mutationFn: (nextUrl: string | null) =>
      updateSheetImportSettings({ sheet_import_url: nextUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheet-import-settings"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      syncSheetImport({
        skip_duplicates: true,
        ...(urlDraft.trim() ? { url: urlDraft.trim() } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });

  const isClientAdmin = user?.role === "ClientAdmin";

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sheet import</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Each client workspace can point at a CSV source (typically a published Google Sheet). Rows become prospects;
            sportsbooks become linked accounts when a Sportsbook column is present.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Google Sheets / CSV URL</CardTitle>
            <CardDescription>
              Paste either the regular spreadsheet link (we convert it to CSV export) or a direct CSV link. The sheet must
              be accessible without logging in—use{" "}
              <span className="font-medium text-foreground">File → Share → Publish to web</span> and choose CSV, or share
              “Anyone with the link” and use the spreadsheet URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

            {isClientAdmin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sheet-url">CSV / Sheet URL</Label>
                  <Input
                    id="sheet-url"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    onClick={() =>
                      saveMutation.mutate(urlDraft.trim() ? urlDraft.trim() : null)
                    }
                    disabled={saveMutation.isPending}
                  >
                    Save URL
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setUrlDraft("");
                      saveMutation.mutate(null);
                    }}
                    disabled={saveMutation.isPending}
                  >
                    Clear
                  </Button>
                </div>
                {saveMutation.isError && (
                  <p className="text-sm text-destructive">Could not save settings.</p>
                )}
                {saveMutation.isSuccess && (
                  <p className="text-sm text-muted-foreground">Saved.</p>
                )}
              </>
            )}

            {!isClientAdmin && user?.role === "SalesRep" && (
              <p className="text-sm text-muted-foreground">
                {settings?.configured
                  ? "A sheet URL is configured for your company. You can run an import below."
                  : "Your admin has not configured a sheet URL yet."}
              </p>
            )}

            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Expected columns</p>
              <p className="text-sm text-muted-foreground">
                Headers are matched flexibly (case and spacing ignored). Common names we recognize include{" "}
                <span className="font-medium text-foreground">Name</span>,{" "}
                <span className="font-medium text-foreground">Email</span>,{" "}
                <span className="font-medium text-foreground">Number</span> / Phone,{" "}
                <span className="font-medium text-foreground">Sportsbook</span>,{" "}
                <span className="font-medium text-foreground">Losses</span>, plus Date, Time Period, Total Deposits, Avr.
                Bet Size, Work, Statement, Host, VIP, Result—extra fields are stored in notes.
              </p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <Button
                type="button"
                onClick={() => syncMutation.mutate()}
                disabled={
                  syncMutation.isPending || (!settings?.configured && !urlDraft.trim())
                }
              >
                {syncMutation.isPending ? "Importing…" : "Import now"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Skips rows with no name/email. With “Import now”, duplicates are skipped when the same email or phone
                already exists for your workspace.
              </p>
              {syncMutation.isSuccess && syncMutation.data && (
                <p className="text-sm">
                  Imported {syncMutation.data.imported}, skipped empty rows {syncMutation.data.skipped}, skipped
                  duplicates {syncMutation.data.skipped_duplicates}, errors {syncMutation.data.errors}.
                </p>
              )}
              {syncMutation.isError && (
                <p className="text-sm text-destructive">
                  Import failed. Check the URL, publishing settings, and that the first row contains headers.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
