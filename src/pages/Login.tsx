
import React from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth,AuthProvider } from '@/contexts/AuthContext';
import SignupForm from '@/components/auth/SignupForm';

const Login: React.FC = () => {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
  <div className="bg-white rounded-lg shadow-lg flex w-full max-w-4xl overflow-hidden">
    <div className="w-1/2 p-8 border-r">
      <LoginForm />
    </div>
    <div className="w-1/2 p-8">
      <SignupForm />
    </div>
  </div>
</div>

  );
};

export default Login;
