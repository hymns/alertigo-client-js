export interface AlertiqoConfig {
  apiKey: string;
  endpoint: string;
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
  beforeSend?: (error: ErrorReport) => ErrorReport | null;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  timestamp: number;
  environment: string;
  release?: string;
  tags: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  context: {
    browser?: string;
    os?: string;
    url?: string;
    userAgent?: string;
  };
  breadcrumbs: Breadcrumb[];
}

export interface Breadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}

class Alertiqo {
  private config: AlertiqoConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private initialized = false;

  constructor(config: AlertiqoConfig) {
    this.config = {
      environment: 'production',
      tags: {},
      ...config,
    };
  }

  init(): void {
    if (this.initialized) return;

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message));
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(event.reason);
      });
    }

    this.initialized = true;
  }

  captureException(error: Error | string, additionalData?: Record<string, any>): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const report: ErrorReport = {
      message: errorObj.message,
      stack: errorObj.stack,
      level: 'error',
      timestamp: Date.now(),
      environment: this.config.environment || 'production',
      release: this.config.release,
      tags: { ...this.config.tags, ...additionalData?.tags },
      context: this.getContext(),
      breadcrumbs: [...this.breadcrumbs],
    };

    if (this.config.beforeSend) {
      const processedReport = this.config.beforeSend(report);
      if (!processedReport) return;
      this.sendReport(processedReport);
    } else {
      this.sendReport(report);
    }
  }

  captureMessage(message: string, level: ErrorReport['level'] = 'info'): void {
    const report: ErrorReport = {
      message,
      level,
      timestamp: Date.now(),
      environment: this.config.environment || 'production',
      release: this.config.release,
      tags: this.config.tags || {},
      context: this.getContext(),
      breadcrumbs: [...this.breadcrumbs],
    };

    this.sendReport(report);
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }
  }

  setUser(user: ErrorReport['user']): void {
    this.config.tags = {
      ...this.config.tags,
      userId: user?.id || '',
      userEmail: user?.email || '',
    };
  }

  setTag(key: string, value: string): void {
    if (!this.config.tags) {
      this.config.tags = {};
    }
    this.config.tags[key] = value;
  }

  setTags(tags: Record<string, string>): void {
    this.config.tags = { ...this.config.tags, ...tags };
  }

  private getContext(): ErrorReport['context'] {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
    };
  }

  private getBrowserInfo(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    
    return 'unknown';
  }

  private getOSInfo(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    
    return 'unknown';
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        console.error('[Alertiqo] Failed to send error report:', response.statusText);
      }
    } catch (error) {
      console.error('[Alertiqo] Failed to send error report:', error);
    }
  }
}

export default Alertiqo;
