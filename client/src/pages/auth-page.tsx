import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppProfile } from "@/hooks/useAppProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Sparkles, Brain, Wind, CheckCircle2, XCircle, Users, User, UserPlus, Flame, Target, BookHeart, Mic } from "lucide-react";
import rewireLogo from "/brands/rewire-logo.jpeg";
import { useLocation } from "wouter";

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  return { isValid: errors.length === 0, errors };
}

interface AuthPageProps {
  pendingInvite?: string | null;
}

export default function AuthPage({ pendingInvite }: AuthPageProps) {
  const { loginMutation, registerMutation } = useAuth();
  const { logoUrl, brandName, isLoading: profileLoading } = useAppProfile();
  const [, setLocation] = useLocation();
  // Login accepts email or username
  const [loginData, setLoginData] = useState({ identifier: "", password: "", rememberMe: false });
  // Registration requires email, optional username
  // If coming from an invite, default to client role
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
    role: (pendingInvite ? "client" : "client") as "client" | "coach"
  });
  const [error, setError] = useState<string | null>(null);
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  // Password validation for registration
  const passwordValidation = useMemo(() => {
    return validatePassword(registerData.password);
  }, [registerData.password]);

  // Email validation
  const emailValid = validateEmail(registerData.email);
  const emailError = registerData.email.length > 0 && !emailValid ? "Please enter a valid email" : "";

  // Username validation (optional, but if provided must be min 3 chars)
  const usernameValid = registerData.username.length === 0 || registerData.username.length >= 3;
  const usernameError = registerData.username.length > 0 && registerData.username.length < 3 ? "Username must be at least 3 characters" : "";

  // Check if registration form is valid
  const isRegisterValid = emailValid && passwordValidation.isValid && registerData.role;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginMutation.mutateAsync(loginData);
      setLocation("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await registerMutation.mutateAsync(registerData);
      setLocation("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-night-forest">
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-forest-floor bg-deep-pine">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName || "Welcome"}
                  className="h-40 w-auto object-contain"
                  data-testid="brand-logo"
                />
              ) : (
                <img
                  src={rewireLogo}
                  alt="REWIRE with Brian Coones"
                  className="h-40 w-auto"
                  data-testid="default-logo"
                />
              )}
            </div>
            <CardTitle className="text-xl text-birch">
              {brandName ? `Welcome to ${brandName}` : "Welcome to REWIRE"}
            </CardTitle>
            <CardDescription className="text-sage/80">Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvite && (
              <div className="mb-4 p-3 bg-sage/10 border border-sage/30 rounded-lg">
                <p className="text-sm text-sage">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  You've been invited to join the brotherhood. Create an account or sign in to connect.
                </p>
              </div>
            )}
            <Tabs defaultValue={pendingInvite ? "register" : "login"} className="w-full">
              <TabsList className="grid w-full grid-cols-2" data-testid="auth-tabs">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier" className="text-birch">Email or Username</Label>
                    <Input
                      id="login-identifier"
                      data-testid="input-login-identifier"
                      type="text"
                      placeholder="Enter your email or username"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                      className="bg-night-forest border-forest-floor text-birch placeholder:text-sage/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-birch">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="input-login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-night-forest border-forest-floor text-birch placeholder:text-sage/50"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      data-testid="checkbox-remember-me"
                      checked={loginData.rememberMe}
                      onCheckedChange={(checked) => setLoginData({ ...loginData, rememberMe: checked === true })}
                      className="border-forest-floor data-[state=checked]:bg-teal data-[state=checked]:border-teal"
                    />
                    <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer text-sage">
                      Remember me
                    </Label>
                  </div>
                  {error && <p className="text-sm text-coral" data-testid="error-message">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal to-sage hover:from-teal/90 hover:to-sage/90 text-night-forest font-semibold shadow-lg glow-accent"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "Entering..." : "Enter"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-birch">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="register-email"
                      data-testid="input-register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className={`bg-night-forest border-forest-floor text-birch placeholder:text-sage/50 ${emailError ? "border-coral" : registerData.email && emailValid ? "border-success" : ""}`}
                      aria-invalid={!!emailError}
                      required
                    />
                    {emailError && (
                      <p className="text-xs text-coral">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-birch">Display Name</Label>
                    <Input
                      id="register-name"
                      data-testid="input-register-name"
                      type="text"
                      placeholder="How should we call you?"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="bg-night-forest border-forest-floor text-birch placeholder:text-sage/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-birch">Username <span className="text-sage/60 text-xs">(optional)</span></Label>
                    <Input
                      id="register-username"
                      data-testid="input-register-username"
                      type="text"
                      placeholder="Choose a username for login"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className={`bg-night-forest border-forest-floor text-birch placeholder:text-sage/50 ${usernameError ? "border-coral" : ""}`}
                      aria-invalid={!!usernameError}
                    />
                    {usernameError && (
                      <p className="text-xs text-coral">{usernameError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-birch">Password</Label>
                    <Input
                      id="register-password"
                      data-testid="input-register-password"
                      type="password"
                      placeholder="Choose a strong password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      onFocus={() => setShowPasswordHints(true)}
                      className={`bg-night-forest border-forest-floor text-birch placeholder:text-sage/50 ${registerData.password && !passwordValidation.isValid ? "border-coral" : registerData.password && passwordValidation.isValid ? "border-success" : ""}`}
                      aria-invalid={registerData.password.length > 0 && !passwordValidation.isValid}
                      required
                    />
                    {showPasswordHints && registerData.password && (
                      <div className="space-y-1 mt-2">
                        <p className="text-xs text-sage font-medium">Password requirements:</p>
                        {["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number"].map((req) => {
                          const isMet = !passwordValidation.errors.includes(req);
                          return (
                            <div key={req} className="flex items-center gap-1.5">
                              {isMet ? (
                                <CheckCircle2 className="w-3 h-3 text-success check-glow" />
                              ) : (
                                <XCircle className="w-3 h-3 text-coral" />
                              )}
                              <span className={`text-xs ${isMet ? "text-success" : "text-sage/50"}`}>
                                {req}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-birch">I am joining as a...</Label>
                    <RadioGroup
                      value={registerData.role}
                      onValueChange={(value: "client" | "coach") => setRegisterData({ ...registerData, role: value })}
                      className="grid grid-cols-2 gap-3"
                      data-testid="radio-role"
                    >
                      <Label
                        htmlFor="role-client"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          registerData.role === "client"
                            ? "border-teal bg-teal/10 glow-info"
                            : "border-forest-floor hover:border-teal/50"
                        }`}
                      >
                        <RadioGroupItem value="client" id="role-client" className="sr-only" />
                        <User className={`w-6 h-6 ${registerData.role === "client" ? "text-teal" : "text-forest-floor"}`} />
                        <span className={`font-medium ${registerData.role === "client" ? "text-birch" : "text-sage/70"}`}>
                          Warrior
                        </span>
                        <span className="text-xs text-center text-sage/60">
                          Walk the path of healing
                        </span>
                      </Label>
                      <Label
                        htmlFor="role-coach"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          registerData.role === "coach"
                            ? "border-gold bg-gold/10 glow-gold"
                            : "border-forest-floor hover:border-gold/50"
                        }`}
                      >
                        <RadioGroupItem value="coach" id="role-coach" className="sr-only" />
                        <Users className={`w-6 h-6 ${registerData.role === "coach" ? "text-gold" : "text-forest-floor"}`} />
                        <span className={`font-medium ${registerData.role === "coach" ? "text-birch" : "text-sage/70"}`}>
                          Guide
                        </span>
                        <span className="text-xs text-center text-sage/60">
                          Lead others to ground
                        </span>
                      </Label>
                    </RadioGroup>
                  </div>
                  {error && <p className="text-sm text-coral" data-testid="error-message">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal to-sage hover:from-teal/90 hover:to-sage/90 text-night-forest font-semibold shadow-lg glow-accent"
                    disabled={registerMutation.isPending || !isRegisterValid}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Joining..." : "Join the Brotherhood"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-deep-pine via-forest-floor/50 to-night-forest relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sage/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal to-sage flex items-center justify-center mx-auto mb-6 shadow-xl glow-accent">
            <Flame className="w-10 h-10 text-night-forest" />
          </div>
          <h1 className="text-4xl font-display font-bold text-birch mb-4">Ground Yourself</h1>
          <p className="text-lg text-sage/80 mb-8 leading-relaxed">
            Track your mood, build grounding habits, journal your reflections, and connect with your inner wisdom.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass flex items-center gap-3 rounded-xl p-4 border border-forest-floor/30 card-hover-lift">
              <div className="w-10 h-10 rounded-lg bg-coral/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-coral" />
              </div>
              <span className="text-birch font-medium">Ground Check</span>
            </div>
            <div className="glass flex items-center gap-3 rounded-xl p-4 border border-forest-floor/30 card-hover-lift">
              <div className="w-10 h-10 rounded-lg bg-teal/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-teal" />
              </div>
              <span className="text-birch font-medium">Daily Anchors</span>
            </div>
            <div className="glass flex items-center gap-3 rounded-xl p-4 border border-forest-floor/30 card-hover-lift">
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-gold" />
              </div>
              <span className="text-birch font-medium">AI Coach</span>
            </div>
            <div className="glass flex items-center gap-3 rounded-xl p-4 border border-forest-floor/30 card-hover-lift">
              <div className="w-10 h-10 rounded-lg bg-violet/20 flex items-center justify-center">
                <Wind className="w-5 h-5 text-violet" />
              </div>
              <span className="text-birch font-medium">Breathing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
