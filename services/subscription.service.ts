/**
 * Subscription Service - Clean business logic separation
 * Handles RevenueCat operations without UI concerns
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/app';
import { APIResponse } from '@/types/api';

export interface SubscriptionConfig {
  apiKey: string;
  logLevel: LOG_LEVEL;
}

export interface PurchaseResult {
  customerInfo: CustomerInfo;
  isSubscribed: boolean;
}

export interface RestoreResult {
  customerInfo: CustomerInfo;
  isSubscribed: boolean;
  hadPreviousPurchases: boolean;
}

class SubscriptionService {
  private isInitialized = false;
  private config: SubscriptionConfig | null = null;

  constructor() {
    this.setupConfig();
  }

  private setupConfig(): void {
    const apiKey = Platform.select({
      ios: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android:
        Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    });

    if (!apiKey) {
      console.error('RevenueCat API key not found for platform:', Platform.OS);
      return;
    }

    this.config = {
      apiKey,
      logLevel: __DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR,
    };
  }

  async initialize(): Promise<APIResponse<boolean>> {
    try {
      if (!this.config) {
        return {
          success: false,
          data: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'RevenueCat configuration not found',
          },
        };
      }

      if (this.isInitialized) {
        return { success: true, data: true };
      }

      Purchases.setLogLevel(this.config.logLevel);
      await Purchases.configure({ apiKey: this.config.apiKey });

      this.isInitialized = true;

      return {
        success: true,
        data: true,
        message: 'RevenueCat initialized successfully',
      };
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      return {
        success: false,
        data: false,
        error: {
          code: 'INITIALIZATION_ERROR',
          message: 'Failed to initialize subscription service',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async getCustomerInfo(): Promise<APIResponse<CustomerInfo>> {
    try {
      await this.ensureInitialized();
      const customerInfo = await Purchases.getCustomerInfo();

      return {
        success: true,
        data: customerInfo,
      };
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return {
        success: false,
        data: {} as CustomerInfo,
        error: {
          code: 'CUSTOMER_INFO_ERROR',
          message: 'Failed to retrieve customer information',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async getOfferings(): Promise<APIResponse<PurchasesOffering[]>> {
    try {
      await this.ensureInitialized();
      const offerings = await Purchases.getOfferings();

      const offeringsArray = offerings.current ? [offerings.current] : [];

      return {
        success: true,
        data: offeringsArray,
      };
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return {
        success: false,
        data: [],
        error: {
          code: 'OFFERINGS_ERROR',
          message: 'Failed to retrieve subscription offerings',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async purchasePackage(
    packageToPurchase: PurchasesPackage
  ): Promise<APIResponse<PurchaseResult>> {
    try {
      await this.ensureInitialized();

      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);
      const isSubscribed = this.checkIfSubscribed(customerInfo);

      return {
        success: true,
        data: {
          customerInfo,
          isSubscribed,
        },
        message: isSubscribed
          ? SUCCESS_MESSAGES.SUBSCRIPTION_ACTIVATED
          : 'Purchase completed',
      };
    } catch (error: unknown) {
      console.error('Purchase failed:', error);

      // Handle user cancellation differently
      if ((error as { userCancelled?: boolean })?.userCancelled) {
        return {
          success: false,
          data: { customerInfo: {} as CustomerInfo, isSubscribed: false },
          error: {
            code: 'USER_CANCELLED',
            message: 'Purchase was cancelled by user',
          },
        };
      }

      return {
        success: false,
        data: { customerInfo: {} as CustomerInfo, isSubscribed: false },
        error: {
          code: 'PURCHASE_ERROR',
          message: ERROR_MESSAGES.SUBSCRIPTION_ERROR,
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async restorePurchases(): Promise<APIResponse<RestoreResult>> {
    try {
      await this.ensureInitialized();

      const customerInfo = await Purchases.restorePurchases();
      const isSubscribed = this.checkIfSubscribed(customerInfo);

      // Check if there were any previous purchases
      const hadPreviousPurchases =
        Object.keys(
          (
            customerInfo as CustomerInfo & {
              allPurchaseDatesByProduct?: Record<string, unknown>;
            }
          ).allPurchaseDatesByProduct || {}
        ).length > 0;

      return {
        success: true,
        data: {
          customerInfo,
          isSubscribed,
          hadPreviousPurchases,
        },
        message: isSubscribed
          ? SUCCESS_MESSAGES.PURCHASES_RESTORED
          : hadPreviousPurchases
            ? 'Previous purchases found but no active subscriptions'
            : 'No previous purchases found',
      };
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        data: {
          customerInfo: {} as CustomerInfo,
          isSubscribed: false,
          hadPreviousPurchases: false,
        },
        error: {
          code: 'RESTORE_ERROR',
          message: 'Failed to restore purchases',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  checkIfSubscribed(customerInfo: CustomerInfo): boolean {
    // RevenueCat recommends checking active entitlements only
    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  getMonthlyPackage(offerings: PurchasesOffering[]): PurchasesPackage | null {
    if (!offerings || offerings.length === 0) return null;
    return offerings[0].monthly ?? null;
  }

  getAnnualPackage(offerings: PurchasesOffering[]): PurchasesPackage | null {
    if (!offerings || offerings.length === 0) return null;
    return offerings[0].annual ?? null;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      const result = await this.initialize();
      if (!result.success) {
        throw new Error(
          result.error?.message || 'Failed to initialize subscription service'
        );
      }
    }
  }

  // Utility method to check subscription status without throwing
  async isUserSubscribed(): Promise<boolean> {
    try {
      const result = await this.getCustomerInfo();
      if (result.success) {
        return this.checkIfSubscribed(result.data);
      }
      return false;
    } catch {
      return false;
    }
  }

  // Method to get user ID for tracking purposes
  async getUserId(): Promise<string | null> {
    try {
      const result = await this.getCustomerInfo();
      if (result.success) {
        return result.data.originalAppUserId;
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
