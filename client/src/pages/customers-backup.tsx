import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerForm from "@/components/customer-form";
import { Plus, Mail, Phone, Building, User, Users, FileText, CheckCircle, Clock, Search, Filter, Edit, Eye, Edit2, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, Contract } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

const contractSchema = z.object({
  type: z.string().min(1, "Tipo de contrato é obrigatório"),
  value: z.string().min(1, "Valor é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  terms: z.string().optional(),
});

type ContractForm = z.infer<typeof contractSchema>;

interface ContractDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContractViewDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ContractViewDialog({ customer, open, onOpenChange }: ContractViewDialogProps) {
  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
  });

  const customerContracts = contracts?.filter(contract => contract.clientEmail === customer.email) || [];

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge className="bg-green-500 text-white">Assinado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pendente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 text-white">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-400 text-white">Rascunho</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contratos de {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {customerContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum contrato encontrado para este cliente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerContracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.type}</h3>
                        <p className="text-gray-600 mt-1">{contract.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(contract.status)}
                        <span className="font-bold text-lg">{formatCurrency(contract.value)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>ID:</strong> #{contract.id}</p>
                        <p><strong>Criado em:</strong> {contract.createdAt && format(new Date(contract.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                      <div>
                        {contract.signedAt && (
                          <p><strong>Assinado em:</strong> {format(new Date(contract.signedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                        )}
                        {contract.linkToken && (
                          <p><strong>Link:</strong> <a href={`/sign/${contract.linkToken}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver contrato</a></p>
                        )}
                      </div>
                    </div>

                    {contract.terms && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm"><strong>Termos:</strong></p>
                        <p className="text-sm text-gray-600 mt-1">{contract.terms}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContractDialog({ customer, open, onOpenChange }: ContractDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      type: "",
      value: "",
      description: "",
      terms: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractForm) => {
      const contractData = {
        ...data,
        clientName: customer.name,
        clientEmail: customer.email,
        clientPhone: customer.phone || "",
      };
      const response = await apiRequest("POST", "/api/contracts", contractData);
      return response.json();
    },
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });

      toast({
        title: "Contrato criado",
        description: "Contrato criado com sucesso!",
      });

      // Enviar automaticamente via WhatsApp
      sendContractMutation.mutate({
        contractId: contract.id,
        recipient: customer.phone || customer.email,
      });

      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar contrato",
        variant: "destructive",
      });
    },
  });

  const sendContractMutation = useMutation({
    mutationFn: async ({ contractId, recipient }: { contractId: number; recipient: string }) => {
      const response = await apiRequest("POST", "/api/contracts/send", {
        contractId,
        type: 'whatsapp',
        recipient,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contrato enviado",
        description: "Contrato enviado via WhatsApp com sucesso!",
      });

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar contrato",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractForm) => {
    createContractMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Contrato para {customer.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Consultoria">Consultoria</SelectItem>
                        <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="Suporte">Suporte</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Treinamento">Treinamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1500.00" {...field} />
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
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição dos serviços" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Termos e Condições</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Termos específicos do contrato" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createContractMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createContractMutation.isPending ? "Criando..." : (
                  <>
                    <FaWhatsapp className="h-4 w-4 mr-2" />
                    Criar e Enviar via WhatsApp
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomerForContract, setSelectedCustomerForContract] = useState<Customer | null>(null);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<Customer | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
  });

  // Mutation para excluir cliente
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest("DELETE", `/api/customers/${customerId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir cliente",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "consultoria":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Consultoria</Badge>;
      case "bacen":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Bacen</Badge>;
      case "limpa_nome":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Limpa Nome</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{status}</Badge>;
    }
  };

  const getCustomerContracts = (customerEmail: string) => {
    return contracts?.filter(contract => contract.clientEmail === customerEmail) || [];
  };

  const getContractStatusBadge = (customerEmail: string) => {
    const customerContracts = getCustomerContracts(customerEmail);

    if (customerContracts.length === 0) {
      return null;
    }

    const signedContracts = customerContracts.filter(c => c.status === "signed");
    const pendingContracts = customerContracts.filter(c => c.status === "pending");

    if (signedContracts.length > 0) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 ml-2">
          <CheckCircle className="h-3 w-3 mr-1" />
          {signedContracts.length} Assinado{signedContracts.length > 1 ? 's' : ''}
        </Badge>
      );
    }

    if (pendingContracts.length > 0) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-300 ml-2">
          <Clock className="h-3 w-3 mr-1" />
          {pendingContracts.length} Pendente{pendingContracts.length > 1 ? 's' : ''}
        </Badge>
      );
    }

    return null;
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const customerStats = customers ? {
    limpa_nome: customers.filter(c => c.status === "limpa_nome").length,
    bacen: customers.filter(c => c.status === "bacen").length,
    consultoria: customers.filter(c => c.status === "consultoria").length,
    total: customers.length,
  } : { limpa_nome: 0, bacen: 0, consultoria: 0, total: 0 };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="travel-title">Clientes</h2>
            <p className="travel-subtitle">Gerencie seus clientes e leads</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="travel-btn">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="travel-container">
        {/* Statistics */}
        <div className="travel-grid mb-6">
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="travel-label">Total de Clientes</p>
                  <p className="travel-value text-lg">{customerStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="travel-label">Leads</p>
                  <p className="travel-value text-lg">{customerStats.limpa_nome}</p>
                </div>
                <User className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="travel-label">Qualificados</p>
                  <p className="travel-value text-lg">{customerStats.bacen}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="travel-label">Clientes</p>
                  <p className="travel-value text-lg">{customerStats.consultoria}</p>
                </div>
                <Building className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="travel-card mb-6">
          <CardHeader>
            <CardTitle className="travel-high-contrast">Filtros de Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="travel-label block mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="travel-label block mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full travel-btn">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="travel-card">
          <CardHeader>
            <CardTitle className="travel-high-contrast">Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold travel-high-contrast">Cliente</th>
                      <th className="text-left py-4 px-6 font-semibold travel-high-contrast">Status</th>
                      <th className="text-left py-4 px-6 font-semibold travel-high-contrast">Telefone</th>
                      <th className="text-left py-4 px-6 font-semibold travel-high-contrast">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-sm text-gray-500">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(customer.status)}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-900">{customer.phone}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openWhatsApp(customer)}
                              className="travel-btn text-xs px-2 py-1"
                            >
                              <FaWhatsapp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateContract(customer)}
                              className="travel-btn text-xs px-2 py-1"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewContracts(customer)}
                              className="travel-btn text-xs px-2 py-1"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
            <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
            <p className="text-gray-600 mt-1">Gerencie seus leads e clientes</p>
          </div>
          <Button onClick={() => setShowCustomerForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm font-medium">Limpa Nome</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{customerStats.limpa_nome}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm font-medium">Bacen</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{customerStats.bacen}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm font-medium">Consultoria</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{customerStats.consultoria}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{customerStats.total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Nome ou empresa..." className="pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Cliente</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Empresa</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Valor</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Cadastro</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers?.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-900">{customer.company || '-'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(customer.status)}
                            {getContractStatusBadge(customer.email)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(customer.value || "0")}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-900">
                            {customer.createdAt && format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600"
                              onClick={() => setSelectedCustomerForEdit(customer)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-600"
                              onClick={() => setSelectedCustomerForContract(customer)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Novo Contrato
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-gray-50 hover:bg-gray-100 text-gray-600"
                              onClick={() => setSelectedCustomerForView(customer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Contratos
                            </Button>
                            
                            {/* Botão Excluir - Apenas para Admin */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-red-50 hover:bg-red-100 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o cliente "{customer.name}"? 
                                    Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCustomerMutation.mutate(customer.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deleteCustomerMutation.isPending}
                                  >
                                    {deleteCustomerMutation.isPending ? "Excluindo..." : "Excluir Cliente"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(!customers || customers.length === 0) && (
                  <div className="p-6 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Form Modal */}
      <CustomerForm 
        open={showCustomerForm} 
        onOpenChange={setShowCustomerForm} 
      />

      {/* Edit Customer Modal */}
      {selectedCustomerForEdit && (
        <CustomerForm 
          open={!!selectedCustomerForEdit}
          onOpenChange={(open) => !open && setSelectedCustomerForEdit(null)}
          customer={selectedCustomerForEdit}
        />
      )}

      {/* New Contract Modal */}
      {selectedCustomerForContract && (
        <ContractDialog
          customer={selectedCustomerForContract}
          open={!!selectedCustomerForContract}
          onOpenChange={(open) => !open && setSelectedCustomerForContract(null)}
        />
      )}

      {/* View Contracts Modal */}
      {selectedCustomerForView && (
        <ContractViewDialog
          customer={selectedCustomerForView}
          open={!!selectedCustomerForView}
          onOpenChange={(open) => !open && setSelectedCustomerForView(null)}
        />
      )}
    </>
  );
}