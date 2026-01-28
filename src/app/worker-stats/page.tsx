'use client';

import { useState, useEffect, useCallback } from 'react';
import { Worker } from '@/types';
import {
  Users,
  RefreshCw,
  Car,
  DollarSign,
  Coins,
  CreditCard,
  Banknote,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

interface WorkerStats {
  worker: Worker | null;
  stats: {
    totalCars: number;
    finishedCars: number;
    totalRevenue: number;
    totalTips: number;
    instapayTips: number;
    cashTips: number;
    cashRevenue: number;
    instapayRevenue: number;
    netRevenue: number;
    byWashType: {
      INNER: number;
      OUTER: number;
      FULL: number;
      FREE: number;
    };
  };
}

interface StatsData {
  period: string;
  startDate: string;
  endDate: string;
  workerStats: WorkerStats[];
  totals: {
    totalCars: number;
    finishedCars: number;
    totalRevenue: number;
    totalTips: number;
    instapayTips: number;
    cashTips: number;
    cashRevenue: number;
    instapayRevenue: number;
    netRevenue: number;
  };
}

export default function WorkerStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/worker-stats?period=${period}`;
      if (period === 'day' || period === 'week') {
        url += `&date=${selectedDate}`;
      } else if (period === 'month') {
        url += `&month=${selectedMonth}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    if (period === 'day') {
      date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else if (period === 'week') {
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatDateRange = () => {
    if (!stats) return '';
    const start = new Date(stats.startDate);
    const end = new Date(stats.endDate);
    
    if (period === 'day') {
      return start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (period === 'week') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return start.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Statistics</h1>
          <p className="text-gray-500">Track performance and earnings</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Period Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  period === p
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
            <button
              onClick={() => period === 'month' ? navigateMonth('prev') : navigateDate('prev')}
              className="btn btn-sm btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg min-w-[200px] justify-center">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">{formatDateRange()}</span>
            </div>

            <button
              onClick={() => period === 'month' ? navigateMonth('next') : navigateDate('next')}
              className="btn btn-sm btn-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading && <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />}
        </div>
      </div>

      {/* Totals Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="card p-4 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Cars</p>
                <p className="text-xl font-bold text-blue-600">{stats.totals.totalCars}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">{stats.totals.totalRevenue} EGP</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Tips</p>
                <p className="text-xl font-bold text-purple-600">{stats.totals.totalTips} EGP</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">InstaPay Tips</p>
                <p className="text-xl font-bold text-amber-600">{stats.totals.instapayTips} EGP</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Net Revenue</p>
                <p className="text-xl font-bold text-emerald-600">{stats.totals.netRevenue} EGP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Stats Table */}
      {stats && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Worker Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th className="text-center">Cars</th>
                  <th className="text-center">Inner</th>
                  <th className="text-center">Outer</th>
                  <th className="text-center">Full</th>
                  <th className="text-center">Free</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Banknote className="w-4 h-4" />
                      Cash Tips
                    </span>
                  </th>
                  <th className="text-right">
                    <span className="flex items-center justify-end gap-1 text-amber-600">
                      <CreditCard className="w-4 h-4" />
                      InstaPay Tips
                    </span>
                  </th>
                  <th className="text-right">Total Tips</th>
                  <th className="text-right">
                    <span className="text-emerald-600">Net Revenue</span>
                    <span className="block text-xs font-normal text-gray-500">(Revenue - InstaPay Tips)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.workerStats.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-gray-500">
                      No data for this period
                    </td>
                  </tr>
                ) : (
                  <>
                    {stats.workerStats.map((ws, index) => (
                      <tr key={ws.worker?.id || 'unassigned'} className="animate-fade-in">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              'w-9 h-9 rounded-full flex items-center justify-center',
                              ws.worker ? 'bg-primary-100' : 'bg-gray-100'
                            )}>
                              <span className={clsx(
                                'font-semibold text-sm',
                                ws.worker ? 'text-primary-700' : 'text-gray-500'
                              )}>
                                {ws.worker ? ws.worker.name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {ws.worker?.name || 'Unassigned'}
                              </p>
                              {!ws.worker && (
                                <p className="text-xs text-gray-400">No worker assigned</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="font-semibold text-gray-900">{ws.stats.totalCars}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-blue">{ws.stats.byWashType.INNER}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-green">{ws.stats.byWashType.OUTER}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-purple">{ws.stats.byWashType.FULL}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-gray">{ws.stats.byWashType.FREE}</span>
                        </td>
                        <td className="text-right font-medium text-gray-900">
                          {ws.stats.totalRevenue} EGP
                        </td>
                        <td className="text-right text-green-600 font-medium">
                          {ws.stats.cashTips} EGP
                        </td>
                        <td className="text-right">
                          {ws.stats.instapayTips > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                              <CreditCard className="w-3.5 h-3.5" />
                              {ws.stats.instapayTips} EGP
                            </span>
                          ) : (
                            <span className="text-gray-400">0 EGP</span>
                          )}
                        </td>
                        <td className="text-right font-medium text-purple-600">
                          {ws.stats.totalTips} EGP
                        </td>
                        <td className="text-right">
                          <span className="font-bold text-emerald-600">
                            {ws.stats.netRevenue} EGP
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="text-gray-900">Total</td>
                      <td className="text-center text-gray-900">{stats.totals.totalCars}</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-right text-gray-900">{stats.totals.totalRevenue} EGP</td>
                      <td className="text-right text-green-600">{stats.totals.cashTips} EGP</td>
                      <td className="text-right text-amber-600">{stats.totals.instapayTips} EGP</td>
                      <td className="text-right text-purple-600">{stats.totals.totalTips} EGP</td>
                      <td className="text-right text-emerald-600">{stats.totals.netRevenue} EGP</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanation Card */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Understanding the Numbers</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Revenue:</strong> Total amount paid for car washes (Cash + InstaPay)</li>
          <li><strong>Cash Tips:</strong> Tips received in cash (worker keeps directly)</li>
          <li><strong>InstaPay Tips:</strong> Tips received via InstaPay (need to be given to worker)</li>
          <li><strong>Net Revenue:</strong> Revenue minus InstaPay Tips = Amount business keeps after paying workers their InstaPay tips</li>
        </ul>
      </div>
    </div>
  );
}
