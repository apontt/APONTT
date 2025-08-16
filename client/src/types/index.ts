
export interface UserData {
  name: string;
  email: string;
  role: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface MetricsData {
  monthSales: number;
  newLeads: number;
  conversionRate: number;
  totalRevenue: number;
  activePartnets: number;
  signedContracts: number;
}
