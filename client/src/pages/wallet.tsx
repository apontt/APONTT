import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  WalletIcon, 
  Plus, 
  Search, 
  Eye, 
  Send, 
  QrCode, 
  Receipt, 
  CheckCircle, 
  Clock, 
  XCircle,
  Copy,
  ExternalLink,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Trash2
} from "lucide-react";
import { FaWhatsapp, FaPix } from "react-icons/fa6";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

const paymentSchema = z.object({
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD", "UNDEFINED"]),
  value: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().min(1, "Telefone é obrigatório"),
  customerDocument: z.string().min(1, "CPF/CNPJ é obrigatório"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface Payment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  createdAt: string;
}

export default function Wallet() {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar cobranças da carteira
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/wallet/payments"],
  });

  // Buscar clientes cadastrados
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Estatísticas da carteira
  const walletStats = {
    total: payments.length,
    paid: payments.filter(p => p.status === "RECEIVED").length,
    pending: payments.filter(p => p.status === "PENDING").length,
    overdue: payments.filter(p => p.status === "OVERDUE").length,
    totalValue: payments.reduce((sum, p) => sum + p.value, 0),
    paidValue: payments.filter(p => p.status === "RECEIVED").reduce((sum, p) => sum + p.value, 0),
    pendingValue: payments.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.value, 0),
  };

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      billingType: "UNDEFINED",
      value: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerDocument: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      const response = await apiRequest("POST", "/api/payments/asaas", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Cobrança criada com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/payments"] });
      setShowCreateDialog(false);
      form.reset();

      if (data.simulationMode) {
        toast({
          title: "Cobrança criada em modo teste",
          description: "Sistema funcionando! Chave Asaas precisa ser válida para gerar cobranças reais.",
        });
      } else {
        toast({
          title: "Cobrança criada no Asaas!",
          description: "PIX ou boleto gerado com sucesso e salvo no sistema.",
        });
      }

      // Se tiver link de cobrança, copiar para área de transferência
      const invoiceLink = data.invoiceUrl || data.payment?.invoiceUrl;
      if (invoiceLink) {
        navigator.clipboard.writeText(invoiceLink);
        toast({
          title: "Link copiado!",
          description: "Link da cobrança copiado para área de transferência.",
        });
      }
    },
    onError: (error: any) => {
      console.error("Erro ao criar cobrança:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cobrança",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir pagamento
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest("DELETE", `/api/wallet/payments/${paymentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/payments"] });
      toast({
        title: "Cobrança excluída",
        description: "Cobrança removida com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Erro ao excluir cobrança",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getBillingTypeIcon = (type: string) => {
    switch (type) {
      case "PIX":
        return <FaPix className="h-4 w-4 text-green-600" />;
      case "BOLETO":
        return <Banknote className="h-4 w-4 text-blue-600" />;
      case "CREDIT_CARD":
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    });
  };

  // Função para preencher dados do cliente selecionado
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);

    if (customerId && customerId !== "manual") {
      const customer = (customers as any[])?.find((c: any) => c.id.toString() === customerId);
      if (customer) {
        form.setValue("customerName", customer.name);
        form.setValue("customerEmail", customer.email);
        form.setValue("customerPhone", customer.phone || "");
        form.setValue("customerDocument", customer.document || "");
        // Preencher descrição baseada no status do cliente
        const serviceDescription = customer.status === "limpa_nome" ? "Serviços de Limpa Nome" :
                                 customer.status === "bacen" ? "Serviços Bacen" :
                                 customer.status === "consultoria" ? "Serviços de Consultoria" :
                                 "Serviços Apontt";
        form.setValue("description", serviceDescription);
        form.setValue("value", customer.value || "");
      }
    } else {
      // Limpar campos quando selecionar "Manual"
      form.setValue("customerName", "");
      form.setValue("customerEmail", "");
      form.setValue("customerPhone", "");
      form.setValue("customerDocument", "");
      form.setValue("description", "");
      form.setValue("value", "");
    }
  };

  const onCreatePayment = (data: PaymentForm) => {
    console.log("Criando cobrança com dados:", data);

    // Validar dados antes de enviar
    if (!data.value || !data.dueDate || !data.description || !data.customerName || !data.customerEmail) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Garantir que os campos opcionais tenham valores padrão
    const paymentData = {
      ...data,
      customerPhone: data.customerPhone || "",
      customerDocument: data.customerDocument || "000.000.000-00"
    };

    createPaymentMutation.mutate(paymentData);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || payment.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2 className="travel-title flex items-center">
            <WalletIcon className="h-6 w-6 mr-2" />
            Carteira
          </h2>
          <p className="travel-subtitle">Gerencie pagamentos e transações</p>
        </div>
        <div className="page-header-actions">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="travel-btn">
                <Plus className="h-4 w-4 mr-2" />
                Criar Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-4 border-white shadow-2xl text-black overflow-y-auto max-h-[90vh]" aria-describedby="create-payment-description">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-black mb-4">Criar Nova Cobrança</DialogTitle>
                <div id="create-payment-description" className="text-sm text-gray-600">
                  Preencha os dados para gerar uma cobrança no Asaas
                </div>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreatePayment)} className="space-y-4 text-black">
                  {/* Seletor de Cliente Cadastrado */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-black font-medium mb-2 block">Selecionar Cliente Cadastrado</label>
                    <Select onValueChange={handleCustomerSelect} value={selectedCustomer}>
                      <SelectTrigger className="bg-white text-black border-gray-300">
                        <SelectValue placeholder="Escolha um cliente cadastrado ou preencha manualmente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">🖊️ Preencher manualmente</SelectItem>
                        {(customers as any[])?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            <div className="flex items-center">
                              <span className="font-medium">{customer.name}</span>
                              <span className="ml-2 text-sm text-gray-500">
                                ({customer.status === "limpa_nome" ? "Limpa Nome" :
                                  customer.status === "bacen" ? "Bacen" :
                                  customer.status === "consultoria" ? "Consultoria" : customer.status})
                              </span>
                              {customer.value && (
                                <span className="ml-2 text-sm text-green-600 font-medium">
                                  R$ {parseFloat(customer.value).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomer && selectedCustomer !== "manual" && (
                      <p className="text-sm text-blue-600 mt-2">
                        ✅ Dados do cliente preenchidos automaticamente
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="billingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Tipo de Pagamento</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PIX">PIX</SelectItem>
                              <SelectItem value="BOLETO">Boleto</SelectItem>
                              <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                              <SelectItem value="UNDEFINED">Não definido</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-medium">Valor</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              className="bg-white text-black border-gray-300"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-medium">Vencimento</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              className="bg-white text-black border-gray-300"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição da cobrança..." 
                            className="bg-white text-black border-gray-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Nome do Cliente</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo..." 
                            className="bg-white text-black border-gray-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="email@exemplo.com" 
                              className="bg-white text-black border-gray-300"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                      />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black font-medium">Telefone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              className="bg-white text-black border-gray-300"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">CPF *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123.456.789-01" 
                            className="bg-white text-black border-gray-300"
                            {...field}
                            onChange={(e) => {
                              // Máscara de CPF
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 11) {
                                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                                field.onChange(value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Área de botões com fundo fixo */}
                  <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200 bg-white sticky bottom-0 z-10 mt-8">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateDialog(false);
                        setSelectedCustomer("");
                        form.reset();
                      }}
                      className="text-black bg-white border-2 border-gray-300 hover:bg-gray-50 px-6 py-2"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPaymentMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold"
                    >
                      {createPaymentMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Criando...
                        </div>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Cobrança
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="travel-container">
        {/* Estatísticas da Carteira */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="travel-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(walletStats.paidValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{walletStats.paid} pagamentos</p>
                </div>
                <TrendingUp className="text-green-600 h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="travel-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">A Receber</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(walletStats.pendingValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{walletStats.pending} pendentes</p>
                </div>
                <Clock className="text-blue-600 h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="travel-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Vencidos</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{walletStats.overdue}</p>
                  <p className="text-sm text-gray-500 mt-1">cobranças</p>
                </div>
                <XCircle className="text-red-600 h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="travel-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Geral</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(walletStats.totalValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{walletStats.total} cobranças</p>
                </div>
                <WalletIcon className="text-gray-600 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="travel-card mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="travel-label">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cliente ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="travel-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="travel-label">Status</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="travel-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="RECEIVED">Pago</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="travel-btn-outline w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Filtrar por Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pagamentos */}
        <Card className="travel-card">
          <CardHeader>
            <CardTitle className="travel-card-title">Cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma cobrança encontrada</h3>
                <p className="text-gray-500 mb-6">Comece criando sua primeira cobrança</p>
                <Button onClick={() => setShowCreateDialog(true)} className="travel-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Cobrança
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getBillingTypeIcon(payment.billingType)}
                          <h4 className="font-semibold text-gray-900">{payment.customerName}</h4>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-gray-600 mt-1">{payment.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Valor: {formatCurrency(payment.value)}</span>
                          <span>Vencimento: {format(new Date(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          <span>Criado: {format(new Date(payment.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (payment.invoiceUrl) {
                              copyToClipboard(payment.invoiceUrl);
                              toast({
                                title: "Link copiado!",
                                description: "Link de pagamento copiado para área de transferência",
                              });
                            }
                          }}
                          className="travel-btn-outline"
                          title="Copiar link de pagamento"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar Link
                        </Button>


                        {(payment.pixQrCode || payment.invoiceUrl) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (payment.invoiceUrl) {
                                window.open(payment.invoiceUrl, '_blank');
                                toast({
                                  title: "Área de pagamento aberta",
                                  description: "Link para área de pagamento Asaas aberto em nova aba",
                                });
                              }
                            }}
                            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            title="Abrir área de pagamento Asaas"
                          >
                            <FaPix className="h-3 w-3 mr-1" />
                            PIX
                          </Button>
                        )}

                        {payment.customerPhone && payment.invoiceUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const message = `Olá ${payment.customerName}! Sua cobrança está disponível para pagamento.

Descrição: ${payment.description}
Valor: ${formatCurrency(payment.value)}
Link: ${payment.invoiceUrl}

✅ Pagamento via Asaas - Clique no link para pagar`;

                              const whatsappUrl = `https://wa.me/55${(payment.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, '_blank');

                              toast({
                                title: "WhatsApp aberto!",
                                description: "Mensagem preparada para envio",
                              });
                            }}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            title="Enviar via WhatsApp"
                          >
                            <FaWhatsapp className="h-3 w-3" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a cobrança de ${payment.customerName}? Esta ação não pode ser desfeita.`)) {
                              deletePaymentMutation.mutate(Number(payment.id));
                            }
                          }}
                          disabled={deletePaymentMutation.isPending}
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          title="Excluir cobrança"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}