import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { AuthResponse } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@aquaflow.com", password: "Admin@123" },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<AuthResponse>("/auth/login", values);
      return data;
    },
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      toast.success("Welcome back to AquaFlow");
      navigate("/dashboard");
    },
  });

  return (
    <div className="grid min-h-screen bg-dashboard-gradient dark:bg-dashboard-gradient-dark lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden flex-col justify-between p-10 lg:flex">
        <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-white dark:bg-white dark:text-slate-950">
          <div className="h-10 w-10 rounded-xl bg-blue-500" />
          <div>
            <p className="font-bold">AquaFlow</p>
            <p className="text-xs opacity-70">Water Supplier Control Center</p>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl space-y-6">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            Premium Operations
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-slate-950 dark:text-white">
            Run inventory, billing, CRM, and accounting from one premium workspace.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Built for bottled water teams that need clean operations, quick selling, and reliable financial control.
          </p>
        </motion.div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-7">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Login</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Use the demo owner account or connect your backend env later.
            </p>
          </div>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Work email address</label>
              <Input {...form.register("email")} placeholder="admin@aquaflow.com" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the email used for your staff or owner account.
              </p>
              <p className="text-xs text-rose-500">{form.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account password</label>
              <Input type="password" {...form.register("password")} placeholder="••••••••" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use your secure login password. Demo password is `Admin@123`.
              </p>
              <p className="text-xs text-rose-500">{form.formState.errors.password?.message}</p>
            </div>
            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Access dashboard"}
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link className="text-blue-600 hover:underline dark:text-blue-300" to="/forgot-password">
              Forgot password?
            </Link>
            <Link className="text-slate-500 hover:text-slate-900 dark:text-slate-300" to="/register">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
