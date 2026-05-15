import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard-gradient dark:bg-dashboard-gradient-dark">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel flex items-center gap-3 px-6 py-4"
      >
        <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-200">
          Loading AquaFlow workspace
        </span>
      </motion.div>
    </div>
  );
}

