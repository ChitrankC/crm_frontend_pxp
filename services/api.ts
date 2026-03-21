import axios from "axios";

const API_BASE = typeof window !== "undefined" ? "/api" : "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export type UserRole = "SuperAdmin" | "ClientAdmin" | "SalesRep";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  tenant_id?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

// Tenants (admin)
export interface Tenant {
  id: string;
  company_name: string;
  subscription_status: string;
  created_at: string;
}

export async function createTenant(company_name: string, subscription_status = "TRIAL") {
  const { data } = await api.post<Tenant>("/admin/create-tenant", { company_name, subscription_status });
  return data;
}

export async function listTenants() {
  const { data } = await api.get<Tenant[]>("/admin/tenants");
  return data;
}

export async function updateTenantStatus(tenantId: string, subscription_status: string) {
  const { data } = await api.put<Tenant>(`/admin/tenant-status/${tenantId}`, { subscription_status });
  return data;
}

/** Create a Client Admin user for a tenant so the company can log in at /login */
export async function createClientAdmin(tenantId: string, body: { name: string; email: string; password: string; phone?: string }) {
  const { data } = await api.post<{ id: string; email: string; tenant_id: string }>(
    "/admin/create-client-admin",
    { ...body, role: "ClientAdmin" },
    { params: { tenant_id: tenantId } }
  );
  return data;
}

/** Super Admin: stats per client for dashboard */
export interface AdminClientStats {
  tenant_id: string;
  company_name: string;
  subscription_status: string;
  total_prospects: number;
  deals_in_pipeline: number;
  meetings_today: number;
  closed_deals: number;
}

export async function getAdminDashboardStats() {
  const { data } = await api.get<AdminClientStats[]>("/admin/dashboard-stats");
  return data;
}

// Prospects
export interface Prospect {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  total_losses?: number | string;
  notes?: string;
  status: string;
  assigned_rep?: string;
  created_at: string;
  accounts?: Account[];
}

export interface Account {
  id: string;
  prospect_id?: string;
  account_name: string;
  loss_amount: number | string;
  deal_percentage: number | string;
  deal_value: number | string;
}

export async function listProspects(params?: { location?: string; status?: string; assigned_rep?: string; loss_amount_min?: number; loss_amount_max?: number }) {
  const { data } = await api.get<Prospect[]>("/prospects", { params });
  return data;
}

export async function getProspect(id: string) {
  const { data } = await api.get<Prospect>(`/prospects/${id}`);
  return data;
}

export async function createProspect(p: Partial<Prospect> & { name: string; tenant_id?: string }) {
  const { data } = await api.post<Prospect>("/prospects", p);
  return data;
}

export async function updateProspect(id: string, p: Partial<Prospect>) {
  const { data } = await api.put<Prospect>(`/prospects/${id}`, p);
  return data;
}

export async function deleteProspect(id: string) {
  await api.delete(`/prospects/${id}`);
}

export async function updateProspectStatus(id: string, status: string) {
  const { data } = await api.put<Prospect>(`/prospects/${id}/status`, { status });
  return data;
}

export async function listAccounts(prospectId: string) {
  const { data } = await api.get<Account[]>(`/prospects/${prospectId}/accounts`);
  return data;
}

export async function createAccount(prospectId: string, acc: Omit<Account, "id" | "prospect_id">) {
  const { data } = await api.post<Account>(`/prospects/${prospectId}/accounts`, { ...acc, prospect_id: prospectId });
  return data;
}

export async function updateAccount(accountId: string, acc: Partial<Account>) {
  const { data } = await api.put<Account>(`/prospects/accounts/${accountId}`, acc);
  return data;
}

// Meetings
export interface Meeting {
  id: string;
  tenant_id: string;
  prospect_id: string;
  assigned_rep?: string;
  meeting_date: string;
  meeting_time?: string;
  notes?: string;
  created_at: string;
}

export async function listMeetings(params?: { prospect_id?: string; from_date?: string; to_date?: string }) {
  const { data } = await api.get<Meeting[]>("/meetings", { params });
  return data;
}

export async function createMeeting(m: { prospect_id: string; assigned_rep?: string; meeting_date: string; meeting_time?: string; notes?: string }) {
  const { data } = await api.post<Meeting>("/meetings", m);
  return data;
}

export async function deleteMeeting(id: string) {
  await api.delete(`/meetings/${id}`);
}

// Messages
export interface Message {
  id: string;
  tenant_id: string;
  prospect_id: string;
  message: string;
  channel: string;
  status: string;
  sent_at: string;
}

export async function sendMessage(prospectId: string, message: string, channel: string) {
  const { data } = await api.post<Message>("/messages/send", { prospect_id: prospectId, message, channel });
  return data;
}

export async function listMessages(prospectId?: string) {
  const { data } = await api.get<Message[]>("/messages/history", { params: prospectId ? { prospect_id: prospectId } : {} });
  return data;
}

// Calls
export interface Call {
  id: string;
  tenant_id: string;
  prospect_id: string;
  rep_id: string;
  call_status: string;
  duration: number;
  created_at: string;
}

export async function initiateCall(prospectId: string) {
  const { data } = await api.post<{ ok: boolean; call_sid?: string; call_id?: string }>("/calls/initiate", null, { params: { prospect_id: prospectId } });
  return data;
}

export async function listCalls(prospectId?: string) {
  const { data } = await api.get<Call[]>("/calls/history", { params: prospectId ? { prospect_id: prospectId } : {} });
  return data;
}

// Dashboard
export interface DashboardStats {
  total_prospects: number;
  deals_in_pipeline: number;
  meetings_today: number;
  closed_deals: number;
}

export async function getDashboardStats(tenantId?: string) {
  const { data } = await api.get<DashboardStats>("/dashboard/stats", { params: tenantId ? { tenant_id: tenantId } : {} });
  return data;
}

// Users
export async function listUsers() {
  const { data } = await api.get<User[]>("/users");
  return data;
}
