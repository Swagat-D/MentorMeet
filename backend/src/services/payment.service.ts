// backend/src/services/payment.service.ts - Mock Payment Service for Development
interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata?: any;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
}

class PaymentService {
  private static instance: PaymentService;
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Process payment for booking
   * This is a mock implementation for development
   * In production, integrate with Stripe, Razorpay, PayPal, etc.
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('💳 Processing payment:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        paymentMethodId: paymentData.paymentMethodId
      });

      // Validate payment method ID format
      if (!paymentData.paymentMethodId || paymentData.paymentMethodId.length < 10) {
        return {
          success: false,
          error: 'Invalid payment method. Please check your payment details.'
        };
      }

      // Validate amount
      if (paymentData.amount <= 0) {
        return {
          success: false,
          error: 'Invalid payment amount.'
        };
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success rate (95% success for testing)
      const isSuccessful = Math.random() > 0.05;
      
      if (isSuccessful) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('✅ Payment processed successfully:', {
          paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency
        });
        
        return {
          success: true,
          paymentId,
        };
      } else {
        const errorMessages = [
          'Payment was declined by your bank. Please try a different payment method.',
          'Insufficient funds in your account.',
          'Your card has expired. Please update your payment method.',
          'Payment processing failed. Please try again.',
          'Your card was declined. Please contact your bank.'
        ];
        
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        
        console.log('❌ Payment processing failed:', randomError);
        
        return {
          success: false,
          error: randomError,
        };
      }
      
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed due to a technical error. Please try again.',
      };
    }
  }

  /**
   * Refund a payment
   * Mock implementation for development
   */
  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      console.log('💰 Processing refund:', { 
        paymentId, 
        amount,
        timestamp: new Date().toISOString()
      });

      // Validate payment ID format
      if (!paymentId || !paymentId.startsWith('pay_')) {
        return {
          success: false,
          error: 'Invalid payment ID for refund.'
        };
      }

      // Simulate refund processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate high refund success rate (98% success)
      const isSuccessful = Math.random() > 0.02;
      
      if (isSuccessful) {
        const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('✅ Refund processed successfully:', {
          refundId,
          originalPaymentId: paymentId,
          amount: amount || 'full amount'
        });
        
        return {
          success: true,
          paymentId: refundId,
        };
      } else {
        console.log('❌ Refund processing failed for payment:', paymentId);
        
        return {
          success: false,
          error: 'Refund processing failed. Please contact support.',
        };
      }
      
    } catch (error: any) {
      console.error('❌ Refund processing error:', error);
      return {
        success: false,
        error: 'Refund processing failed due to a technical error.',
      };
    }
  }

  /**
   * Validate payment method
   * Mock implementation for development
   */
  async validatePaymentMethod(paymentMethodId: string): Promise<{
    valid: boolean;
    cardType?: string;
    lastFour?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }> {
    try {
      console.log('🔍 Validating payment method:', paymentMethodId);

      // Basic format validation
      if (!paymentMethodId || paymentMethodId.length < 10) {
        return { valid: false };
      }

      // Mock validation logic
      const isValid = paymentMethodId.startsWith('pm_') || 
                     paymentMethodId.startsWith('card_') ||
                     paymentMethodId.startsWith('test_');

      if (isValid) {
        // Mock card details
        const cardTypes = ['visa', 'mastercard', 'amex', 'discover'];
        const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
        const expiryMonth = Math.floor(1 + Math.random() * 12);
        const expiryYear = new Date().getFullYear() + Math.floor(1 + Math.random() * 5);

        console.log('✅ Payment method validated successfully');
        
        return {
          valid: true,
          cardType,
          lastFour,
          expiryMonth,
          expiryYear
        };
      }

      console.log('❌ Payment method validation failed');
      return { valid: false };
      
    } catch (error: any) {
      console.error('❌ Payment method validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Get payment details
   * Mock implementation for development
   */
  async getPaymentDetails(paymentId: string): Promise<{
    success: boolean;
    payment?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
      description?: string;
      refunded?: boolean;
      refundAmount?: number;
    };
    error?: string;
  }> {
    try {
      console.log('📄 Getting payment details:', paymentId);

      // Validate payment ID
      if (!paymentId || (!paymentId.startsWith('pay_') && !paymentId.startsWith('ref_'))) {
        return {
          success: false,
          error: 'Invalid payment ID'
        };
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock payment details
      const isRefund = paymentId.startsWith('ref_');
      const mockPayment = {
        id: paymentId,
        amount: Math.floor(50 + Math.random() * 200), // Random amount between 50-250
        currency: 'INR',
        status: isRefund ? 'refunded' : 'succeeded',
        createdAt: new Date().toISOString(),
        description: isRefund ? 'Refund for cancelled session' : 'Mentoring session payment',
        refunded: isRefund,
        refundAmount: isRefund ? Math.floor(50 + Math.random() * 200) : undefined
      };

      console.log('✅ Payment details retrieved successfully');
      
      return {
        success: true,
        payment: mockPayment
      };

    } catch (error: any) {
      console.error('❌ Error getting payment details:', error);
      return {
        success: false,
        error: 'Failed to retrieve payment details'
      };
    }
  }

  /**
   * Create payment intent
   * Mock implementation for development
   */
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    description?: string;
    metadata?: any;
  }): Promise<{
    success: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    error?: string;
  }> {
    try {
      console.log('🎯 Creating payment intent:', data);

      // Validate amount
      if (data.amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0'
        };
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock IDs
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 12)}`;

      console.log('✅ Payment intent created successfully:', paymentIntentId);

      return {
        success: true,
        clientSecret,
        paymentIntentId
      };

    } catch (error: any) {
      console.error('❌ Error creating payment intent:', error);
      return {
        success: false,
        error: 'Failed to create payment intent'
      };
    }
  }

  /**
   * Confirm payment intent
   * Mock implementation for development
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<PaymentResponse> {
    try {
      console.log('✅ Confirming payment intent:', { paymentIntentId, paymentMethodId });

      // Validate IDs
      if (!paymentIntentId.startsWith('pi_') || !paymentMethodId) {
        return {
          success: false,
          error: 'Invalid payment intent ID or payment method'
        };
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success rate (95%)
      const isSuccessful = Math.random() > 0.05;

      if (isSuccessful) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('✅ Payment intent confirmed successfully:', paymentId);
        
        return {
          success: true,
          paymentId
        };
      } else {
        const errorMessages = [
          'Your card was declined.',
          'Insufficient funds.',
          'Payment authentication failed.',
          'Card expired.'
        ];
        
        const error = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        
        return {
          success: false,
          error
        };
      }

    } catch (error: any) {
      console.error('❌ Error confirming payment intent:', error);
      return {
        success: false,
        error: 'Payment confirmation failed'
      };
    }
  }

  /**
   * Get supported payment methods
   * Mock implementation
   */
  async getSupportedPaymentMethods(): Promise<{
    success: boolean;
    methods?: Array<{
      type: string;
      name: string;
      supported: boolean;
      fees?: string;
    }>;
  }> {
    try {
      console.log('💳 Getting supported payment methods...');

      const methods = [
        {
          type: 'card',
          name: 'Credit/Debit Card',
          supported: true,
          fees: '2.9% + ₹3'
        },
        {
          type: 'upi',
          name: 'UPI',
          supported: true,
          fees: '0.5%'
        },
        {
          type: 'netbanking',
          name: 'Net Banking',
          supported: true,
          fees: '₹15 per transaction'
        },
        {
          type: 'wallet',
          name: 'Digital Wallets',
          supported: true,
          fees: '1.5%'
        },
        {
          type: 'emi',
          name: 'EMI',
          supported: false,
          fees: 'Varies by bank'
        }
      ];

      console.log('✅ Payment methods retrieved');

      return {
        success: true,
        methods
      };

    } catch (error: any) {
      console.error('❌ Error getting payment methods:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Process partial refund
   * Mock implementation
   */
  async processPartialRefund(paymentId: string, refundAmount: number, reason?: string): Promise<PaymentResponse> {
    try {
      console.log('💰 Processing partial refund:', { 
        paymentId, 
        refundAmount, 
        reason 
      });

      // Validate inputs
      if (!paymentId.startsWith('pay_') || refundAmount <= 0) {
        return {
          success: false,
          error: 'Invalid payment ID or refund amount'
        };
      }

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ Partial refund processed:', refundId);

      return {
        success: true,
        paymentId: refundId
      };

    } catch (error: any) {
      console.error('❌ Partial refund error:', error);
      return {
        success: false,
        error: 'Partial refund failed'
      };
    }
  }

  /**
   * Get transaction history
   * Mock implementation
   */
  async getTransactionHistory(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    success: boolean;
    transactions?: Array<{
      id: string;
      type: 'payment' | 'refund';
      amount: number;
      currency: string;
      status: string;
      description: string;
      createdAt: string;
    }>;
    total?: number;
  }> {
    try {
      console.log('📊 Getting transaction history:', filters);

      const { limit = 10, offset = 0 } = filters;

      // Generate mock transactions
      const mockTransactions = [];
      const transactionCount = Math.min(limit, 20); // Max 20 for demo

      for (let i = 0; i < transactionCount; i++) {
        const isRefund = Math.random() > 0.8;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

        mockTransactions.push({
          id: isRefund ? `ref_${Date.now()}_${i}` : `pay_${Date.now()}_${i}`,
          type: isRefund ? 'refund' as const : 'payment' as const,
          amount: Math.floor(50 + Math.random() * 200),
          currency: 'INR',
          status: Math.random() > 0.1 ? 'succeeded' : 'failed',
          description: isRefund ? 'Session cancellation refund' : 'Mentoring session payment',
          createdAt: createdAt.toISOString()
        });
      }

      // Sort by date (newest first)
      mockTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('✅ Transaction history retrieved:', mockTransactions.length);

      return {
        success: true,
        transactions: mockTransactions,
        total: mockTransactions.length
      };

    } catch (error: any) {
      console.error('❌ Error getting transaction history:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Check payment status
   * Mock implementation
   */
  async checkPaymentStatus(paymentId: string): Promise<{
    success: boolean;
    status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
    error?: string;
  }> {
    try {
      console.log('🔍 Checking payment status:', paymentId);

      if (!paymentId || (!paymentId.startsWith('pay_') && !paymentId.startsWith('ref_'))) {
        return {
          success: false,
          error: 'Invalid payment ID'
        };
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Mock status logic
      let status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
      
      if (paymentId.startsWith('ref_')) {
        status = 'refunded';
      } else {
        const statuses: typeof status[] = ['succeeded', 'failed', 'processing', 'pending'];
        // 80% success rate for demo
        const weights = [0.8, 0.1, 0.05, 0.05];
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (random <= cumulative) {
            status = statuses[i];
            break;
          }
        }
        status = status! || 'succeeded';
      }

      console.log('✅ Payment status checked:', status);

      return {
        success: true,
        status
      };

    } catch (error: any) {
      console.error('❌ Error checking payment status:', error);
      return {
        success: false,
        error: 'Failed to check payment status'
      };
    }
  }

  /**
   * Generate payment report
   * Mock implementation for admin/analytics
   */
  async generatePaymentReport(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<{
    success: boolean;
    report?: {
      period: string;
      totalTransactions: number;
      totalAmount: number;
      successfulPayments: number;
      refunds: number;
      averageTransactionValue: number;
      currency: string;
    };
  }> {
    try {
      console.log('📈 Generating payment report for period:', period);

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock report data
      const baseTransactions = period === 'daily' ? 50 : 
                             period === 'weekly' ? 350 : 
                             period === 'monthly' ? 1500 : 18000;

      const totalTransactions = baseTransactions + Math.floor(Math.random() * 100);
      const successRate = 0.85 + Math.random() * 0.1; // 85-95% success rate
      const successfulPayments = Math.floor(totalTransactions * successRate);
      const refunds = Math.floor(successfulPayments * 0.05); // 5% refund rate
      const avgAmount = 75 + Math.random() * 100; // Average ₹75-175
      const totalAmount = Math.floor(successfulPayments * avgAmount);

      const report = {
        period,
        totalTransactions,
        totalAmount,
        successfulPayments,
        refunds,
        averageTransactionValue: Math.floor(avgAmount),
        currency: 'INR'
      };

      console.log('✅ Payment report generated:', report);

      return {
        success: true,
        report
      };

    } catch (error: any) {
      console.error('❌ Error generating payment report:', error);
      return {
        success: false
      };
    }
  }
}

// Export singleton instance
const paymentService = PaymentService.getInstance();
export default paymentService;
export { paymentService };