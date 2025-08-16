import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Plus, 
  Eye,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  LogOut,
  CheckCircle,
  CreditCard
} from "lucide-react";

// Schema para criação de contrato
const contractSchema = z.object({
  clientName: z.string().min(1, "Nome é obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  clientPhone: z.string().optional(),
  clientDocument: z.string().optional(),
  type: z.string().min(1, "Tipo é obrigatório"),
  value: z.string().min(1, "Valor é obrigatório"),
  description: z.string().optional(),
});

type ContractForm = z.infer<typeof contractSchema>;

// Schema para criação de cliente
const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function PartnerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Obter token do parceiro da URL - suporta tanto /partner/{token} quanto /partner?token={token}
  let partnerToken = null;
  
  if (window.location.pathname.startsWith('/partner/') && window.location.pathname.length > 9) {
    // Token na URL como /partner/{token}
    partnerToken = window.location.pathname.replace('/partner/', '');
  } else {
    // Token como query parameter ?token={token}
    const urlParams = new URLSearchParams(window.location.search);
    partnerToken = urlParams.get('token');
  }

  if (!partnerToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Token de acesso inválido ou não fornecido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Buscar dados do parceiro
  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: ['/api/public/partner', partnerToken],
    queryFn: async () => {
      const response = await fetch(`/api/public/partner/${partnerToken}`);
      if (!response.ok) throw new Error('Falha ao buscar dados do parceiro');
      return response.json();
    },
  });

  // Mutation para criar contrato
  const createContractMutation = useMutation({
    mutationFn: async (contractData: ContractForm & { partnerId: number }) => {
      return await apiRequest("POST", "/api/contracts", contractData);
    },
    onSuccess: () => {
      toast({
        title: "✅ Contrato criado!",
        description: "Contrato criado com sucesso. Link de assinatura gerado.",
        duration: 3000,
      });
      contractForm.reset();
      setShowContractForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message || "Não foi possível criar o contrato",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutation para criar cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: CustomerForm & { partnerId: number }) => {
      return await apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: () => {
      toast({
        title: "✅ Cliente adicionado!",
        description: "Cliente cadastrado com sucesso.",
        duration: 3000,
      });
      customerForm.reset();
      setShowCustomerForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Não foi possível cadastrar o cliente",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutation para gerar pagamentos PIX
  const generatePaymentMutation = useMutation({
    mutationFn: async ({ contractId, customerId }: { contractId: number; customerId?: number }) => {
      return await apiRequest("POST", "/api/wallet/payments", {
        contractId,
        customerId,
        method: "PIX",
        amount: contracts.find((c: any) => c.id === contractId)?.value,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Pagamento PIX gerado!",
        description: "Cobrança criada no Asaas. Cliente receberá o link por email.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message || "Não foi possível gerar o pagamento PIX",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Form para contratos
  const contractForm = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientDocument: "",
      type: "",
      value: "",
      description: "",
    },
  });

  // Form para clientes
  const customerForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      document: "",
      address: "",
      city: "",
      state: "",
    },
  });

  // Mutation para criar contrato
  const createContractMutation = useMutation({
    mutationFn: async (data: ContractForm & { partnerId: number }) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
      setShowContractForm(false);
      contractForm.reset();
      toast({
        title: "Sucesso",
        description: `Contrato criado! Link de assinatura: ${data.signatureLink}`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar contrato",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerForm & { partnerId: number }) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
      setShowCustomerForm(false);
      customerForm.reset();
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cliente",
        variant: "destructive",
      });
    },
  });

  // Mutation para gerar link de pagamento
  const generatePaymentMutation = useMutation({
    mutationFn: async ({ contractId, customerId }: { contractId: number; customerId: number }) => {
      const contract = partnerData?.contracts?.find((c: any) => c.id === contractId);
      if (!contract) throw new Error('Contrato não encontrado');

      // Formatar telefone para o padrão brasileiro (sem +55)
      const formattedPhone = contract.clientPhone?.replace(/[^\d]/g, '').replace(/^55/, '') || '';
      
      const response = await apiRequest("POST", "/api/payments/asaas", {
        billingType: "UNDEFINED",
        value: contract.value,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        description: `Contrato: ${contract.type}`,
        customerName: contract.clientName,
        customerEmail: contract.clientEmail,
        customerPhone: formattedPhone,
        customerDocument: contract.clientDocument || '00000000000',
        contractId: contractId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Link de pagamento gerado com sucesso!",
      });
      // Mostrar o link ou QR code do PIX
      if (data.pixQrCode) {
        window.open(data.pixQrCode, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao gerar link de pagamento",
        variant: "destructive",
      });
    },
  });

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!partnerData?.partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Parceiro não encontrado</CardTitle>
            <CardDescription>
              Token inválido ou parceiro não ativo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { partner, customers = [], contracts = [], metrics = {} } = partnerData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard do Parceiro</h1>
              <p className="text-gray-600">Bem-vindo, {partner.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {partner.city}, {partner.state}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Logout realizado",
                    description: "Até logo!",
                    duration: 2000,
                  });
                  setTimeout(() => {
                    window.location.href = "/partner-login";
                  }, 1000);
                }}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {Number(partner.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {Number(partner.totalCommissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa: {partner.commissionRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 mb-6">
          <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={customerForm.handleSubmit((data) => 
                  createCustomerMutation.mutate({ ...data, partnerId: partner.id })
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input {...customerForm.register("name")} />
                    {customerForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{customerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" {...customerForm.register("email")} />
                    {customerForm.formState.errors.email && (
                      <p className="text-sm text-red-600">{customerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <Input {...customerForm.register("phone")} />
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Input {...customerForm.register("company")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <Input {...customerForm.register("city")} />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input {...customerForm.register("state")} />
                  </div>
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Textarea {...customerForm.register("address")} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCustomerForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showContractForm} onOpenChange={setShowContractForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Contrato</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={contractForm.handleSubmit((data) => 
                  createContractMutation.mutate({ ...data, partnerId: partner.id })
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Cliente *</Label>
                    <Input {...contractForm.register("clientName")} />
                    {contractForm.formState.errors.clientName && (
                      <p className="text-sm text-red-600">{contractForm.formState.errors.clientName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Email do Cliente *</Label>
                    <Input type="email" {...contractForm.register("clientEmail")} />
                    {contractForm.formState.errors.clientEmail && (
                      <p className="text-sm text-red-600">{contractForm.formState.errors.clientEmail.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <Input {...contractForm.register("clientPhone")} />
                  </div>
                  <div>
                    <Label>CPF/CNPJ</Label>
                    <Input {...contractForm.register("clientDocument")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Contrato *</Label>
                    <Input {...contractForm.register("type")} placeholder="Ex: Serviços de Marketing" />
                    {contractForm.formState.errors.type && (
                      <p className="text-sm text-red-600">{contractForm.formState.errors.type.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Valor *</Label>
                    <Input 
                      {...contractForm.register("value")} 
                      placeholder="Ex: 1500.00" 
                      onChange={(e) => {
                        // Converter vírgula para ponto automaticamente
                        let value = e.target.value.replace(',', '.');
                        contractForm.setValue("value", value);
                      }}
                    />
                    {contractForm.formState.errors.value && (
                      <p className="text-sm text-red-600">{contractForm.formState.errors.value.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea {...contractForm.register("description")} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowContractForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createContractMutation.isPending}>
                    {createContractMutation.isPending ? "Criando..." : "Criar Contrato"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Abas com dados do parceiro */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Meus Clientes</CardTitle>
                  <CardDescription>
                    Lista dos seus clientes cadastrados
                  </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          customer.status === 'customer' ? 'default' :
                          customer.status === 'qualified' ? 'secondary' : 'outline'
                        }>
                          {customer.status === 'lead' ? 'Lead' :
                           customer.status === 'qualified' ? 'Qualificado' : 'Cliente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Contratos */}
          <Card>
            <CardHeader>
              <CardTitle>Meus Contratos</CardTitle>
              <CardDescription>
                Contratos criados por você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.clientName}</p>
                          <p className="text-sm text-gray-500">{contract.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          contract.status === 'signed' ? 'default' :
                          contract.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {contract.status === 'pending' ? 'Pendente' :
                           contract.status === 'awaiting_signature' ? 'Aguardando' : 'Assinado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* Link de Assinatura */}
                          {contract.signatureLink && contract.status !== 'signed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(contract.signatureLink);
                                toast({
                                  title: "Link copiado!",
                                  description: "Link de assinatura copiado para a área de transferência",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Abrir Link de Assinatura */}
                          {contract.signatureLink && contract.status !== 'signed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(contract.signatureLink, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* PIX para contratos assinados */}
                          {contract.status === 'signed' && (
                            <Button 
                              size="sm" 
                              onClick={() => generatePaymentMutation.mutate({ 
                                contractId: contract.id, 
                                customerId: customers.find((c: any) => c.email === contract.clientEmail)?.id 
                              })}
                              disabled={generatePaymentMutation.isPending}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Histórico de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Total de vendas realizadas</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    R$ {Number(partner.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {contracts.filter((c: any) => c.status === 'signed').length} contratos fechados
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Status dos Contratos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {contracts.filter((c: any) => c.status === 'pending' || c.status === 'awaiting_signature').length}
                    </p>
                    <p className="text-sm text-yellow-700">Pendentes</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {contracts.filter((c: any) => c.status === 'signed').length}
                    </p>
                    <p className="text-sm text-green-700">Assinados</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {contracts.filter((c: any) => c.status === 'signed' && c.paymentStatus === 'paid').length}
                    </p>
                    <p className="text-sm text-blue-700">Pagos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Minhas Comissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-gray-500">Total acumulado</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">
                      R$ {Number(partner.totalCommissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Taxa atual: {partner.commissionRate}%
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Cálculo das Comissões</h4>
                    <div className="space-y-2 text-sm">
                      {contracts.filter((c: any) => c.status === 'signed').map((contract: any) => (
                        <div key={contract.id} className="flex justify-between items-center py-2 border-b">
                          <span>{contract.clientName} - {contract.type}</span>
                          <span className="font-medium text-green-600">
                            R$ {((Number(contract.value) * Number(partner.commissionRate)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de detalhes do cliente */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p>{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p>{selectedCustomer.phone || 'Não informado'}</p>
                </div>
              </div>
              <div>
                <Label>Empresa</Label>
                <p>{selectedCustomer.company || 'Não informado'}</p>
              </div>
              <div>
                <Label>Endereço</Label>
                <p>{selectedCustomer.address || 'Não informado'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <p>{selectedCustomer.city || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <p>{selectedCustomer.state || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}