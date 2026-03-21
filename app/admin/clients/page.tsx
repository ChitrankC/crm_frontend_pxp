"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createTenant, listTenants, updateTenantStatus, createClientAdmin } from "@/services/api";
import type { Tenant } from "@/services/api";
import { Fragment } from "react";
import { Plus, LogIn } from "lucide-react";

export default function AdminClientsPage() {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [addLoginFor, setAddLoginFor] = useState<Tenant | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const { data: tenants = [], isLoading } = useQuery({ queryKey: ["tenants"], queryFn: listTenants });
  const create = useMutation({
    mutationFn: async () => {
      const tenant = await createTenant(companyName);
      await createClientAdmin(tenant.id, { name: adminName, email: adminEmail, password: adminPassword });
      return tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setCompanyName("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setShowForm(false);
      alert("Client and login created. They can sign in at /login with the email and password you set.");
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTenantStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
  const addLogin = useMutation({
    mutationFn: ({ tenantId, name, email, password }: { tenantId: string; name: string; email: string; password: string }) =>
      createClientAdmin(tenantId, { name, email, password }),
    onSuccess: (_, { name, email }) => {
      setAddLoginFor(null);
      setLoginName("");
      setLoginEmail("");
      setLoginPassword("");
      alert(`Login created for ${name} (${email}). They can sign in at /login with this email and the password you set.`);
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clients (Tenants)</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" /> Create client
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New client + login</CardTitle>
              <p className="text-sm text-muted-foreground">Create the company and their admin login in one step.</p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <Label>Company name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Admin name</Label>
                    <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Jane Doe" required />
                  </div>
                  <div>
                    <Label>Login email</Label>
                    <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@acme.com" required />
                  </div>
                  <div>
                    <Label>Login password</Label>
                    <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={create.isPending}>Create client & login</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Company</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Created</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <Fragment key={t.id}>
                        <tr className="border-b hover:bg-muted/30">
                          <td className="p-4 font-medium">{t.company_name}</td>
                          <td className="p-4">
                            <Badge variant={t.subscription_status === "ACTIVE" ? "default" : "secondary"}>
                              {t.subscription_status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddLoginFor(addLoginFor?.id === t.id ? null : t)}
                            >
                              <LogIn className="h-4 w-4 mr-1" /> Add login
                            </Button>
                            <select
                              className="h-8 rounded border px-2 text-sm"
                              value={t.subscription_status}
                              onChange={(e) => updateStatus.mutate({ id: t.id, status: e.target.value })}
                            >
                              <option value="TRIAL">Trial</option>
                              <option value="ACTIVE">Active</option>
                              <option value="SUSPENDED">Suspended</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                        {addLoginFor?.id === t.id && (
                          <tr className="border-b bg-muted/20">
                            <td colSpan={4} className="p-4">
                              <Card className="max-w-md">
                                <CardHeader className="py-3">
                                  <CardTitle className="text-base">Create login for {t.company_name}</CardTitle>
                                  <p className="text-sm text-muted-foreground">They will use this to sign in at /login</p>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      addLogin.mutate({
                                        tenantId: t.id,
                                        name: loginName,
                                        email: loginEmail,
                                        password: loginPassword,
                                      });
                                    }}
                                    className="space-y-3"
                                  >
                                    <div>
                                      <Label>Name</Label>
                                      <Input value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="Jane Doe" required />
                                    </div>
                                    <div>
                                      <Label>Email (login)</Label>
                                      <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@company.com" required />
                                    </div>
                                    <div>
                                      <Label>Password</Label>
                                      <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button type="submit" disabled={addLogin.isPending}>Create login</Button>
                                      <Button type="button" variant="outline" onClick={() => setAddLoginFor(null)}>Cancel</Button>
                                    </div>
                                  </form>
                                </CardContent>
                              </Card>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
