import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

import { useApp } from '../../state/AppContext';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../../schemas/authSchemas';

const AuthForm = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState('user');
  
  const navigate = useNavigate();
  const { 
    login, 
    register, 
    requestPasswordReset, 
    resetPassword, 
    verifyEmail,
    isLoading, 
    authError, 
    clearAuthError 
  } = useApp();

  // Determine schema based on auth mode
  const getSchema = () => {
    switch (authMode) {
      case 'register': return registerSchema;
      case 'forgot': return forgotPasswordSchema;
      case 'reset': return resetPasswordSchema;
      default: return loginSchema;
    }
  };

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
    watch
  } = useForm({
    resolver: zodResolver(getSchema()),
    mode: 'onChange'
  });

  // Handle form submission
  const onSubmit = async (data) => {
    clearAuthError();
    setMessage({ type: '', text: '' });

    try {
      let result;
      
      switch (authMode) {
        case 'login':
          result = await login(data.email, data.password);
          if (result.success) {
            // Navigate based on role
            const userRole = JSON.parse(localStorage.getItem('user_data') || '{}')?.role;
            if (userRole === 'admin' && selectedRole === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }
          break;
          
        case 'register':
          result = await register({
            name: data.name,
            email: data.email,
            password: data.password,
            role: selectedRole
          });
          if (result.success) {
            setMessage({ 
              type: 'success', 
              text: result.message || 'Registration successful! Please check your email to verify your account.' 
            });
            setAuthMode('login');
            resetForm();
          }
          break;
          
        case 'forgot':
          result = await requestPasswordReset(data.email);
          if (result.success) {
            setMessage({ 
              type: 'success', 
              text: result.message || 'Password reset email sent! Please check your inbox.' 
            });
          }
          break;
          
        case 'reset':
          const token = searchParams.get('token');
          result = await resetPassword(token, data.password);
          if (result.success) {
            setMessage({ 
              type: 'success', 
              text: result.message || 'Password reset successfully! You can now log in.' 
            });
            setAuthMode('login');
            resetForm();
          }
          break;
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  // Handle email verification
  React.useEffect(() => {
    const verifyToken = searchParams.get('verify');
    if (verifyToken) {
      verifyEmail(verifyToken).then((result) => {
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: result.message || 'Email verified successfully! You can now log in.' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: result.error || 'Email verification failed.' 
          });
        }
      });
    }
  }, [searchParams, verifyEmail]);

  // Switch auth mode and reset form
  const switchMode = (mode) => {
    setAuthMode(mode);
    resetForm();
    clearAuthError();
    setMessage({ type: '', text: '' });
  };

  // Get form title
  const getTitle = () => {
    switch (authMode) {
      case 'register': return 'Create Account';
      case 'forgot': return 'Reset Password';
      case 'reset': return 'Set New Password';
          default: return 'Sign In';
        }
      };

  // Get submit button text
  const getSubmitText = () => {
    switch (authMode) {
      case 'register': return 'Create Account';
      case 'forgot': return 'Send Reset Email';
      case 'reset': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
          {authMode === 'login' && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                create a new account
              </button>
            </p>
          )}
        </div>

        {(message.text || authError) && (
          <div
            role="alert"
            aria-live="polite"
            className={`rounded-md border p-3 flex items-start gap-2 ${
              (message.type === 'success' || (!message.type && !authError))
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            }`}
          >
            {message.type === 'success' || (!message.type && !authError) ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm">
              {authError || message.text}
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name field for registration */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...formRegister('name')}
                    type="text"
                    id="name"
                    autoComplete="name"
                    aria-invalid={!!errors.name || undefined}
                    aria-describedby="name-error"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Full Name"
                  />
                </div>
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>
            )}

            {/* Email field */}
            {authMode !== 'reset' && (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...formRegister('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email || undefined}
                    aria-describedby="email-error"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
            )}

            {/* Password field */}
            {authMode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...formRegister('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    aria-invalid={!!errors.password || undefined}
                    aria-describedby="password-error"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Confirm Password field */}
            {(authMode === 'register' || authMode === 'reset') && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...formRegister('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword || undefined}
                    aria-describedby="confirmPassword-error"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      aria-pressed={showConfirmPassword}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm text-gray-700 dark:text-gray-300">Role</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Forgot password link */}
          {authMode === 'login' && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                getSubmitText()
              )}
            </button>
          </div>

          {/* Mode switching links */}
          <div className="text-center space-y-2">
            {authMode === 'register' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Sign in
                </button>
              </p>
            )}
            
            {authMode === 'forgot' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
