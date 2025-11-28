/**
 * API Proxy Service - Security Layer
 * Handles API key protection and request validation
 */

import { APIResponse, APIError } from '@/types/api';

export interface ProxyRequest {
  endpoint: string;
  method: 'GET' | 'POST';
  params?: Record<string, any>;
  body?: Record<string, any>;
  apiType: 'tmdb' | 'google';
}

export interface ProxyResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * API Proxy Service
 *
 * In a production environment, this would typically be implemented
 * as a backend service to avoid exposing API keys on the client side.
 *
 * For this example, we demonstrate the pattern but note that in a real
 * implementation, sensitive API keys should never be exposed to clients.
 */
class APIProxyService {
  private baseUrl: string;
  private isProxyAvailable: boolean;

  constructor() {
    // In production, this would be your backend API URL
    this.baseUrl = __DEV__
      ? 'http://localhost:3001/api'
      : 'https://api.fastflix.app/proxy';

    this.isProxyAvailable = false; // Set to true when proxy backend is available
  }

  /**
   * Check if proxy service is available
   * In development, falls back to direct API calls (not recommended for production)
   */
  async checkProxyAvailability(): Promise<boolean> {
    if (__DEV__) {
      // In development, allow direct API calls
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      } as any);

      this.isProxyAvailable = response.ok;
      return this.isProxyAvailable;
    } catch {
      this.isProxyAvailable = false;
      return false;
    }
  }

  /**
   * Make a proxied API request
   * Routes requests through secure backend to protect API keys
   */
  async makeProxyRequest<T>(request: ProxyRequest): Promise<APIResponse<T>> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          data: {} as T,
          error: validationError,
        };
      }

      // Check if proxy is available
      const isProxyAvailable = await this.checkProxyAvailability();

      if (!isProxyAvailable) {
        return {
          success: false,
          data: {} as T,
          error: {
            code: 'PROXY_UNAVAILABLE',
            message:
              'API proxy service is not available. Direct API calls are disabled for security.',
          },
        };
      }

      // Make proxied request
      const response = await fetch(`${this.baseUrl}/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.2.3',
          'X-Platform': 'mobile',
        },
        body: JSON.stringify(request),
        timeout: 30000,
      } as any);

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.result,
      };
    } catch (error) {
      console.error('Proxy request failed:', error);

      return {
        success: false,
        data: {} as T,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to execute proxied request',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  /**
   * Validate proxy request for security
   */
  private validateRequest(request: ProxyRequest): APIError | null {
    // Check required fields
    if (!request.endpoint || typeof request.endpoint !== 'string') {
      return {
        code: 'INVALID_ENDPOINT',
        message: 'Valid endpoint is required',
      };
    }

    if (!request.method || !['GET', 'POST'].includes(request.method)) {
      return {
        code: 'INVALID_METHOD',
        message: 'Valid HTTP method is required',
      };
    }

    if (!request.apiType || !['tmdb', 'google'].includes(request.apiType)) {
      return {
        code: 'INVALID_API_TYPE',
        message: 'Valid API type is required',
      };
    }

    // Validate endpoint patterns for security
    const allowedPatterns = {
      tmdb: [
        /^\/search\/multi$/,
        /^\/movie\/\d+$/,
        /^\/tv\/\d+$/,
        /^\/movie\/\d+\/watch\/providers$/,
        /^\/tv\/\d+\/watch\/providers$/,
        /^\/movie\/\d+\/credits$/,
        /^\/tv\/\d+\/credits$/,
      ],
      google: [/^\/generateContent$/],
    };

    const patterns = allowedPatterns[request.apiType];
    const isValidEndpoint = patterns.some(pattern =>
      pattern.test(request.endpoint)
    );

    if (!isValidEndpoint) {
      return {
        code: 'UNAUTHORIZED_ENDPOINT',
        message: 'Endpoint not allowed',
      };
    }

    // Validate parameters for TMDB requests
    if (request.apiType === 'tmdb' && request.params) {
      const { query, language, include_adult } = request.params;

      // Prevent injection attacks
      if (query && typeof query === 'string' && query.length > 200) {
        return {
          code: 'QUERY_TOO_LONG',
          message: 'Search query exceeds maximum length',
        };
      }

      // Validate language parameter
      if (
        language &&
        typeof language === 'string' &&
        !/^[a-z]{2}-[A-Z]{2}$/.test(language)
      ) {
        return {
          code: 'INVALID_LANGUAGE',
          message: 'Invalid language format',
        };
      }

      // Ensure adult content is filtered
      if (include_adult !== false) {
        request.params.include_adult = false;
      }
    }

    // Rate limiting would be implemented here in production
    // validateRateLimit(request);

    return null;
  }

  /**
   * Create a secure TMDB request
   */
  createTMDBRequest(
    endpoint: string,
    params?: Record<string, any>
  ): ProxyRequest {
    return {
      endpoint,
      method: 'GET',
      params: {
        ...params,
        include_adult: false, // Always filter adult content
      },
      apiType: 'tmdb',
    };
  }

  /**
   * Create a secure Google AI request
   */
  createGoogleAIRequest(prompt: string): ProxyRequest {
    // Sanitize prompt to prevent prompt injection
    const sanitizedPrompt = this.sanitizePrompt(prompt);

    return {
      endpoint: '/generateContent',
      method: 'POST',
      body: {
        contents: [
          {
            parts: [{ text: sanitizedPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      },
      apiType: 'google',
    };
  }

  /**
   * Sanitize user input to prevent prompt injection
   */
  private sanitizePrompt(prompt: string): string {
    // Remove potential injection patterns
    let sanitized = prompt
      .replace(/system:/gi, '')
      .replace(/assistant:/gi, '')
      .replace(/user:/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .trim();

    // Limit length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500);
    }

    return sanitized;
  }
}

// Export singleton instance
export const apiProxyService = new APIProxyService();

/**
 * Example Backend Implementation (Node.js/Express)
 *
 * This would be implemented on your secure backend:
 *
 * ```javascript
 * const express = require('express');
 * const rateLimit = require('express-rate-limit');
 * const helmet = require('helmet');
 *
 * const app = express();
 *
 * // Security middleware
 * app.use(helmet());
 * app.use(express.json({ limit: '10mb' }));
 *
 * // Rate limiting
 * const limiter = rateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100, // limit each IP to 100 requests per windowMs
 * });
 * app.use('/api/', limiter);
 *
 * // Health check
 * app.get('/api/health', (req, res) => {
 *   res.json({ status: 'ok' });
 * });
 *
 * // Proxy endpoint
 * app.post('/api/proxy', async (req, res) => {
 *   try {
 *     const { endpoint, method, params, body, apiType } = req.body;
 *
 *     // Validate and route request
 *     let result;
 *     if (apiType === 'tmdb') {
 *       result = await makeAuthenticatedTMDBRequest(endpoint, params);
 *     } else if (apiType === 'google') {
 *       result = await makeAuthenticatedGoogleRequest(endpoint, body);
 *     }
 *
 *     res.json({ result });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * ```
 */
