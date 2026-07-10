import { Card, CardContent } from "@/components/ui/card";
import { LinkIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <LinkIcon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
