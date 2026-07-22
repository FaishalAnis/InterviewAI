import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../store/authStore";
import { LogIn, RefreshCw, AlertCircle } from "lucide-react";
import Layout from "../../components/layout/Layout";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const isExpired = searchParams.get("expired") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false }
  });

  const onSubmit = async (data: LoginFields) => {
    setErrorMsg(null);
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail[0]?.msg : null);
      setErrorMsg(message || err.message || "Invalid email or password.");
    }
  };

  return (
    <Layout>
      <div className="flex-grow flex items-center justify-center py-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl relative">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Practice mock interviews to land your dream role.</p>
          </div>

          {isExpired && (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle size={14} />
              <span>Session expired. Please sign in again.</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
              />
              {errors.email && <span className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
              />
              {errors.password && <span className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 block">{errors.password.message}</span>}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="rounded border-slate-200 dark:border-white/10 text-primary-600 bg-white dark:bg-slate-950/40"
                />
                <span>Remember me</span>
              </label>
              
              <Link to="/forgot-password" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white gradient-btn flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-semibold transition">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Login;
