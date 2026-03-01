'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import { setTokens } from './token-storage';
import type { Booking, Business, SearchParams, Service } from './types';

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

export function useSearchBusinesses(params: SearchParams) {
  return useQuery({
    queryKey: ['business-search', params],
    queryFn: () => apiClient<Business[]>(`/search${toSearchQuery(params)}`)
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
