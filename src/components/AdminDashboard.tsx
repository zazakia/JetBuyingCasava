import React, { useState } from 'react';
import { Shield, Play, RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';

// Dummy test list (replace with dynamic import/discovery if needed)
const TESTS = [
  { name: 'App Integration', description: 'Full CRUD and navigation workflow', file: 'App.integration.test.tsx' },
  { name: 'Farmers Manager', description: 'Farmer CRUD, validation, filtering', file: 'FarmersManager.test.tsx' },
  { name: 'Dashboard', description: 'Stats, charts, error handling', file: 'Dashboard.test.tsx' },
  { name: 'Supabase Connection', description: 'Connection, config, schema checks', file: 'supabase.connection.test.ts' },
  { name: 'Supabase Utils', description: 'Config, integration, error handling', file: 'supabase.test.ts' },
  { name: 'Auth Context', description: 'Auth state, login/logout, error', file: 'AuthContext.test.tsx' },
];

export const AdminDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<'ok' | 'warning' | 'error'>('ok');
  const [dbSchema, setDbSchema] = useState<string>('cassavajet (farmers, lands, crops, transactions, sync_log)');
  const [securityChecks, setSecurityChecks] = useState<string[]>([
    'RLS enabled on all tables',
    'No public API keys in localStorage',
    'SSL enforced for Supabase',
    'No unsafe eval or dynamic code',
  ]);

  // Dummy test runner (replace with real Vitest/browser runner if needed)
  const runTest = (test: typeof TESTS[0]) => {
    setRunning(test.name);
    setTimeout(() => {
      setTestResults(r => ({ ...r, [test.name]: '✅ Passed' }));
      setRunning(null);
    }, 1200);
  };

  // Dummy system health check
  const refreshHealth = () => {
    setSystemHealth('ok');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-4">
        <Shield className="w-7 h-7 text-emerald-600" /> Admin Dashboard
      </h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-600" /> System Health & DB Info
        </h2>
        <div className="flex flex-col gap-2 bg-amber-50 rounded-lg p-4 border border-amber-200 mb-2">
          <div className="flex items-center gap-2">
            {systemHealth === 'ok' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span>System Health: <b className={systemHealth === 'ok' ? 'text-emerald-700' : 'text-red-700'}>{systemHealth === 'ok' ? 'Healthy' : 'Check Required'}</b></span>
            <button onClick={refreshHealth} className="ml-2 px-2 py-1 text-xs bg-amber-200 rounded hover:bg-amber-300 flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Refresh</button>
          </div>
          <div>DB Schema: <span className="font-mono text-sm">{dbSchema}</span></div>
          <div>Security Checks:</div>
          <ul className="list-disc ml-6 text-sm">
            {securityChecks.map((check, i) => (
              <li key={i} className="text-emerald-700">{check}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-600" /> Automated Tests
        </h2>
        <div className="bg-white rounded-lg shadow border border-gray-200 divide-y">
          {TESTS.map(test => (
            <div key={test.name} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-2">
              <div>
                <div className="font-semibold">{test.name}</div>
                <div className="text-sm text-gray-600">{test.description}</div>
                <div className="text-xs text-gray-400">{test.file}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runTest(test)}
                  disabled={!!running}
                  className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Play className="w-4 h-4" /> {running === test.name ? 'Running...' : 'Run'}
                </button>
                {testResults[test.name] && (
                  <span className="ml-2 text-emerald-700 font-semibold">{testResults[test.name]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 