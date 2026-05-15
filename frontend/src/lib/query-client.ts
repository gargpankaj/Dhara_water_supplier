import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (error: Error) => {
        toast.error(error.message || "Something went wrong");
      },
    },
  },
});

