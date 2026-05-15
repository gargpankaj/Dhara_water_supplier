import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard-gradient p-6 dark:bg-dashboard-gradient-dark">
      <Card className="max-w-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Route not found</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          The page you requested does not exist. The dashboard route map is intact, so you can safely jump back.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
