import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement, 
  Filler,
  ScatterController,
  BarController,
  LineController,
  DoughnutController
} from 'chart.js';
import { getSupabaseClient } from './utils/supabase';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Initialize error tracking
const initErrorTracking = () => {
  // Log uncaught exceptions
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    // Here you can add error reporting to a service like Sentry
    return false;
  });

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Here you can add error reporting to a service like Sentry
    return false;
  });
};

// Initialize performance monitoring
const initPerformanceMonitoring = () => {
  if ('performance' in window) {
    // Monitor long tasks (blocking the main thread for >50ms)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }
};

// Initialize error tracking and performance monitoring
initErrorTracking();
initPerformanceMonitoring();

// Initialize Supabase connection
const initSupabase = async () => {
  try {
    const client = getSupabaseClient();
    if (client) {
      // Test the connection
      const { data: { session } } = await client.auth.getSession();
      console.log('Supabase connected successfully', { hasSession: !!session });
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
};

// Register Chart.js components globally
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement, 
  Filler,
  ScatterController,
  BarController,
  LineController,
  DoughnutController
);

// Initialize Supabase
initSupabase().catch(console.error);

const Root = () => {
  useEffect(() => {
    // Track page views
    console.log('App mounted');
    
    return () => {
      console.log('App unmounted');
    };
  }, []);
  
  return (
    <StrictMode>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </StrictMode>
  );
};

// Create root and render app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Root />);
} else {
  console.error('Failed to find root element');
}
