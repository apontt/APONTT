import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, LogIn, User } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function PartnerLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Pré-preencher email da URL se disponível
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      form.setValue('email', emailParam);
      // Gerar senha padrão sugerida
      const suggestedPassword = emailParam.split('@')[0] + "123";
      form.setValue('password', suggestedPassword);
    }
  }, [form]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      // Primeiro validar as credenciais
      const validateResponse = await apiRequest("POST", "/api/partners/validate-login", {
        partnerId: null, // Será determinado pelo email
        email: data.email,
        password: data.password,
      });
      const validation = await validateResponse.json();
      
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      return validation;
    },
    onSuccess: (validation) => {
      toast({
        title: "✅ Login realizado com sucesso!",
        description: `Bem-vindo, ${validation.partner.name}!`,
        duration: 2000,
      });
      
      // Redirecionar imediatamente para o dashboard do parceiro usando o token
      const targetUrl = `/partner/${validation.partner.dashboardToken}`;
      console.log("Redirecionando para:", targetUrl);
      window.location.href = targetUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="travel-bg min-h-screen flex items-center justify-center">
      <div className="partner-login-container">
        <Card className="travel-card w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <CardTitle className="travel-title text-2xl">Login de Parceiro</CardTitle>
            <p className="travel-subtitle mt-2">Acesse seu dashboard exclusivo</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="travel-label">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                        className="travel-input"
                      />
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
                    <FormLabel className="travel-label">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          {...field}
                          className="travel-input pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Sua senha padrão é: <strong>{form.watch("email").split('@')[0]}123</strong>
                    </p>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full travel-btn border-2 border-blue-500 bg-blue-600 hover:bg-blue-700 hover:border-blue-600 shadow-lg"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Entrar no Dashboard</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                📞 Precisa de ajuda?
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Entre em contato com o administrador para obter suas credenciais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}