// Система мониторинга производительности
// Отслеживает метрики производительности и отправляет их в аналитику

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    if (this.isEnabled) {
      this.initializeWebVitals();
      this.initializePerformanceObserver();
    }
  }

  // Инициализация Web Vitals
  initializeWebVitals() {
    if (typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint)
    this.observeLCP();
    
    // FID (First Input Delay)
    this.observeFID();
    
    // CLS (Cumulative Layout Shift)
    this.observeCLS();
    
    // FCP (First Contentful Paint)
    this.observeFCP();
    
    // TTFB (Time to First Byte)
    this.observeTTFB();
  }

  // Наблюдение за LCP
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric('LCP', lastEntry.startTime);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('LCP', observer);
  }

  // Наблюдение за FID
  observeFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('FID', entry.processingStart - entry.startTime);
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('FID', observer);
  }

  // Наблюдение за CLS
  observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.recordMetric('CLS', clsValue);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('CLS', observer);
  }

  // Наблюдение за FCP
  observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime);
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('FCP', observer);
  }

  // Наблюдение за TTFB
  observeTTFB() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const ttfb = entry.responseStart - entry.requestStart;
          this.recordMetric('TTFB', ttfb);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('TTFB', observer);
  }

  // Инициализация Performance Observer
  initializePerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    // Наблюдение за загрузкой ресурсов
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordResourceMetric(entry);
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', resourceObserver);

    // Наблюдение за навигацией
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordNavigationMetric(entry);
      });
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', navigationObserver);
  }

  // Запись метрики
  recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...tags
      }
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);
    
    // Отправляем в аналитику
    this.sendToAnalytics(metric);
    
    console.log(`📊 Performance Metric: ${name} = ${value}ms`);
  }

  // Запись метрики ресурса
  recordResourceMetric(entry) {
    const resourceType = this.getResourceType(entry.name);
    const loadTime = entry.responseEnd - entry.startTime;
    
    this.recordMetric('resource_load_time', loadTime, {
      resourceType,
      resourceName: entry.name,
      size: entry.transferSize || 0
    });
  }

  // Запись метрики навигации
  recordNavigationMetric(entry) {
    const navigationTime = entry.loadEventEnd - entry.navigationStart;
    
    this.recordMetric('navigation_time', navigationTime, {
      type: entry.type,
      redirectCount: entry.redirectCount
    });
  }

  // Определение типа ресурса
  getResourceType(url) {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif')) return 'image';
    if (url.includes('.woff') || url.includes('.woff2') || url.includes('.ttf')) return 'font';
    if (url.includes('.mp4') || url.includes('.webm')) return 'video';
    return 'other';
  }

  // Отправка в аналитику
  sendToAnalytics(metric) {
    // Здесь можно интегрировать с различными сервисами аналитики
    // Например: Google Analytics, Mixpanel, Amplitude и т.д.
    
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        ...metric.tags
      });
    }

    // Отправка в собственный API (отключено для избежания ошибок)
    this.sendToAPI(metric);
  }

  // Отправка в собственный API (отключено для production)
  async sendToAPI(metric) {
    // Отключаем отправку в API для избежания ошибок
    // В production можно настроить реальный endpoint
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric (dev only):', metric);
    }
    // Не отправляем в API, чтобы избежать ошибок
  }

  // Измерение времени выполнения функции
  measureFunction(name, fn, context = null) {
    const start = performance.now();
    const result = fn.call(context);
    const end = performance.now();
    
    this.recordMetric(`function_${name}`, end - start);
    
    return result;
  }

  // Измерение времени выполнения асинхронной функции
  async measureAsyncFunction(name, fn, context = null) {
    const start = performance.now();
    const result = await fn.call(context);
    const end = performance.now();
    
    this.recordMetric(`async_function_${name}`, end - start);
    
    return result;
  }

  // Измерение времени рендеринга компонента
  measureComponentRender(componentName, renderFn) {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    this.recordMetric(`component_render_${componentName}`, end - start);
    
    return result;
  }

  // Измерение времени загрузки данных
  measureDataLoad(dataType, loadFn) {
    const start = performance.now();
    return loadFn().then((data) => {
      const end = performance.now();
      this.recordMetric(`data_load_${dataType}`, end - start);
      return data;
    });
  }

  // Получение всех метрик
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  // Получение метрик по типу
  getMetricsByType(type) {
    return this.getAllMetrics().filter(metric => metric.name.includes(type));
  }

  // Очистка старых метрик
  cleanupOldMetrics(maxAge = 24 * 60 * 60 * 1000) { // 24 часа
    const now = Date.now();
    for (const [key, metric] of this.metrics.entries()) {
      if (now - metric.timestamp > maxAge) {
        this.metrics.delete(key);
      }
    }
  }

  // Остановка всех наблюдателей
  disconnect() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }

  // Получение отчета о производительности
  getPerformanceReport() {
    const metrics = this.getAllMetrics();
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {},
      summary: {}
    };

    // Группируем метрики по типам
    metrics.forEach(metric => {
      const type = metric.name.split('_')[0];
      if (!report.metrics[type]) {
        report.metrics[type] = [];
      }
      report.metrics[type].push(metric);
    });

    // Вычисляем статистику
    Object.keys(report.metrics).forEach(type => {
      const values = report.metrics[type].map(m => m.value);
      report.summary[type] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
      };
    });

    return report;
  }
}

// Создаем глобальный экземпляр
const performanceMonitor = new PerformanceMonitor();

// Экспортируем утилиты для использования в компонентах
export const measurePerformance = (name, fn, context = null) => {
  return performanceMonitor.measureFunction(name, fn, context);
};

export const measureAsyncPerformance = (name, fn, context = null) => {
  return performanceMonitor.measureAsyncFunction(name, fn, context);
};

export const measureComponentPerformance = (componentName, renderFn) => {
  return performanceMonitor.measureComponentRender(componentName, renderFn);
};

export const measureDataLoadPerformance = (dataType, loadFn) => {
  return performanceMonitor.measureDataLoad(dataType, loadFn);
};

// Хук для React компонентов
export const usePerformanceMonitor = (componentName) => {
  const measureRender = useCallback((renderFn) => {
    return measureComponentPerformance(componentName, renderFn);
  }, [componentName]);

  const measureAction = useCallback((actionName, actionFn) => {
    return measurePerformance(`${componentName}_${actionName}`, actionFn);
  }, [componentName]);

  return {
    measureRender,
    measureAction
  };
};

export default performanceMonitor;

