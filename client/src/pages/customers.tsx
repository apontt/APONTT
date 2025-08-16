import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerForm from "@/components/customer-form";
import { Plus, User, Users, Building, CheckCircle, Search, Filter, Edit, Eye, FileText, Trash2, DollarSign } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AponttLogo } from "@/components/logo";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente removido",
        description: "Cliente removido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover cliente",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "customer":
        return <Badge className="bg-green-500 text-white">Cliente</Badge>;
      case "qualified":
        return <Badge className="bg-blue-500 text-white">Qualificado</Badge>;
      case "lead":
        return <Badge className="bg-gray-500 text-white">Lead</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWhatsAppMessage = (customer: Customer) => {
    return `Olá ${customer.name}! Somos da Apontt e gostaríamos de falar sobre nossos serviços. Podemos conversar?`;
  };

  const openWhatsApp = (customer: Customer) => {
    const message = getWhatsAppMessage(customer);
    const phone = customer.phone?.replace(/\D/g, '') || '';
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Função para gerar cobrança automaticamente para um cliente
  const generatePaymentForCustomer = async (customer: Customer) => {
    try {
      // Preparar dados da cobrança baseados no cliente
      const serviceDescription = customer.status === "limpa_nome" ? "Serviços de Limpa Nome" :
                               customer.status === "bacen" ? "Serviços Bacen" :
                               customer.status === "consultoria" ? "Serviços de Consultoria" :
                               "Serviços Apontt";
      
      const paymentData = {
        billingType: "UNDEFINED",
        value: customer.value || "100.00",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: serviceDescription,
        customerName: customer.name,
        customerEmail: customer.email || "cliente@exemplo.com",
        customerPhone: customer.phone || "",
        customerDocument: customer.document || "000.000.000-00",
      };

      console.log("Enviando dados para cobrança:", paymentData);

      // Criar cobrança via API
      const response = await apiRequest("POST", "/api/payments/asaas", paymentData);
      const result = await response.json();

      if (result.success || result.invoiceUrl) {
        const invoiceLink = result.invoiceUrl || result.payment?.invoiceUrl;
        
        if (invoiceLink) {
          toast({
            title: "Cobrança Criada com Sucesso!",
            description: `Cobrança gerada para ${customer.name}. Link copiado para área de transferência.`,
          });

          // Copiar link para área de transferência
          navigator.clipboard.writeText(invoiceLink);

          // Invalidar cache para atualizar a carteira
          queryClient.invalidateQueries({ queryKey: ["/api/wallet/payments"] });
        } else {
          throw new Error("Link de cobrança não encontrado");
        }
      } else {
        throw new Error(result.message || "Erro ao gerar cobrança");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Gerar Cobrança",
        description: error.message || "Não foi possível criar a cobrança. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const customerStats = customers ? {
    lead: customers.filter(c => c.status === "lead").length,
    qualified: customers.filter(c => c.status === "qualified").length,
    customer: customers.filter(c => c.status === "customer").length,
    total: customers.length,
  } : { lead: 0, qualified: 0, customer: 0, total: 0 };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AponttLogo width={160} height={50} />
            <div>
              <h2 className="travel-title">Clientes</h2>
              <p className="travel-subtitle">Gerencie seus clientes e leads</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="travel-btn bg-blue-600 text-white hover:bg-blue-700">
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
                  <p className="travel-value text-lg">{customerStats.lead}</p>
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
                  <p className="travel-value text-lg">{customerStats.qualified}</p>
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
                  <p className="travel-value text-lg">{customerStats.customer}</p>
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
                      <th className="text-left py-4 px-6 font-semibold travel-high-contrast">Parceiro</th>
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
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-purple-600">
                                A
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Admin
                              </p>
                              <p className="text-xs text-gray-500">
                                Sistema
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-900">{customer.phone || 'Não informado'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {/* Botão WhatsApp */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openWhatsApp(customer)}
                              className="travel-btn text-xs px-2 py-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              title="WhatsApp"
                            >
                              <FaWhatsapp className="h-3 w-3" />
                            </Button>

                            {/* Botão de gerar cobrança */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generatePaymentForCustomer(customer)}
                              className="travel-btn text-xs px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              title="Gerar Cobrança"
                            >
                              <DollarSign className="h-3 w-3" />
                            </Button>
                            
                            {/* Botão excluir */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir o cliente ${customer.name}? Esta ação não pode ser desfeita.`)) {
                                  deleteCustomerMutation.mutate(customer.id);
                                }
                              }}
                              disabled={deleteCustomerMutation.isPending}
                              className="text-xs px-2 py-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              title="Excluir Cliente"
                            >
                              {deleteCustomerMutation.isPending ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
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

        {/* Customer Form Modal */}
        <CustomerForm 
          open={showForm} 
          onOpenChange={(open) => {
            setShowForm(open);
            // Scroll suave para a lista após fechar o modal
            if (!open) {
              setTimeout(() => {
                const customersList = document.querySelector('.travel-grid');
                if (customersList) {
                  customersList.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                  });
                }
              }, 300);
            }
          }} 
        />
      </div>
    </div>
  );
}