import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/AuthContext";
import { ChefHat } from "lucide-react";

const Login: React.FC = () => {
  const { user, loading } = useAuth(); // assuming you expose loading in useAuth
  const [isLogin, setIsLogin] = useState(true);
  if (loading) {
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
    // <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
    //   {/* Video background */}
    //   <video
    //     autoPlay
    //     loop
    //     muted
    //     playsInline
    //     className="absolute z-0 w-full min-w-full min-h-full object-cover"
    //   >
    //     <source
    //       src="https://qcmiefuvhorthdkziyvj.supabase.co/storage/v1/object/public/avatars//sricentral.mp4"
    //       type="video/mp4"
    //     />
    //     <source src="/videos/login-bg.webm" type="video/webm" />
    //     Your browser does not support HTML5 video.
    //   </video>

    //   {/* Semi-transparent overlay */}
    //   <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>

    //   {/* Login form */}
    //   <div className="relative z-20 bg-black bg-opacity-30 p-8 rounded-lg shadow-lg w-full max-w-md">
    //     {/* <ChefHat className="mx-auto h-16 w-16 text-orange-500 mb-4" />
    //     <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2> */}
    //     {/* Your form elements here */}
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Video background - full screen */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="https://qcmiefuvhorthdkziyvj.supabase.co/storage/v1/object/public/avatars//sricentral.mp4"
            type="video/mp4"
          />
          <source src="/videos/login-bg.webm" type="video/webm" />
          Your browser does not support HTML5 video.
        </video>
      </div>

      {/* Right side container for form */}
      <div className="fixed right-0 top-0 h-full w-full md:w-1/3 flex items-center justify-center z-20">
        {/* Form background with 30% opacity and blur */}
        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>

        {/* Form content */}
        <div className="relative z-30 w-full max-w-md px-4">
          <div className="bg-black bg-opacity-30 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden p-8">
            <div className="mb-6 text-center">
              {/* <ChefHat className="mx-auto h-12 w-12 text-orange-400 mb-4" /> */}
              {/* <h2 className="text-2xl font-bold text-white">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2> */}
            </div>

            {/* {isLogin ? <LoginForm /> : <SignupForm />} */}
            {isLogin ? <LoginForm /> : "Signup Disabled Now"}

            <div className="mt-6 text-center">
              <p className="text-sm text-white/80">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-orange-300 hover:text-orange-400 font-medium transition-colors"
                >
                  {isLogin ? "Sign up" : "Login"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
