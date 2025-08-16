import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userDataStore } from "@/lib/userDataStore";
import { ProfilePersistence } from "@/lib/profilePersistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";
// Logo APONTT em SVG inline

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    // Simular autenticação
    try {
      // Em produção, isso seria uma chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verificar credenciais atualizadas primeiro
      const adminCredentials = JSON.parse(localStorage.getItem("apontt_admin_credentials") || "{}");
      const storedPassword = localStorage.getItem("apontt_admin_password") || "apontt2025!";
      
      // Credenciais válidas (padrão ou atualizadas)
      const validEmail = adminCredentials.email || "lucas@apontt.com";
      const validPassword = adminCredentials.password || storedPassword;
      
      if (data.email.toLowerCase() === validEmail.toLowerCase() && data.password === validPassword) {
        localStorage.setItem("apontt_token", "admin_token");
        
        // Usar sistema de persistência para preservar dados do perfil
        const defaultData = {
          name: "Lucas - Administrador Apontt",
          email: data.email,
          role: "Administrador do Sistema"
        };
        
        // Mesclar com dados salvos do perfil
        const userData = ProfilePersistence.mergeWithDefault(defaultData);
        
        localStorage.setItem("apontt_user", JSON.stringify(userData));
        
        // Atualizar o store centralizado para sincronizar todos os componentes
        userDataStore.updateData(userData);
        
        toast({
          title: "Acesso autorizado",
          description: `Bem-vindo, ${userData.name || "Administrador"}!`,
        });
        
        onLogin();
      } else {
        toast({
          title: "Acesso negado",
          description: "Credenciais incorretas. Verifique email e senha.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto text-blue-600">
            <rect width="80" height="80" rx="12" fill="currentColor"/>
            <text x="40" y="52" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">A</text>
          </svg>
          <h1 className="text-2xl font-bold text-blue-600 mt-4">Apontt</h1>
        </div>

        <Card className="shadow-md border-2 border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Entrar no Sistema
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Acesso oficial: lucas@apontt.com
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            type="email" 
                            placeholder="seu@email.com"
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Sua senha"
                            className="pl-10 pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                © 2025 Apontt - Sistema de Gestão de Vendas
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          © 2025 Apontt. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}