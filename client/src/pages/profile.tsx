import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Save, 
  Mail, 
  Lock, 
  Settings, 
  Shield, 
  Bell, 
  Palette,
  Globe,
  Database,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  
  // Estados para configurações do administrador
  const [adminName, setAdminName] = useState("Administrador Apontt");
  const [adminEmail, setAdminEmail] = useState("admin@apontt.com");
  const [currentLogin, setCurrentLogin] = useState("lucas@apontt.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Estados para configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: "pt-BR",
    autoBackup: true,
    sessionTimeout: "30",
  });

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminName,
          adminEmail,
          currentLogin,
          systemSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar perfil');
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas configurações foram salvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        title: "Erro",
        description: "Informe a senha atual",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Senha atual incorreta');
      }

      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso!",
      });

      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar senha. Verifique a senha atual.",
        variant: "destructive",
      });
    }
  };

  const systemStatus = {
    database: "Conectado",
    apiIntegrations: "4 de 4 ativas",
    lastBackup: "Hoje às 03:00",
    uptime: "99.9%",
    users: "1 admin, 15 parceiros",
  };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="travel-title flex items-center">
              <User className="h-6 w-6 mr-2" />
              Perfil do Administrador
            </h2>
            <p className="travel-subtitle">Configurações e preferências do sistema</p>
          </div>
          <Button onClick={handleSave} className="travel-btn">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="travel-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
                <TabsTrigger value="system">Sistema</TabsTrigger>
                <TabsTrigger value="notifications">Alertas</TabsTrigger>
              </TabsList>

              {/* Aba Perfil */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="travel-card-title flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{adminName}</h3>
                        <p className="text-gray-500">{currentLogin}</p>
                        <Badge className="bg-green-100 text-green-800 border-green-200 mt-2">
                          <Shield className="h-3 w-3 mr-1" />
                          Administrador
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="adminName" className="travel-label">Nome do Administrador</Label>
                        <Input
                          id="adminName"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="travel-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminEmail" className="travel-label">Email Principal</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="travel-input"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currentLogin" className="travel-label">Login de Acesso</Label>
                      <Input
                        id="currentLogin"
                        value={currentLogin}
                        onChange={(e) => setCurrentLogin(e.target.value)}
                        className="travel-input"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Segurança */}
              <TabsContent value="security" className="space-y-6">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="travel-card-title flex items-center">
                      <Lock className="h-5 w-5 mr-2" />
                      Alterar Senha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="currentPassword" className="travel-label">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="travel-input pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="newPassword" className="travel-label">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="travel-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="travel-label">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="travel-input"
                        />
                      </div>
                    </div>

                    <Button onClick={handlePasswordChange} className="travel-btn">
                      <Lock className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </CardContent>
                </Card>

                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="travel-card-title flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Configurações de Segurança
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                          <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Breve</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <h4 className="font-medium">Sessões Ativas</h4>
                          <p className="text-sm text-gray-500">Gerencie dispositivos conectados</p>
                        </div>
                        <Button variant="outline" size="sm" className="travel-btn-outline">Gerenciar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Sistema */}
              <TabsContent value="system" className="space-y-6">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="travel-card-title flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Configurações do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="travel-label">Idioma do Sistema</Label>
                        <select 
                          className="travel-input"
                          value={systemSettings.language}
                          onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español</option>
                        </select>
                      </div>
                      <div>
                        <Label className="travel-label">Timeout de Sessão (minutos)</Label>
                        <Input
                          type="number"
                          value={systemSettings.sessionTimeout}
                          onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: e.target.value})}
                          className="travel-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <h4 className="font-medium">Backup Automático</h4>
                          <p className="text-sm text-gray-500">Backup diário dos dados do sistema</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={systemSettings.autoBackup}
                            onChange={(e) => setSystemSettings({...systemSettings, autoBackup: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">{systemSettings.autoBackup ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Notificações */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="travel-card-title flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Preferências de Notificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <h4 className="font-medium">Notificações Push</h4>
                          <p className="text-sm text-gray-500">Alertas em tempo real no sistema</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={systemSettings.notifications}
                            onChange={(e) => setSystemSettings({...systemSettings, notifications: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">{systemSettings.notifications ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <h4 className="font-medium">Alertas por Email</h4>
                          <p className="text-sm text-gray-500">Receber notificações importantes por email</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={systemSettings.emailAlerts}
                            onChange={(e) => setSystemSettings({...systemSettings, emailAlerts: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">{systemSettings.emailAlerts ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar de Status */}
          <div className="space-y-6">
            <Card className="travel-card">
              <CardHeader>
                <CardTitle className="travel-card-title flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Banco de Dados</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Asaas</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Conectado</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Google Sheets</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Ativo</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Último Backup</span>
                  <span className="text-sm font-medium">Hoje, 03:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium">99.9%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="travel-card">
              <CardHeader>
                <CardTitle className="travel-card-title">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Novo parceiro cadastrado</p>
                    <p className="text-xs text-gray-500">Há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Contrato assinado</p>
                    <p className="text-xs text-gray-500">Há 4 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Backup realizado</p>
                    <p className="text-xs text-gray-500">Há 6 horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}