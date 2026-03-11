import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [mode, setMode] = useState("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, startPhoneOtp, verifyPhoneOtp } =
    useAuth();
  const recaptchaId = "recaptcha-container";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created",
        description: "You are now signed in.",
      });
      navigate("/dashboard");
    }
  };

  if (mode === "welcome") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 safe-top safe-bottom">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue your study journey
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setMode("login")}
              className="w-full h-12 gap-3 rounded-xl text-sm font-medium"
            >
              <Mail className="h-5 w-5" />
              Sign in with Email
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                setLoading(true);
                const { error } = await signInWithGoogle();
                setLoading(false);
                if (error)
                  toast({
                    title: "Google sign-in failed",
                    description: error.message,
                    variant: "destructive",
                  });
                else navigate("/dashboard");
              }}
              className="w-full h-12 rounded-xl text-sm font-medium"
              disabled={loading}
            >
              Continue with Google
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setMode("phone");
                setConfirmation(null);
                setOtp("");
              }}
              className="w-full h-12 gap-2 rounded-xl text-sm font-medium"
            >
              <Phone className="h-5 w-5" />
              Continue with Phone
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setMode("signup")}
              className="w-full h-12 rounded-xl text-sm font-medium"
            >
              Create an Account
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "phone") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 safe-top safe-bottom">
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setMode("welcome")}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Phone Sign-In</h1>
            <p className="text-sm text-muted-foreground text-center">
              Use E.164 format, e.g. +15551234567
            </p>
          </div>

          <div id={recaptchaId} />

          {!confirmation ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  placeholder="+15551234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button
                className="w-full h-11 rounded-xl font-medium"
                disabled={loading || phone.trim().length < 8}
                onClick={async () => {
                  setLoading(true);
                  const { confirmation, error } = await startPhoneOtp(
                    phone.trim(),
                    recaptchaId,
                  );
                  setLoading(false);
                  if (error)
                    toast({
                      title: "Failed to send OTP",
                      description: error.message,
                      variant: "destructive",
                    });
                  else {
                    setConfirmation(confirmation);
                    toast({
                      title: "OTP sent",
                      description: "Check your SMS for the code.",
                    });
                  }
                }}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP code</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <Button
                className="w-full h-11 rounded-xl font-medium"
                disabled={loading || otp.trim().length < 4}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await verifyPhoneOtp(
                    confirmation,
                    otp.trim(),
                  );
                  setLoading(false);
                  if (error)
                    toast({
                      title: "OTP failed",
                      description: error.message,
                      variant: "destructive",
                    });
                  else navigate("/dashboard");
                }}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl"
                onClick={() => {
                  setConfirmation(null);
                  setOtp("");
                }}
              >
                Resend / Change phone
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm space-y-6">
        <button
          onClick={() => setMode("welcome")}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h1>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="space-y-4"
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                minLength={6}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-medium"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <Button
          variant="outline"
          className="w-full h-11 rounded-xl font-medium"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const { error } = await signInWithGoogle();
            setLoading(false);
            if (error)
              toast({
                title: "Google sign-in failed",
                description: error.message,
                variant: "destructive",
              });
            else navigate("/dashboard");
          }}
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-medium"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
