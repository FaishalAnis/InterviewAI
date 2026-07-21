import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../store/authStore";
import { UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import Layout from "../../components/layout/Layout";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type SignupFields = z.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFields) => {
    setErrorMsg(null);
    try {
      await signup(data.email, data.fullName, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Registration failed. Email might already exist.");
    }
  };

  return (
    <Layout>
      <div className="flex-grow flex items-center justify-center py-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-white">Create Account</h2>
            <p className="text-xs text-slate-400 mt-1">Get started practicing mock interviews instantly.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                {...register("fullName")}
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
              />
              {errors.fullName && <span className="text-[10px] text-rose-400 mt-0.5 block">{errors.fullName.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
              />
              {errors.email && <span className="text-[10px] text-rose-400 mt-0.5 block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
              />
              {errors.password && <span className="text-[10px] text-rose-400 mt-0.5 block">{errors.password.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
              />
              {errors.confirmPassword && <span className="text-[10px] text-rose-400 mt-0.5 block">{errors.confirmPassword.message}</span>}
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
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Signup;
