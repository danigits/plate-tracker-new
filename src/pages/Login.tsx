import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/AuthContext";
import { ChefHat } from "lucide-react";

const Login: React.FC = () => {
  const { user, isLoading } = useAuth(); // assuming you expose loading in useAuth
  const [isLogin, setIsLogin] = useState(true);
  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    // <div
    //   className="min-h-screen flex items-center justify-center bg-gray-100 px-4"
    //   style={{
    //     backgroundImage:
    //       "(https://qcmiefuvhorthdkziyvj.supabase.co/storage/v1/object/public/avatars//sricentral.mp4)",
    //   }}
    // >
    //   <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
    //     <div className="mb-6 text-center">
    //       <h2 className="text-2xl font-semibold text-gray-700">
    //         {isLogin ? "Login to your account" : "Create an account"}
    //       </h2>
    //     </div>

    //     {isLogin ? <LoginForm /> : <SignupForm />}

    //     <div className="mt-6 text-center">
    //       <p className="text-sm text-gray-600">
    //         {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
    //         <button
    //           onClick={() => setIsLogin(!isLogin)}
    //           className="text-blue-600 hover:underline font-medium"
    //         >
    //           {isLogin ? "Sign up" : "Login"}
    //         </button>
    //       </p>
    //     </div>
    //   </div>
    // </div>
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute z-0 w-full min-w-full min-h-full object-cover"
      >
        <source
          src="https://qcmiefuvhorthdkziyvj.supabase.co/storage/v1/object/public/avatars//sricentral.mp4"
          type="video/mp4"
        />
        <source src="/videos/login-bg.webm" type="video/webm" />
        Your browser does not support HTML5 video.
      </video>

      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>

      {/* Login form */}
      <div className="relative z-20 bg-black bg-opacity-30 p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* <ChefHat className="mx-auto h-16 w-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2> */}
        {/* Your form elements here */}
        {isLogin ? <LoginForm /> : <SignupForm />}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
