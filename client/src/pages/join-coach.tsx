import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJoinCoach } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function JoinCoach() {
  const [, params] = useRoute("/join/:code");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const joinCoachMutation = useJoinCoach();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [coachName, setCoachName] = useState<string | null>(null);

  const code = params?.code;

  useEffect(() => {
    if (!code) {
      setStatus("error");
      return;
    }

    const joinCoach = async () => {
      try {
        const result = await joinCoachMutation.mutateAsync(code);
        if (result.success && result.coach) {
          const name = result.coach.firstName && result.coach.lastName
            ? `${result.coach.firstName} ${result.coach.lastName}`
            : result.coach.email || "your coach";
          setCoachName(name);
          setStatus("success");
          toast({
            title: "Success!",
            description: `You've joined ${name} as your coach`,
          });
        } else {
          setStatus("error");
        }
      } catch (error: any) {
        setStatus("error");
        toast({
          title: "Error",
          description: error.message || "Failed to join coach",
          variant: "destructive",
        });
      }
    };

    joinCoach();
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-coral-50 p-6">
      <Card className="max-w-sm w-full p-6 text-center">
        {status === "pending" && (
          <>
            <Loader2 className="w-12 h-12 text-violet-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-semibold mb-2" data-testid="text-joining-title">Joining Coach...</h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we connect you with your coach.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2" data-testid="text-success-title">Successfully Joined!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You are now connected with {coachName}. They can now view your progress and assign you tasks.
            </p>
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-go-home">
              Go to Home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2" data-testid="text-error-title">Unable to Join</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This invite link may be invalid, expired, or already used. Please ask your coach for a new invite link.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full" data-testid="button-go-home-error">
              Go to Home
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
