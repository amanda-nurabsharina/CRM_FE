import { apiClient } from "./client";

export interface Branch {
  id: string;
  name: string;
  code: string;
  wa_phone_number: string;
  coverage_areas: string;
  is_active?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string;
  branch?: Branch;
  is_active?: boolean;
  created_at?: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone_number: string;
  domicile: string;
  source: string;
  status: string;
  branch_id?: string;
  branch?: Branch;
  handover_note?: string;
  first_response_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  lead?: Lead;
  branch_id: string;
  status: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "CUSTOMER" | "ADMIN" | "SYSTEM";
  sender_id: string;
  direction: "INBOUND" | "OUTBOUND";
  message_type: "TEXT" | "IMAGE" | "DOCUMENT" | "TEMPLATE";
  content: string;
  media_url?: string;
  status: string;
  sent_at: string;
}

export interface TourPackage {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  base_price: number;
  itinerary_json: string;
  terms_conditions: string;
  pdf_url: string;
  wa_template: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  lead_id: string;
  lead?: Lead;
  payment_type: "FULL" | "INSTALLMENT";
  total_amount: number;
  paid_amount: number;
  status: string;
  terms?: PaymentTerm[];
}

export interface PaymentTerm {
  id: string;
  invoice_id: string;
  term_number: number;
  amount: number;
  due_date: string;
  status: string;
  proofs?: PaymentProof[];
}

export interface PaymentProof {
  id: string;
  payment_term_id: string;
  proof_image_url: string;
  amount_transferred: number;
  bank_name: string;
  verification_status: string;
  verification_notes?: string;
  created_at: string;
}

export interface DashboardKPIs {
  total_leads: number;
  conversion_rate: number;
  total_revenue: number;
  outstanding_ar: number;
  leads_by_branch: Record<string, number>;
  revenue_by_branch: Record<string, number>;
  pipeline_funnel: Record<string, number>;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  branch_id?: string;
  action_type: string;
  entity_name: string;
  entity_id: string;
  before_value_json?: string;
  after_value_json?: string;
  created_at: string;
}

export const crmApi = {
  getBranches: async () => {
    const res = await apiClient.get("branches").json<{ data: Branch[] }>();
    return res.data;
  },

  updateBranch: async (id: string, data: { name: string; code: string; wa_phone_number: string; coverage_areas: string; is_active: boolean }) => {
    const res = await apiClient.put(`branches/${id}`, { json: data }).json<{ data: Branch }>();
    return res.data;
  },

  createBranch: async (data: { name: string; code: string; wa_phone_number: string; coverage_areas: string }) => {
    const res = await apiClient.post("branches", { json: data }).json<{ data: Branch }>();
    return res.data;
  },

  getUsers: async () => {
    const res = await apiClient.get("users").json<{ data: User[] }>();
    return res.data;
  },

  createUser: async (data: { name: string; email: string; password?: string; role?: string; branch_id?: string }) => {
    const res = await apiClient.post("users", { json: data }).json<{ data: User }>();
    return res.data;
  },

  getLeads: async (branchId?: string, status?: string) => {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append("branch_id", branchId);
    if (status) searchParams.append("status", status);
    const res = await apiClient.get("leads", { searchParams }).json<{ data: Lead[] }>();
    return res.data;
  },

  createLead: async (data: { customer_name: string; phone_number: string; domicile: string; source: string }) => {
    const res = await apiClient.post("leads", { json: data }).json<{ data: Lead }>();
    return res.data;
  },

  handoverLead: async (leadId: string, branchId: string, note: string) => {
    const res = await apiClient.post(`leads/${leadId}/handover`, { json: { branch_id: branchId, note } }).json<{ data: Lead }>();
    return res.data;
  },

  updateLeadStatus: async (leadId: string, status: string) => {
    const res = await apiClient.patch(`leads/${leadId}/status`, { json: { status } }).json<{ data: Lead }>();
    return res.data;
  },

  getConversations: async (branchId?: string) => {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append("branch_id", branchId);
    const res = await apiClient.get("conversations", { searchParams }).json<{ data: Conversation[] }>();
    return res.data;
  },

  getMessages: async (convId: string) => {
    const res = await apiClient.get(`conversations/${convId}/messages`).json<{ data: Message[] }>();
    return res.data;
  },

  sendMessage: async (convId: string, text: string) => {
    const res = await apiClient.post(`conversations/${convId}/messages`, { json: { text } }).json<{ data: Message }>();
    return res.data;
  },

  deleteConversation: async (convId: string) => {
    const res = await apiClient.delete(`conversations/${convId}`).json<{ message: string }>();
    return res;
  },

  getPackages: async () => {
    const res = await apiClient.get("packages").json<{ data: TourPackage[] }>();
    return res.data;
  },

  createPackage: async (data: { title: string; destination: string; duration_days: number; base_price: number; itinerary_json?: string; terms_conditions?: string; pdf_url?: string; wa_template?: string }) => {
    const res = await apiClient.post("packages", { json: data }).json<{ data: TourPackage }>();
    return res.data;
  },

  updatePackage: async (id: string, data: { title: string; destination: string; duration_days: number; base_price: number; itinerary_json?: string; terms_conditions?: string; pdf_url?: string; wa_template?: string; is_active?: boolean }) => {
    const res = await apiClient.put(`packages/${id}`, { json: data }).json<{ data: TourPackage }>();
    return res.data;
  },

  deletePackage: async (id: string) => {
    const res = await apiClient.delete(`packages/${id}`).json<{ message: string }>();
    return res;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("crm_token");
    const res = await fetch("http://localhost:8000/v1/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    return json.data as { url: string; file_name: string };
  },

  createQuotation: async (data: { lead_id: string; package_id: string; pax_count: number; price_per_pax: number; custom_price_reason?: string }) => {
    const res = await apiClient.post("quotations", { json: data }).json<{ data: any }>();
    return res.data;
  },

  getInvoices: async (branchId?: string) => {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append("branch_id", branchId);
    const res = await apiClient.get("invoices", { searchParams }).json<{ data: Invoice[] }>();
    return res.data;
  },

  createInvoice: async (data: { lead_id: string; quotation_id: string; payment_type: string; terms_count: number }) => {
    const res = await apiClient.post("invoices", { json: data }).json<{ data: Invoice }>();
    return res.data;
  },

  uploadProof: async (termId: string, data: { proof_image_url: string; amount: number; bank_name: string }) => {
    const res = await apiClient.post(`payment-terms/${termId}/proof`, { json: data }).json<{ data: PaymentProof }>();
    return res.data;
  },

  verifyProof: async (proofId: string, approved: boolean, notes: string) => {
    const res = await apiClient.post(`payment-proofs/${proofId}/verify`, { json: { approved, notes } }).json<{ data: any }>();
    return res.data;
  },

  getDashboardKPIs: async (branchId?: string) => {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append("branch_id", branchId);
    const res = await apiClient.get("analytics/dashboard", { searchParams }).json<{ data: DashboardKPIs }>();
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await apiClient.get("audit-logs").json<{ data: AuditLog[] }>();
    return res.data;
  },
};
