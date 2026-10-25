import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Info, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  allowedRoleCodes?: string[];
  accessDeniedMessage?: string;
  loginTitle?: string;
  loginDescription?: string;
  registerDescription?: string;
  authEndpoint?: string;
}

type SyncedUser = {
  id: number;
  firebaseUid: string;
  email: string;
  nombre?: string | null;
  rol?: {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
  } | null;
  activo?: boolean;
};

const API_URL = import.meta.env.VITE_API_URL;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REMEMBER_EMAIL_KEY = "sabiduria_tienda_email";

function getAuthErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/invalid-credential") return "Correo o contraseña incorrectos.";
    if (error.code === "auth/email-already-in-use") return "Este correo ya está registrado.";
    if (error.code === "auth/weak-password") return "La contraseña no cumple los requisitos mínimos.";
    if (error.code === "auth/too-many-requests") return "Demasiados intentos. Intenta nuevamente en unos minutos.";
    if (error.code === "auth/network-request-failed") return "No se pudo conectar con Firebase. Revisa tu conexión.";
  }

  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

function getPasswordSecurityError(password: string) {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Agrega al menos una letra mayúscula.";
  if (!/[a-z]/.test(password)) return "Agrega al menos una letra minúscula.";
  if (!/\d/.test(password)) return "Agrega al menos un número.";
  return null;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = "login",
  allowedRoleCodes,
  accessDeniedMessage = "Esta cuenta no tiene permisos para este acceso.",
  loginTitle = "Acceso cliente",
  loginDescription = "Ingresa con tu cuenta de cliente para continuar.",
  registerDescription = "Crea tu cuenta de cliente para comprar en la tienda.",
  authEndpoint = "/api/auth/tienda/login",
}: AuthModalProps) {
  const { resetPassword, setDbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || "");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY)));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordSecurityError = useMemo(() => getPasswordSecurityError(password), [password]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setShowPassword(false);
        setPassword("");
        setActiveTab(defaultTab);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultTab]);

  const validateCredentials = (mode: "login" | "register") => {
    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error("Ingresa un correo válido.");
      return false;
    }

    if (mode === "login" && password.length < 6) {
      toast.error("Ingresa una contraseña válida de al menos 6 caracteres.");
      return false;
    }

    if (mode === "register" && passwordSecurityError) {
      toast.error(passwordSecurityError);
      return false;
    }

    return true;
  };

  const syncUserWithBackend = async (firebaseUser: User): Promise<SyncedUser> => {
    const token = await firebaseUser.getIdToken();
    const response = await fetch(`${API_URL}${authEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre: firebaseUser.displayName || firebaseUser.email || "",
      }),
    });

    if (!response.ok) {
      throw new Error("No se pudo validar tu cuenta con el servidor.");
    }

    return response.json();
  };

  const persistRememberedEmail = () => {
    if (rememberEmail) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      return;
    }

    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  };

  const finishAuthenticatedFlow = async (firebaseUser: User, successMessage: string) => {
    try {
      const userData = await syncUserWithBackend(firebaseUser);
      const roleCode = userData.rol?.codigo;

      if (allowedRoleCodes?.length && (!roleCode || !allowedRoleCodes.includes(roleCode))) {
        await signOut(auth);
        setDbUser(null);
        throw new Error(accessDeniedMessage);
      }

      persistRememberedEmail();
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
    if (!validateCredentials("login")) return;

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
    if (!validateCredentials("register")) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await finishAuthenticatedFlow(userCredential.user, "Cuenta de cliente creada correctamente");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error("Ingresa un correo válido.");
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

  const passwordInput = (id: string, autoComplete: string) => (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        required
        minLength={activeTab === "register" ? 8 : 6}
        autoComplete={autoComplete}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-10 text-slate-900 shadow-sm focus-visible:ring-sabiduria-purple"
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden border-purple-950/10 bg-white p-0 text-slate-950 shadow-2xl sm:max-w-[460px]">
        <div className="border-b border-purple-950/10 bg-gradient-to-br from-purple-50 via-white to-amber-50 px-6 py-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-purple-100 bg-white p-1 shadow-sm">
            <img src="/images/sabiduria-logo.jpeg" alt="Sabiduría" className="h-full w-full rounded-full object-cover" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black text-sabiduria-purple">
              {showForgotPassword ? "Recuperar contraseña" : activeTab === "login" ? loginTitle : "Crear cuenta cliente"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-600">
              {showForgotPassword
                ? "Ingresa tu correo para recibir un enlace de recuperación."
                : activeTab === "login"
                  ? loginDescription
                  : registerDescription}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6">
          {showForgotPassword ? (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-300">
              {resetSent ? (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <Info className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800">Correo enviado</AlertTitle>
                  <AlertDescription className="text-emerald-700">
                    Revisa tu bandeja de entrada o spam para restablecer tu contraseña.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="cliente@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-sabiduria-purple"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enviar enlace
                  </Button>
                </form>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2 text-slate-600 hover:bg-purple-50 hover:text-sabiduria-purple"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as "login" | "register");
                setPassword("");
              }}
              className="w-full"
            >
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-sabiduria-purple data-[state=active]:shadow-sm">
                  Iniciar sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-sabiduria-purple data-[state=active]:shadow-sm">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="cliente@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-sabiduria-purple"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="rounded-sm text-sm font-semibold text-sabiduria-purple hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple focus-visible:ring-offset-2"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    {passwordInput("login-password", "current-password")}
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Checkbox
                      id="remember-store-email"
                      checked={rememberEmail}
                      onCheckedChange={(checked) => setRememberEmail(Boolean(checked))}
                    />
                    <Label htmlFor="remember-store-email" className="cursor-pointer text-sm font-medium text-slate-600">
                      Recordar mi correo en este equipo
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {loading ? "Validando..." : "Iniciar sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="register-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="cliente@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-sabiduria-purple"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    {passwordInput("register-password", "new-password")}
                    <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-3 text-xs text-slate-600">
                      <p className="mb-2 font-semibold text-sabiduria-purple">La cuenta se creará como cliente de tienda.</p>
                      <div className="grid gap-1.5">
                        <span className={password.length >= 8 ? "text-emerald-700" : "text-slate-500"}>• Mínimo 8 caracteres</span>
                        <span className={/[A-Z]/.test(password) ? "text-emerald-700" : "text-slate-500"}>• Una mayúscula</span>
                        <span className={/[a-z]/.test(password) ? "text-emerald-700" : "text-slate-500"}>• Una minúscula</span>
                        <span className={/\d/.test(password) ? "text-emerald-700" : "text-slate-500"}>• Un número</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {loading ? "Creando cuenta..." : "Crear cuenta cliente"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
