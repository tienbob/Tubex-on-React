import { useState, useCallback } from 'react';
import { paymentService, Payment, CreatePaymentInput, UpdatePaymentInput, ReconcilePaymentRequest } from '../services/api/paymentService';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPayments = useCallback(async (filters?: any): Promise<Payment[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPayments(filters);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch payments');
      return null;
    }
  }, []);

  const getPaymentById = useCallback(async (paymentId: string): Promise<Payment | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentById(paymentId);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch payment details');
      return null;
    }
  }, []);

  const createPayment = useCallback(async (paymentData: CreatePaymentInput): Promise<Payment | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createPayment(paymentData);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to create payment');
      return null;
    }
  }, []);

  const updatePayment = useCallback(async (paymentId: string, updateData: UpdatePaymentInput): Promise<Payment | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.updatePayment(paymentId, updateData);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to update payment');
      return null;
    }
  }, []);

  const deletePayment = useCallback(async (paymentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await paymentService.deletePayment(paymentId);
      setLoading(false);
      return true;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to delete payment');
      return false;
    }
  }, []);

  const reconcilePayment = useCallback(async (paymentId: string, data: ReconcilePaymentRequest): Promise<Payment | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.reconcilePayment(paymentId, data);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to reconcile payment');
      return null;
    }
  }, []);

  return {
    loading,
    error,
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
    reconcilePayment
  };
};
