import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-semibold mb-4">404 - Page Not Found</h1>
      <p className="text-sm mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Go back</Link>
      </Button>
    </div>
  );
}
