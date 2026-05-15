import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { AuthResponse } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  role_name: z.enum(["Owner", "Manager", "Staff", "Accountant"]),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", role_name: "Manager", password: "" },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<AuthResponse>("/auth/register", values);
      return data;
    },
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      navigate("/dashboard");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard-gradient p-6 dark:bg-dashboard-gradient-dark">
      <Card className="w-full max-w-lg p-7">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Register new user</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create staff, manager, accountant, or owner access with role-based control.
          </p>
        </div>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Full name</label>
            <Input {...form.register("full_name")} placeholder="Aarav Mehta" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add the staff member's or manager's full legal/display name.
            </p>
            <p className="text-xs text-rose-500">{form.formState.errors.full_name?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <Input {...form.register("email")} placeholder="manager@aquaflow.com" />
            <p className="text-xs text-rose-500">{form.formState.errors.email?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <Input {...form.register("phone")} placeholder="+91 98765 43210" />
            <p className="text-xs text-rose-500">{form.formState.errors.phone?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Access role</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50"
              {...form.register("role_name")}
            >
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Accountant">Accountant</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose what screens and actions this user should be allowed to access.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Temporary password</label>
            <Input type="password" {...form.register("password")} placeholder="Create a secure password" />
            <p className="text-xs text-rose-500">{form.formState.errors.password?.message}</p>
          </div>
          <div className="md:col-span-2">
            <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>
        <div className="mt-6 text-sm">
          <Link className="text-blue-600 hover:underline dark:text-blue-300" to="/login">
            Back to login
          </Link>
        </div>
      </Card>
    </div>
  );
}
