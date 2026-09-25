import { useState, useEffect } from "react";
import { FirebaseError } from "firebase/app";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ArrowLeft } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

const API_URL = import.meta.env.VITE_API_URL;

function getAuthErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/invalid-credential") return "Correo o contraseña incorrectos.";
    if (error.code === "auth/email-already-in-use") return "Este correo ya está registrado.";
    if (error.code === "auth/weak-password") return "La contraseña debe tener al menos 6 caracteres.";
    if (error.code === "auth/too-many-requests") return "Demasiados intentos. Intenta nuevamente en unos minutos.";
  }

  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const { resetPassword, setDbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setEmail("");
        setPassword("");
        setActiveTab(defaultTab);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultTab]);

  const syncUserWithBackend = async (firebaseUser: User) => {
    const token = await firebaseUser.getIdToken();
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre: firebaseUser.displayName || "",
      }),
    });

    if (!response.ok) {
      throw new Error("No se pudo validar tu cuenta con el servidor.");
    }

    return response.json();
  };

  const finishAuthenticatedFlow = async (firebaseUser: User, successMessage: string) => {
    try {
      const userData = await syncUserWithBackend(firebaseUser);
      setDbUser(userData);
      toast.success(successMessage);
      onClose();
    } catch (error) {
      await signOut(auth);
      setDbUser(null);
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await finishAuthenticatedFlow(userCredential.user, "Sesión iniciada correctamente");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await finishAuthenticatedFlow(userCredential.user, "Cuenta creada correctamente");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      toast.success("Correo de recuperación enviado.");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        {showForgotPassword ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-royal-blue text-center text-2xl font-semibold mt-2">
                Recuperar Contraseña
              </DialogTitle>
              <DialogDescription className="text-center">
                Ingresa tu correo electrónico para recibir un enlace de recuperación.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {resetSent ? (
                <div className="space-y-4 fade-in-0 animate-in p-1">
                  <Alert className="bg-green-50 border-green-200">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Correo enviado</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Revisa tu bandeja de entrada o spam para restablecer tu contraseña.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 fade-in-0 animate-in">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Correo electrónico</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-vibrant-orange hover:bg-vibrant-orange/90 text-white font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar enlace"}
                  </Button>
                </form>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-muted-foreground mt-2 hover:bg-transparent hover:text-foreground"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-royal-blue text-center text-2xl font-semibold mt-2">
                {activeTab === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {activeTab === "login"
                  ? "Ingresa tus credenciales para acceder a tu panel."
                  : "Regístrate para empezar a usar nuestros servicios."}
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "login" | "register")}
              className="w-full mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-royal-blue hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-vibrant-orange hover:bg-vibrant-orange/90 text-white font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading ? "Validando..." : "Iniciar sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <Input
                      id="register-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input
                      id="register-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-royal-blue hover:bg-royal-blue/90 text-white font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading ? "Creando cuenta..." : "Registrarse"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


