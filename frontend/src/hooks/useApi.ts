import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Company,
  Worker,
  Document,
  Project,
  Contract,
  Alert,
  DashboardData,
  ApiResponse,
} from '@/types';

// ─── Empresas ──────────────────────────────────────────────

export function useCompanies(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['companies', page, limit],
    queryFn: ({ signal }) =>
      api.getPaginated<Company>(`/companies?page=${page}&limit=${limit}`, signal),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: ({ signal }) => api.get<ApiResponse<Company>>(`/companies/${id}`, signal),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Company>) => api.post<ApiResponse<Company>>('/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Company> & { id: string }) =>
      api.put<ApiResponse<Company>>(`/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<void>>(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

// ─── Trabajadores ──────────────────────────────────────────

export function useWorkers(companyId?: string, page = 1, limit = 10) {
  const params = new URLSearchParams();
  if (companyId) params.set('empresaId', companyId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['workers', { companyId, page, limit }],
    queryFn: ({ signal }) =>
      api.getPaginated<Worker>(`/workers?${params.toString()}`, signal),
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ['worker', id],
    queryFn: ({ signal }) => api.get<ApiResponse<Worker>>(`/workers/${id}`, signal),
    enabled: !!id,
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Worker>) => api.post<ApiResponse<Worker>>('/workers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Worker> & { id: string }) =>
      api.put<ApiResponse<Worker>>(`/workers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// ─── Documentos ────────────────────────────────────────────

export function useDocuments(
  filters?: {
    tipo?: string;
    estado?: string;
    empresaId?: string;
    trabajadorId?: string;
    page?: number;
    limit?: number;
  }
) {
  const params = new URLSearchParams();
  if (filters?.tipo) params.set('tipo', filters.tipo);
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.empresaId) params.set('empresaId', filters.empresaId);
  if (filters?.trabajadorId) params.set('trabajadorId', filters.trabajadorId);
  params.set('page', String(filters?.page || 1));
  params.set('limit', String(filters?.limit || 10));

  return useQuery({
    queryKey: ['documents', filters],
    queryFn: ({ signal }) =>
      api.getPaginated<Document>(`/documents?${params.toString()}`, signal),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: ({ signal }) => api.get<ApiResponse<Document>>(`/documents/${id}`, signal),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<ApiResponse<Document>>('/documents/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useReviewDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estadoAcreditacion,
      observaciones,
    }: {
      id: string;
      estadoAcreditacion: string;
      observaciones?: string;
    }) =>
      api.patch<ApiResponse<Document>>(`/documents/${id}/review`, {
        estadoAcreditacion,
        observaciones,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// ─── Alertas ───────────────────────────────────────────────

export function useAlerts(page = 1, limit = 5) {
  return useQuery({
    queryKey: ['alerts', page, limit],
    queryFn: ({ signal }) =>
      api.getPaginated<Alert>(`/alerts?page=${page}&limit=${limit}`, signal),
  });
}

export function useUnreadAlertsCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: ({ signal }) =>
      api.get<ApiResponse<{ count: number }>>('/alerts/unread-count', signal),
    refetchInterval: 30000,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<ApiResponse<Alert>>(`/alerts/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// ─── Dashboard ─────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) =>
      api.get<ApiResponse<DashboardData>>('/dashboard', signal),
  });
}

// ─── Proyectos ─────────────────────────────────────────────

export function useProjects(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['projects', page, limit],
    queryFn: ({ signal }) =>
      api.getPaginated<Project>(`/projects?page=${page}&limit=${limit}`, signal),
  });
}

// ─── Contratos ─────────────────────────────────────────────

export function useContracts(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['contracts', page, limit],
    queryFn: ({ signal }) =>
      api.getPaginated<Contract>(`/contracts?page=${page}&limit=${limit}`, signal),
  });
}
