'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import { setTokens } from './token-storage';
import type { AdRecord, AdminUser, Booking, Business, SearchParams, Service } from './types';

function toSearchQuery(params: SearchParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function useSearchBusinesses(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['business-search', params],
    queryFn: () => apiClient<Business[]>(`/search${toSearchQuery(params)}`),
    enabled
  });
}

export function useBusiness(businessId: string) {
  return useQuery({
    queryKey: ['business', businessId],
    queryFn: () => apiClient<Business>(`/business/${businessId}`),
    enabled: Boolean(businessId)
  });
}

export function useBusinessServices(businessId: string, country = 'DE') {
  return useQuery({
    queryKey: ['business-services', businessId, country],
    queryFn: () => apiClient<Service[]>(`/business/${businessId}/services?country=${country}`),
    enabled: Boolean(businessId)
  });
}

export function useSlots(businessId: string, serviceId: string, date: string, staffId?: string) {
  return useQuery({
    queryKey: ['slots', businessId, serviceId, date, staffId],
    queryFn: () =>
      apiClient<string[] | Record<string, string[]>>(
        `/business/${businessId}/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}${
          staffId ? `&staffId=${encodeURIComponent(staffId)}` : ''
        }`
      ),
    enabled: Boolean(businessId && serviceId && date)
  });
}

export function useMyBookings(country = 'DE') {
  return useQuery({
    queryKey: ['my-bookings', country],
    queryFn: () => apiClient<Booking[]>(`/bookings/me?country=${country}`, { auth: true })
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiClient<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: (data) => {
      setTokens(data.tokens);
    }
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: { email: string; password: string; roles: string[] }) =>
      apiClient<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: (data) => {
      setTokens(data.tokens);
    }
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (payload: {
      businessId: string;
      serviceId: string;
      startTime: string;
      staffId?: string;
      country?: string;
    }) =>
      apiClient<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
        auth: true
      })
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient<AdminUser[]>('/admin/users', { auth: true })
  });
}

export function useUpdateAdminUser() {
  return useMutation({
    mutationFn: (payload: {
      userId: string;
      roles?: Array<'customer' | 'business' | 'admin'>;
      isActive?: boolean;
    }) =>
      apiClient<AdminUser>(`/admin/users/${payload.userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ roles: payload.roles, isActive: payload.isActive }),
        auth: true
      })
  });
}

export function useAdminAds() {
  return useQuery({
    queryKey: ['admin-ads'],
    queryFn: () => apiClient<AdRecord[]>('/admin/ads', { auth: true })
  });
}

export function useUpdateAdStatus() {
  return useMutation({
    mutationFn: (payload: { adId: string; status: AdRecord['status'] }) =>
      apiClient<AdRecord>(`/admin/ads/${payload.adId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: payload.status }),
        auth: true
      })
  });
}

export function useMyAds() {
  return useQuery({
    queryKey: ['my-ads'],
    queryFn: () => apiClient<AdRecord[]>('/ads/me', { auth: true })
  });
}

export function useCreateAd() {
  return useMutation({
    mutationFn: (payload: {
      businessId: string;
      title: string;
      description?: string;
      landingUrl?: string;
      budgetDaily?: number;
      country?: string;
      currency?: string;
    }) =>
      apiClient<AdRecord>('/ads', {
        method: 'POST',
        body: JSON.stringify(payload),
        auth: true
      })
  });
}
