import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthView = 'login' | 'register' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const toggleForm = () => {
    setCurrentView(currentView === 'login' ? 'register' : 'login');
  };

  const showForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const backToLogin = () => {
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {currentView === 'login' && (
          <LoginForm 
            onToggleForm={toggleForm} 
            onForgotPassword={showForgotPassword}
          />
        )}
        {currentView === 'register' && (
          <RegisterForm onToggleForm={toggleForm} />
        )}
        {currentView === 'forgot-password' && (
          <ForgotPasswordForm onBackToLogin={backToLogin} />
        )}
      </div>
    </div>
  );
};