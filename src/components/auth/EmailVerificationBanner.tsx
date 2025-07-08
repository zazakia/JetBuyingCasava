import React, { useState, useEffect } from 'react';
import { Mail, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient } from '../../utils/supabase';

interface EmailVerificationBannerProps {
  className?: string;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [lastResent, setLastResent] = useState<Date | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [timeUntilNextResend, setTimeUntilNextResend] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = getSupabaseClient();
  const RESEND_COOLDOWN = 60; // 60 seconds between resends
  const MAX_RESENDS_PER_HOUR = 5;

  // Check if user's email is verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!client || !user) return;

      try {
        const { data, error } = await client.auth.getUser();
        if (error) {
          console.error('Error checking verification status:', error);
          return;
        }

        setIsVerified(!!data.user?.email_confirmed_at);
      } catch (error) {
        console.error('Error in verification check:', error);
      }
    };

    checkVerificationStatus();

    // Check verification status every 30 seconds
    const interval = setInterval(checkVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, [client, user]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (!lastResent) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastResent.getTime()) / 1000);
      const remaining = Math.max(0, RESEND_COOLDOWN - elapsed);
      setTimeUntilNextResend(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastResent]);

  // Load resend data from localStorage
  useEffect(() => {
    if (!user) return;

    const storageKey = `email_verification_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        // Filter resends to only count those in the last hour
        const recentResends = (data.resendTimes || []).filter((time: number) => time > oneHourAgo);
        setResendCount(recentResends.length);
        
        if (data.lastResent) {
          const lastResentDate = new Date(data.lastResent);
          const elapsed = Math.floor((Date.now() - lastResentDate.getTime()) / 1000);
          
          if (elapsed < RESEND_COOLDOWN) {
            setLastResent(lastResentDate);
            setTimeUntilNextResend(RESEND_COOLDOWN - elapsed);
          }
        }
      } catch (error) {
        console.error('Error parsing stored verification data:', error);
      }
    }
  }, [user]);

  const handleResendVerification = async () => {
    if (!client || !user || isResending || timeUntilNextResend > 0) return;

    if (resendCount >= MAX_RESENDS_PER_HOUR) {
      setError('Too many verification emails sent. Please wait an hour before trying again.');
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const { error } = await client.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) {
        throw error;
      }

      const now = new Date();
      setLastResent(now);
      setTimeUntilNextResend(RESEND_COOLDOWN);
      
      const newResendCount = resendCount + 1;
      setResendCount(newResendCount);

      // Store resend data in localStorage
      const storageKey = `email_verification_${user.id}`;
      const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const resendTimes = [...(currentData.resendTimes || []), now.getTime()];
      
      // Keep only resends from the last hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentResends = resendTimes.filter(time => time > oneHourAgo);
      
      localStorage.setItem(storageKey, JSON.stringify({
        lastResent: now.toISOString(),
        resendTimes: recentResends
      }));

    } catch (error) {
      console.error('Error resending verification email:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  // Auto-resend on first load if user just registered
  useEffect(() => {
    if (!user || isVerified || resendCount > 0) return;

    const justRegistered = localStorage.getItem(`just_registered_${user.id}`);
    if (justRegistered) {
      // Remove the flag and auto-send verification
      localStorage.removeItem(`just_registered_${user.id}`);
      setTimeout(() => {
        handleResendVerification();
      }, 2000); // Wait 2 seconds after registration
    }
  }, [user, isVerified, resendCount]);

  // Don't show banner if email is verified
  if (isVerified || !user) {
    return null;
  }

  const canResend = timeUntilNextResend === 0 && resendCount < MAX_RESENDS_PER_HOUR && !isResending;

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                Email Verification Required
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Please check your email and click the verification link to complete your account setup.
                <br />
                <span className="font-medium">{user.email}</span>
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              {canResend ? (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 border border-amber-300 rounded text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Resend</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-sm text-amber-600 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {timeUntilNextResend > 0 
                      ? `Wait ${timeUntilNextResend}s`
                      : resendCount >= MAX_RESENDS_PER_HOUR 
                        ? 'Limit reached'
                        : 'Processing...'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {error}
            </div>
          )}
          
          <div className="mt-2 flex items-center space-x-4 text-xs text-amber-600">
            <span>Resent: {resendCount}/{MAX_RESENDS_PER_HOUR} this hour</span>
            {lastResent && (
              <span>Last sent: {lastResent.toLocaleTimeString()}</span>
            )}
          </div>
          
          <div className="mt-2 text-xs text-amber-600">
            <p>💡 Check your spam folder if you don't see the email.</p>
          </div>
        </div>
      </div>
    </div>
  );
};