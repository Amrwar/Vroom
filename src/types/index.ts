import { WashRecord, Worker, WashType, PaymentType, Status } from '@prisma/client';

export type { WashRecord, Worker, WashType, PaymentType, Status };

export type WashRecordWithWorker = WashRecord & {
  worker: Worker | null;
};

export interface DashboardStats {
  totalCars: number;
  inProgress: number;
  finished: number;
  totalRevenue: number;
  totalTips: number;
  totalCash: number;
  totalInstapay: number;
}

export interface SummaryByWashType {
  washType: WashType;
  count: number;
  revenue: number;
}

export interface SummaryByWorker {
  workerId: string | null;
  workerName: string;
  count: number;
  revenue: number;
  tips: number;
}

export interface MonthlyReport {
  records: WashRecordWithWorker[];
  stats: DashboardStats;
  byWashType: SummaryByWashType[];
  byWorker: SummaryByWorker[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FilterParams {
  status?: Status | 'ALL';
  washType?: WashType | 'ALL';
  workerId?: string | 'ALL';
  paymentType?: PaymentType | 'ALL';
  search?: string;
}
