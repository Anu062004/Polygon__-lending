// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, any> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Memoization for expensive calculations
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      
      const result = fn(...args);
      this.cache.set(key, result);
      return result;
    }) as T;
  }

  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    key: string
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }
      
      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Web3 performance optimizations
export const web3Optimizations = {
  // Batch multiple contract calls
  batchContractCalls: async (calls: Array<() => Promise<any>>) => {
    return Promise.all(calls);
  },

  // Optimize gas estimation
  estimateGasOptimized: async (contract: any, method: string, params: any[]) => {
    try {
      return await contract.estimateGas[method](...params);
    } catch (error) {
      console.warn('Gas estimation failed, using default:', error);
      return 300000; // Default gas limit
    }
  },

  // Connection pooling for RPC calls
  createConnectionPool: (rpcUrls: string[]) => {
    let currentIndex = 0;
    
    return {
      getNextRpc: () => {
        const rpc = rpcUrls[currentIndex];
        currentIndex = (currentIndex + 1) % rpcUrls.length;
        return rpc;
      },
      
      getRandomRpc: () => {
        return rpcUrls[Math.floor(Math.random() * rpcUrls.length)];
      }
    };
  }
};

// Memory management
export const memoryManagement = {
  // Clean up large objects
  cleanup: () => {
    if (global.gc) {
      global.gc();
    }
  },

  // Monitor memory usage
  getMemoryUsage: () => {
    if (process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }
};




