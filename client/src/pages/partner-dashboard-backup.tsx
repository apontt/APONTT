import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTabScroll } from "@/hooks/useTabScroll";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { FaWhatsapp } from "react-icons/fa";
import { 
  Plus, 
  Eye, 
  Copy, 
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  LogOut,
  ExternalLink,
  Send,
  Link,
  Users,
  TrendingUp,
  MapPin,
  Trash2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// Schema de validação
const customerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
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
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [showContractDialog, setShowContractDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showContractValueDialog, setShowContractValueDialog] = useState(false);
  const [contractValue, setContractValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  
  // Estados para seleção múltipla
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  const [selectAllCustomers, setSelectAllCustomers] = useState(false);
  const [selectAllContracts, setSelectAllContracts] = useState(false);
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState("overview");

  // Extrair token da URL
  let partnerToken: string | null = null;

  if (window.location.pathname.startsWith('/partner/') && window.location.pathname.length > 9) {
    partnerToken = window.location.pathname.replace('/partner/', '');
  } else {
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
        </div>
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

  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/public/partner/${partner?.token}`],
      });
      toast({
        title: "✅ Contrato criado!",
        description: "Contrato gerado com sucesso. Redirecionando para 'Meus Contratos'...",
        duration: 3000,
      });
      setShowContractValueDialog(false);
      setContractValue("");
      setPaymentMethod("pix");
      // Redirecionar automaticamente para a aba "Meus Contratos"
      setTimeout(() => {
        setActiveTab("contracts");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar contrato",
        variant: "destructive",
      });
    },
  });

  const handleConfirmContract = () => {
    if (!selectedCustomer || !contractValue) {
      toast({
        title: "Erro",
        description: "Preencha o valor do contrato",
        variant: "destructive",
      });
      return;
    }

    const contractData = {
      clientName: selectedCustomer.name,
      clientEmail: selectedCustomer.email,
      clientPhone: selectedCustomer.phone || "Não informado",
      type: "Prestação de Serviços",
      value: contractValue,
      description: `Contrato de prestação de serviços para ${selectedCustomer.name}. Forma de pagamento: ${paymentMethod}`,
      paymentMethod: paymentMethod,
    };

    createContractMutation.mutate(contractData);
  };

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

  // Mutation para gerar pagamentos PIX usando a API real do Asaas
  const generatePaymentMutation = useMutation({
    mutationFn: async ({ contractId }: { contractId: number }) => {
      const contract = contracts.find((c: any) => c.id === contractId);
      if (!contract) throw new Error('Contrato não encontrado');
      
      const response = await apiRequest("POST", "/api/payments/asaas", {
        billingType: "PIX",
        value: contract.value,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
        description: `Contrato: ${contract.type}`,
        customerName: contract.clientName,
        customerEmail: contract.clientEmail,
        customerPhone: contract.clientPhone?.replace(/[^\d]/g, ''),
        customerDocument: contract.clientDocument || '',
        contractId: contractId,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pagamento PIX gerado!",
        description: "Link de pagamento Asaas aberto em nova aba",
        duration: 5000,
      });
      
      // Abrir link de pagamento real do Asaas
      if (data.paymentLink || data.invoiceUrl) {
        window.open(data.paymentLink || data.invoiceUrl, '_blank');
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/public/partner/${partnerToken}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message || "Não foi possível gerar o pagamento PIX no Asaas",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutation para excluir contrato
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      return await apiRequest("DELETE", `/api/contracts/${contractId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "✅ Contrato excluído!",
        description: "Contrato removido com sucesso.",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir contrato",
        description: error.message || "Não foi possível excluir o contrato",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutation para excluir múltiplos contratos
  const deleteMultipleContractsMutation = useMutation({
    mutationFn: async (contractIds: number[]) => {
      const promises = contractIds.map(id => apiRequest("DELETE", `/api/contracts/${id}`, {}));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "✅ Contratos excluídos!",
        description: `${selectedContracts.length} contratos removidos com sucesso.`,
        duration: 3000,
      });
      setSelectedContracts([]);
      setSelectAllContracts(false);
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir contratos",
        description: error.message || "Não foi possível excluir os contratos",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutation para excluir múltiplos clientes
  const deleteMultipleCustomersMutation = useMutation({
    mutationFn: async (customerIds: number[]) => {
      const promises = customerIds.map(id => apiRequest("DELETE", `/api/customers/${id}`, {}));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "✅ Clientes excluídos!",
        description: `${selectedCustomers.length} clientes removidos com sucesso.`,
        duration: 3000,
      });
      setSelectedCustomers([]);
      setSelectAllCustomers(false);
      queryClient.invalidateQueries({ queryKey: ['/api/public/partner', partnerToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir clientes",
        description: error.message || "Não foi possível excluir os clientes",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Funções para gerenciar seleção de clientes
  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectAllCustomers) {
      setSelectedCustomers([]);
      setSelectAllCustomers(false);
    } else {
      setSelectedCustomers(customers.map((c: any) => c.id));
      setSelectAllCustomers(true);
    }
  };

  // Funções para gerenciar seleção de contratos
  const handleSelectContract = (contractId: number) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAllContracts = () => {
    if (selectAllContracts) {
      setSelectedContracts([]);
      setSelectAllContracts(false);
    } else {
      setSelectedContracts(contracts.map((c: any) => c.id));
      setSelectAllContracts(true);
    }
  };

  // Função para gerar contrato automaticamente a partir do cliente
  const handleGenerateContractFromCustomer = (customer: any) => {
    const defaultContractData = {
      clientName: customer.name,
      clientEmail: customer.email,
      clientPhone: customer.phone || "",
      clientDocument: customer.document || "",
      type: customer.company ? "Prestação de Serviços Empresariais" : "Prestação de Serviços",
      value: customer.value || "1000.00",
      description: `Contrato de prestação de serviços para ${customer.name}${customer.company ? ` - ${customer.company}` : ''}. Serviços a serem definidos conforme necessidades do cliente.`,
    };

    // Executar mutation e será redirecionado automaticamente pelo onSuccess
    createContractMutation.mutate({ 
      ...defaultContractData, 
      partnerId: partner.id 
    });
  };

  // Logout function
  const handleLogout = () => {
    setLocation('/partner-login');
  };

  if (partnerLoading) {
    return (
      <div className="travel-bg min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle className="text-blue-600">Carregando...</CardTitle>
            <CardDescription className="text-black">
              Carregando dados do parceiro...
            </CardDescription>
          </CardHeader>
        </div>
      </div>
    );
  }

  if (!partnerData || !partnerData.partner) {
    return (
      <div className="travel-bg min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle className="text-red-600">Parceiro Não Encontrado</CardTitle>
            <CardDescription className="text-black">
              Não foi possível encontrar os dados do parceiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/partner-login')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Fazer Login Novamente
            </Button>
          </CardContent>
        </div>
      </div>
    );
  }

  const { partner, contracts, customers, stats } = partnerData;

  const updateContractValue = async (contractId: number, value: string) => {
    if (!value || isNaN(parseFloat(value))) {
      toast({
        title: "Erro",
        description: "Valor inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("PUT", `/api/contracts/${contractId}/value`, { value });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/public/partner/${partner?.token}`] });
        toast({
          title: "Sucesso",
          description: "Valor do contrato atualizado",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar valor do contrato",
        variant: "destructive",
      });
    }
  };

  const generatePayment = async (contract: any) => {
    try {
      const response = await apiRequest("POST", `/api/contracts/${contract.id}/generate-payment`);
      if (response.ok) {
        const paymentData = await response.json();
        
        // Abrir link de pagamento real do Asaas
        if (paymentData.paymentLink) {
          window.open(paymentData.paymentLink, '_blank');
          toast({
            title: "Pagamento Gerado",
            description: "Link de pagamento aberto em nova aba!",
          });
        } else {
          toast({
            title: "Pagamento Gerado",
            description: "Código PIX gerado com sucesso!",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar pagamento",
        variant: "destructive",
      });
    }
  };

  const downloadContract = (contract: any) => {
    // Criar conteúdo HTML para o PDF
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contrato - ${contract.clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .contract-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .signatures { margin-top: 40px; padding: 20px; border: 2px solid #28a745; background: #f8fff8; }
          .signature-item { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; }
          .signature-text { font-family: cursive; font-size: 24px; color: #007bff; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 CONTRATO DIGITAL ASSINADO</h1>
          <p>Documento com validade jurídica</p>
        </div>

        <div class="contract-info">
          <h3>Informações do Contrato</h3>
          <p><strong>Cliente:</strong> ${contract.clientName}</p>
          <p><strong>Email:</strong> ${contract.clientEmail}</p>
          <p><strong>Tipo:</strong> ${contract.type}</p>
          <p><strong>Valor:</strong> R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          ${contract.description ? `<p><strong>Descrição:</strong> ${contract.description}</p>` : ''}
        </div>

        <div class="signatures">
          <h3>Assinaturas Digitais</h3>
          ${contract.authorizationSignature ? `
            <div class="signature-item">
              <h4>Termo de Autorização</h4>
              <div class="signature-text">${contract.authorizationSignature}</div>
              <p><strong>Assinado em:</strong> ${contract.authorizationSignedAt ? format(new Date(contract.authorizationSignedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
            </div>
          ` : ''}

          ${contract.clientSignature ? `
            <div class="signature-item">
              <h4>Contrato Principal</h4>
              <div class="signature-text">${contract.clientSignature}</div>
              <p><strong>Assinado em:</strong> ${contract.signedAt ? format(new Date(contract.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "PDF Gerado",
      description: `Contrato de ${contract.clientName} aberto para impressão`,
    });
  };

  const handleGenerateContract = (customer: any) => {
    setSelectedCustomer(customer);
    setShowContractValueDialog(true);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
      {/* Header */}
      <header className="partner-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-blue-600">
                <rect width="40" height="40" rx="6" fill="currentColor"/>
                <text x="20" y="28" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">A</text>
              </svg>
              <div>
                <h1 className="text-lg font-bold text-blue-600">Apontt</h1>
                <p className="text-sm text-gray-500">Dashboard do Parceiro</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                <p className="text-xs text-gray-500">{partner.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="partner-dashboard">
        {/* KPIs */}
        <div className="partner-metrics">
          <div className="partner-metric-card">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="partner-metric-value">{stats.totalCustomers}</div>
            <div className="partner-metric-label">Clientes</div>
          </div>

          <div className="partner-metric-card">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="partner-metric-value">{stats.totalContracts}</div>
            <div className="partner-metric-label">Contratos</div>
          </div>

          <div className="partner-metric-card">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="partner-metric-value">
              R$ {Number(stats.totalSales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="partner-metric-label">Vendas</div>
          </div>

          <div className="partner-metric-card">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="partner-metric-value">
              R$ {Number(stats.totalCommissions).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="partner-metric-label">Comissões</div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="partner-actions">
          <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
            <DialogTrigger asChild>
              <Button className="partner-btn bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-4 border-white shadow-2xl" aria-describedby="add-customer-description">
              <DialogHeader>
                <DialogTitle className="text-black">Adicionar Novo Cliente</DialogTitle>
                <DialogDescription id="add-customer-description">
                  Preencha os dados do novo cliente para cadastro
                </DialogDescription>
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
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" {...customerForm.register("email")} />
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
                    <Label>CPF/CNPJ</Label>
                    <Input {...customerForm.register("document")} />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input {...customerForm.register("address")} />
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCustomerForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? "Adicionando..." : "Adicionar Cliente"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        </div>

        {/* Abas com dados do parceiro */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Scroll suave quando mudar de aba
          setTimeout(() => {
            const headerHeight = 100;
            const tabsElement = document.querySelector('[role="tablist"]');
            if (tabsElement) {
              const elementTop = tabsElement.getBoundingClientRect().top + window.pageYOffset;
              const offsetPosition = elementTop - headerHeight;
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }, 150);
        }} className="partner-tabs">
          <TabsList className="grid w-full grid-cols-5 partner-content-card">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="generate">Gerar Contratos</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Clientes */}
              <div className="partner-content-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Meus Clientes</CardTitle>
                    <CardDescription>
                      Lista dos seus clientes cadastrados
                    </CardDescription>
                  </div>
                  {selectedCustomers.length > 0 && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir ${selectedCustomers.length} cliente(s)?`)) {
                          deleteMultipleCustomersMutation.mutate(selectedCustomers);
                        }
                      }}
                      disabled={deleteMultipleCustomersMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir ({selectedCustomers.length})
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectAllCustomers}
                              onCheckedChange={handleSelectAllCustomers}
                              aria-label="Selecionar todos os clientes"
                            />
                          </TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer: any) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={() => handleSelectCustomer(customer.id)}
                                aria-label={`Selecionar cliente ${customer.name}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.company || 'Pessoa Física'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{customer.email}</p>
                                {customer.phone && (
                                  <p className="text-gray-500">{customer.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {customer.status === 'limpa_nome' ? 'Limpa Nome' : 
                                 customer.status === 'bacen' ? 'Bacen' : 
                                 customer.status === 'consultoria' ? 'Consultoria' : 
                                 'Lead'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedCustomer(customer)}
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleGenerateContract(customer)}
                                  disabled={createContractMutation.isPending}
                                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  title="Gerar contrato"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </div>

              {/* Contratos */}
              <div className="partner-content-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Meus Contratos</CardTitle>
                    <CardDescription>
                      Contratos criados por você
                    </CardDescription>
                  </div>
                  {selectedContracts.length > 0 && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir ${selectedContracts.length} contrato(s)?`)) {
                          deleteMultipleContractsMutation.mutate(selectedContracts);
                        }
                      }}
                      disabled={deleteMultipleContractsMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir ({selectedContracts.length})
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectAllContracts}
                              onCheckedChange={handleSelectAllContracts}
                              aria-label="Selecionar todos os contratos"
                            />
                          </TableHead>
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
                              <Checkbox 
                                checked={selectedContracts.includes(contract.id)}
                                onCheckedChange={() => handleSelectContract(contract.id)}
                                aria-label={`Selecionar contrato de ${contract.clientName}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{contract.clientName}</p>
                                <p className="text-sm text-gray-500">{contract.type}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {contract.status === "pending" ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    defaultValue={contract.value}
                                    className="h-8 w-24 text-sm"
                                    onBlur={(e) => updateContractValue(contract.id, e.target.value)}
                                  />
                                  <span className="text-xs text-gray-500">R$</span>
                                </div>
                              ) : (
                                <p className="font-bold text-green-600">
                                  R$ {parseFloat(contract.value || "0").toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                              )}
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
                              <div className="flex gap-2">
                                  {/* Botão copiar link - sempre visível */}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                    onClick={() => {
                                      const baseUrl = window.location.origin;
                                      const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                      navigator.clipboard.writeText(signatureUrl);
                                      toast({
                                        title: "✅ Link copiado!",
                                        description: "Link de assinatura copiado para a área de transferência",
                                        duration: 3000,
                                      });
                                    }}
                                    title="Copiar link de assinatura"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>

                                  {/* Botão abrir link - sempre visível */}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                      const baseUrl = window.location.origin;
                                      const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                      window.open(signatureUrl, '_blank');
                                    }}
                                    title="Abrir link de assinatura"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>

                                  {/* Botão WhatsApp - sempre visível quando há telefone */}
                                  {contract.clientPhone && (
                                    <Button 
                                      size="sm" 
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                      onClick={() => {
                                        const baseUrl = window.location.origin;
                                        const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                        
                                        let message = "";
                                        
                                        if (contract.status === 'signed') {
                                          message = `Olá ${contract.clientName}! 👋

✅ *Seu contrato foi assinado com sucesso!*

📋 *Detalhes do Contrato:*
• Tipo: ${contract.type}
• Valor: R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

🔗 *Link do contrato:*
${signatureUrl}

Obrigado por escolher nossos serviços!

Atenciosamente,
${partner.name}`;
                                        } else {
                                          message = `Olá ${contract.clientName}! 👋

Seu contrato está pronto para assinatura digital.

📋 *Detalhes do Contrato:*
• Tipo: ${contract.type}
• Valor: R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

🔗 *Link para assinatura:*
${signatureUrl}

📱 Acesse o link pelo seu celular ou computador para assinar digitalmente.

Qualquer dúvida, estou à disposição!

Atenciosamente,
${partner.name}`;
                                        }

                                        const whatsappUrl = generateWhatsAppLink(contract.clientPhone, message);
                                        window.open(whatsappUrl, '_blank');

                                        toast({
                                          title: "✅ WhatsApp aberto!",
                                          description: "Mensagem preparada para envio via WhatsApp",
                                          duration: 3000,
                                        });
                                      }}
                                      title="Enviar via WhatsApp"
                                    >
                                      <FaWhatsapp className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* Botão Assinar Contrato - para contratos pendentes */}
                                  {contract.status === 'pending' && (
                                    <Button 
                                      size="sm" 
                                      className="bg-orange-500 hover:bg-orange-600 text-white"
                                      onClick={() => {
                                        const baseUrl = window.location.origin;
                                        const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                        window.open(signatureUrl, '_blank');
                                        toast({
                                          title: "📝 Página de assinatura aberta!",
                                          description: "Página de assinatura do contrato foi aberta em nova aba",
                                          duration: 3000,
                                        });
                                      }}
                                      title="Assinar contrato"
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Assinar
                                    </Button>
                                  )}

                                  {/* Botão Gerar Pagamento PIX - para contratos assinados */}
                                  {contract.status === 'signed' && (
                                    <Button 
                                      size="sm" 
                                      className="bg-purple-500 hover:bg-purple-600 text-white"
                                      onClick={() => {
                                        generatePaymentMutation.mutate({ 
                                          contractId: contract.id
                                        });
                                      }}
                                      disabled={generatePaymentMutation.isPending}
                                      title="Gerar cobrança PIX"
                                    >
                                      {generatePaymentMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <CreditCard className="h-4 w-4 mr-1" />
                                          PIX
                                        </>
                                      )}
                                    </Button>
                                  )}

                                  {contract.status === 'pending' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                      onClick={() => {
                                        if (window.confirm(`Tem certeza que deseja excluir o contrato de ${contract.clientName}?`)) {
                                          deleteContractMutation.mutate(contract.id);
                                        }
                                      }}
                                      disabled={deleteContractMutation.isPending}
                                      title="Excluir contrato"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="partner-content-card">
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
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <div className="partner-content-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Meus Contratos
                </CardTitle>
                <CardDescription>
                  Gerencie todos os seus contratos criados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!contracts || contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum contrato criado ainda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Use a aba "Gerar Contratos" para criar seu primeiro contrato
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract: any) => (
                      <div key={contract.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-black">{contract.clientName}</h3>
                            <p className="text-sm text-gray-600">{contract.type} • R$ {parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-500">
                              Criado: {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                            </p>
                          </div>
                          <Badge 
                            variant={contract.status === 'signed' ? 'default' : 'secondary'}
                            className={contract.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {contract.status === 'signed' ? 'Assinado' : contract.status === 'pending' ? 'Pendente' : 'Aguardando'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Botão Copiar Link */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              const baseUrl = window.location.origin;
                              const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                              navigator.clipboard.writeText(signatureUrl);
                              toast({
                                title: "✅ Link copiado!",
                                description: "Link de assinatura copiado para a área de transferência",
                                duration: 3000,
                              });
                            }}
                            title="Copiar link de assinatura"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </Button>

                          {/* Botão Abrir Link */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              const baseUrl = window.location.origin;
                              const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                              window.open(signatureUrl, '_blank');
                              toast({
                                title: "🔗 Link aberto!",
                                description: "Página de assinatura aberta em nova aba",
                                duration: 3000,
                              });
                            }}
                            title="Abrir página de assinatura"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Abrir Link
                          </Button>

                          {/* Botão WhatsApp */}
                          {contract.clientPhone && (
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => {
                                const baseUrl = window.location.origin;
                                const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                
                                let message = "";
                                
                                if (contract.status === 'signed') {
                                  message = `Olá ${contract.clientName}! 👋

✅ *Seu contrato foi assinado com sucesso!*

📋 *Detalhes do Contrato:*
• Tipo: ${contract.type}
• Valor: R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

🔗 *Link do contrato:*
${signatureUrl}

Obrigado por escolher nossos serviços!

Atenciosamente,
${partner.name}`;
                                } else {
                                  message = `Olá ${contract.clientName}! 👋

Seu contrato está pronto para assinatura digital.

📋 *Detalhes do Contrato:*
• Tipo: ${contract.type}
• Valor: R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

🔗 *Link para assinatura:*
${signatureUrl}

📱 Acesse o link pelo seu celular ou computador para assinar digitalmente.

Qualquer dúvida, estou à disposição!

Atenciosamente,
${partner.name}`;
                                }

                                const whatsappUrl = generateWhatsAppLink(contract.clientPhone, message);
                                window.open(whatsappUrl, '_blank');

                                toast({
                                  title: "✅ WhatsApp aberto!",
                                  description: "Mensagem preparada para envio via WhatsApp",
                                  duration: 3000,
                                });
                              }}
                              title="Enviar via WhatsApp"
                            >
                              <FaWhatsapp className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}

                          {/* Botão Assinar Contrato - para contratos pendentes */}
                          {contract.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              onClick={() => {
                                const baseUrl = window.location.origin;
                                const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                window.open(signatureUrl, '_blank');
                                toast({
                                  title: "📝 Página de assinatura aberta!",
                                  description: "Página de assinatura do contrato foi aberta em nova aba",
                                  duration: 3000,
                                });
                              }}
                              title="Assinar contrato"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Assinar
                            </Button>
                          )}

                          {/* Botão Gerar Pagamento PIX - para contratos assinados */}
                          {contract.status === 'signed' && (
                            <Button 
                              size="sm" 
                              className="bg-purple-500 hover:bg-purple-600 text-white"
                              onClick={() => {
                                generatePaymentMutation.mutate({ 
                                  contractId: contract.id
                                });
                              }}
                              disabled={generatePaymentMutation.isPending}
                              title="Gerar cobrança PIX"
                            >
                              {generatePaymentMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  PIX
                                </>
                              )}
                            </Button>
                          )}

                          {/* Botão Excluir - apenas para contratos pendentes */}
                          {contract.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o contrato de ${contract.clientName}?`)) {
                                  deleteContractMutation.mutate(contract.id);
                                }
                              }}
                              disabled={deleteContractMutation.isPending}
                              title="Excluir contrato"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <div className="partner-content-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Geração Rápida de Contratos
                </CardTitle>
                <CardDescription>
                  Selecione um cliente e gere contratos instantaneamente com links prontos para compartilhar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {customers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Você ainda não tem clientes cadastrados.</p>
                      <p className="text-sm text-gray-400">Adicione clientes na aba "Visão Geral" para poder gerar contratos.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {customers.map((customer: any) => (
                        <Card key={customer.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg text-black">{customer.name}</h3>
                                    <p className="text-sm text-gray-600">{customer.company || 'Pessoa Física'}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    📧 {customer.email}
                                  </span>
                                  {customer.phone && (
                                    <span className="flex items-center gap-1">
                                      📱 {customer.phone}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {customer.status === 'limpa_nome' ? 'Limpa Nome' : 
                                     customer.status === 'bacen' ? 'Bacen' : 
                                     customer.status === 'consultoria' ? 'Consultoria' : 
                                     'Lead'}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button 
                                  onClick={() => handleGenerateContract(customer)}
                                  disabled={createContractMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  {createContractMutation.isPending ? "Gerando..." : "Gerar Contrato"}
                                </Button>
                                
                                {/* Mostrar contratos existentes para este cliente */}
                                {contracts.filter((c: any) => c.clientEmail === customer.email).length > 0 && (
                                  <div className="flex gap-2">
                                    {contracts
                                      .filter((c: any) => c.clientEmail === customer.email)
                                      .slice(0, 1)
                                      .map((contract: any) => (
                                        <div key={contract.id} className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                            onClick={() => {
                                              const baseUrl = window.location.origin;
                                              const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                              navigator.clipboard.writeText(signatureUrl);
                                              toast({
                                                title: "✅ Link copiado!",
                                                description: "Link de assinatura copiado para a área de transferência",
                                                duration: 3000,
                                              });
                                            }}
                                            title="Copiar link de assinatura"
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          
                                          {/* Botão Assinar Contrato - para contratos pendentes */}
                                          {contract.status === 'pending' && (
                                            <Button 
                                              size="sm" 
                                              className="bg-orange-500 hover:bg-orange-600 text-white"
                                              onClick={() => {
                                                const baseUrl = window.location.origin;
                                                const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                                window.open(signatureUrl, '_blank');
                                                toast({
                                                  title: "📝 Página de assinatura aberta!",
                                                  description: "Página de assinatura do contrato foi aberta em nova aba",
                                                  duration: 3000,
                                                });
                                              }}
                                              title="Assinar contrato"
                                            >
                                              <FileText className="h-4 w-4 mr-1" />
                                              Assinar
                                            </Button>
                                          )}

                                          {/* Botão Gerar Pagamento PIX - para contratos assinados */}
                                          {contract.status === 'signed' && (
                                            <Button 
                                              size="sm" 
                                              className="bg-purple-500 hover:bg-purple-600 text-white"
                                              onClick={() => {
                                                generatePaymentMutation.mutate({ 
                                                  contractId: contract.id
                                                });
                                              }}
                                              disabled={generatePaymentMutation.isPending}
                                              title="Gerar cobrança PIX"
                                            >
                                              {generatePaymentMutation.isPending ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                              ) : (
                                                <>
                                                  <CreditCard className="h-4 w-4 mr-1" />
                                                  PIX
                                                </>
                                              )}
                                            </Button>
                                          )}

                                          {customer.phone && (
                                            <Button 
                                              size="sm" 
                                              className="bg-green-500 hover:bg-green-600 text-white"
                                              onClick={() => {
                                                const baseUrl = window.location.origin;
                                                const signatureUrl = `${baseUrl}/sign/${contract.linkToken || contract.signatureToken}`;
                                                
                                                let message = "";
                                                
                                                if (contract.status === 'signed') {
                                                  message = `Olá ${customer.name}! 👋

✅ *Seu contrato foi assinado com sucesso!*

📋 *Detalhes do Contrato:*
• Tipo: ${contract.type}
• Valor: R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

🔗 *Link do contrato:*
${signatureUrl}

Obrigado por escolher nossos serviços!

Atenciosamente,
${partner.name}`;
                                                } else {
                                                  message = `Olá ${customer.name}! 👋

Seu contrato está pronto para assinatura digital.

📋 *Detalhes do Contrato:*
• Tipo: ${contract.type}
• Valor: R$ ${parseFloat(contract.value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

🔗 *Link para assinatura:*
${signatureUrl}

📱 Acesse o link pelo seu celular ou computador para assinar digitalmente.

Qualquer dúvida, estou à disposição!

Atenciosamente,
${partner.name}`;
                                                }

                                                const whatsappUrl = generateWhatsAppLink(customer.phone, message);
                                                window.open(whatsappUrl, '_blank');

                                                toast({
                                                  title: "✅ WhatsApp aberto!",
                                                  description: "Mensagem preparada para envio via WhatsApp",
                                                  duration: 3000,
                                                });
                                              }}
                                              title="Enviar via WhatsApp"
                                            >
                                              <FaWhatsapp className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    
                                    {contracts.filter((c: any) => c.clientEmail === customer.email).length > 1 && (
                                      <Badge variant="secondary" className="self-center">
                                        +{contracts.filter((c: any) => c.clientEmail === customer.email).length - 1} contratos
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <div className="partner-content-card">
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
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <div className="partner-content-card">
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
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de detalhes do cliente */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="bg-white border-4 border-white shadow-2xl" aria-describedby="customer-details-description">
            <DialogHeader>
              <DialogTitle className="text-black">Detalhes do Cliente</DialogTitle>
              <DialogDescription id="customer-details-description" className="text-black">
                Informações completas do cliente selecionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 bg-white">
              <div>
                <Label className="text-black font-medium">Nome</Label>
                <p className="font-medium text-black">{selectedCustomer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-medium">Email</Label>
                  <p className="text-black">{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label className="text-black font-medium">Telefone</Label>
                  <p className="text-black">{selectedCustomer.phone || 'Não informado'}</p>
                </div>
              </div>
              <div>
                <Label className="text-black font-medium">Empresa</Label>
                <p className="text-black">{selectedCustomer.company || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-black font-medium">Endereço</Label>
                <p className="text-black">{selectedCustomer.address || 'Não informado'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-medium">Cidade</Label>
                  <p className="text-black">{selectedCustomer.city || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-black font-medium">Estado</Label>
                  <p className="text-black">{selectedCustomer.state || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Contract Value and Payment Dialog */}
        <Dialog open={showContractValueDialog} onOpenChange={setShowContractValueDialog}>
          <DialogContent className="max-w-md bg-white border-4 border-white shadow-2xl" aria-describedby="contract-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-black">Gerar Contrato</DialogTitle>
              <DialogDescription id="contract-dialog-description" className="text-black">
                Defina o valor e forma de pagamento do contrato
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="contractValue" className="text-black font-medium">Valor do Contrato (R$)</Label>
                <Input
                  id="contractValue"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="text-lg bg-white text-black border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-black font-medium">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-white text-black border-gray-300">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pix" className="text-black">PIX</SelectItem>
                    <SelectItem value="cartao" className="text-black">Cartão de Crédito</SelectItem>
                    <SelectItem value="boleto" className="text-black">Boleto Bancário</SelectItem>
                    <SelectItem value="transferencia" className="text-black">Transferência Bancária</SelectItem>
                    <SelectItem value="dinheiro" className="text-black">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-black">Cliente:</h4>
                  <p className="text-sm text-black">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-700">{selectedCustomer.email}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowContractValueDialog(false);
                  setContractValue("");
                  setPaymentMethod("pix");
                }}
                className="bg-white text-black border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmContract}
                disabled={createContractMutation.isPending || !contractValue}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createContractMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  "Gerar Contrato"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}