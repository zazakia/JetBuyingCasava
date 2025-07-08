import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase';

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const client = getSupabaseClient();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'email') {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      if (!client) {
        setStatus('error');
        setError('Authentication service not available');
        return;
      }

      try {
        const { data, error } = await client.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setStatus('expired');
          } else {
            setStatus('error');
            setError(error.message);
          }
          return;
        }

        if (data.user) {
          setStatus('success');
          // Redirect to dashboard after successful verification
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setError('Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, client, navigate]);

  const handleResendVerification = async () => {
    if (!client || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      // Get current user to resend verification
      const { data: { user } } = await client.auth.getUser();
      
      if (!user) {
        throw new Error('No user found. Please log in again.');
      }

      const { error } = await client.auth.resend({
        type: 'signup',
        email: user.email!,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) {
        throw error;
      }

      setStatus('verifying');
    } catch (error) {
      console.error('Error resending verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your email has been verified. You can now access all features of AgriTracker Pro.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to dashboard in 3 seconds...
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Link Expired</h2>
            <p className="text-gray-600 mb-6">
              This verification link has expired or is invalid. We can send you a new one.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Sending New Link...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>Send New Verification Link</span>
                </>
              )}
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">
              {error || 'We encountered an error while verifying your email.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Sending New Link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send New Verification Link</span>
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/auth', { replace: true })}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-xl">
          {renderContent()}
          
          {error && status !== 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};