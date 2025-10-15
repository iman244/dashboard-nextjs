import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppRoutes } from "./paths";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <CardTitle className="text-4xl font-bold tracking-tight">
              Welcome
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Infirmary Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="flex-1 sm:flex-none">
                <Link href={AppRoutes.CONSOLE}>Go to Console</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Link href={AppRoutes.AUTHENTICATION}>Sign In / Register</Link>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Choose your path to get started
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
