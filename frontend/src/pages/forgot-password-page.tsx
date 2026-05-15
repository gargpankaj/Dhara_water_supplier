import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const requestSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  email: z.string().email(),
  otp_code: z.string().length(6),
  new_password: z.string().min(8),
});

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "", otp_code: "", new_password: "" },
  });

  const otpMutation = useMutation({
    mutationFn: async (values: RequestValues) => api.post("/auth/forgot-password", values),
    onSuccess: () => toast.success("OTP request submitted"),
  });
  const resetMutation = useMutation({
    mutationFn: async (values: ResetValues) => api.post("/auth/reset-password", values),
    onSuccess: () => toast.success("Password updated successfully"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard-gradient p-6 dark:bg-dashboard-gradient-dark">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Request OTP</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Send a secure OTP to the registered email address.</p>
          <form className="mt-6 space-y-4" onSubmit={requestForm.handleSubmit((values) => otpMutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registered email address</label>
              <Input {...requestForm.register("email")} placeholder="admin@aquaflow.com" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We will send the OTP to this email once SMTP is configured.
              </p>
            </div>
            <Button className="w-full" type="submit" disabled={otpMutation.isPending}>
              {otpMutation.isPending ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        </Card>
        <Card className="p-7">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset password</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter the OTP and set a fresh password.</p>
          <form className="mt-6 space-y-4" onSubmit={resetForm.handleSubmit((values) => resetMutation.mutate(values))}>
            <Input placeholder="Email, for example admin@aquaflow.com" {...resetForm.register("email")} />
            <Input placeholder="6-digit OTP, for example 482193" {...resetForm.register("otp_code")} />
            <Input type="password" placeholder="New password, minimum 8 characters" {...resetForm.register("new_password")} />
            <Button className="w-full" type="submit" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Updating..." : "Reset password"}
            </Button>
          </form>
          <div className="mt-6 text-sm">
            <Link className="text-blue-600 hover:underline dark:text-blue-300" to="/login">
              Back to login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
