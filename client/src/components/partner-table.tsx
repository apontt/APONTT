import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import { Search, Filter, Edit, Trash2, Link2, Lock, Unlock, Copy } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { Partner } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import PartnerForm from "./partner-form";
import AdminFeeEditor from "./admin-fee-editor";
import PartnerEditModal from "./partner-edit-modal";

export default function PartnerTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState<Partner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  const sendToWhatsAppMutation = useMutation({
    mutationFn: async ({ partner }: { partner: Partner }) => {
      const message = generateWhatsAppMessage(partner);
      const response = await apiRequest("POST", "/api/whatsapp/send", {
        phone: partner.whatsapp,
        message,
        partnerId: partner.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast({
        title: "WhatsApp",
        description: "Abrindo WhatsApp com os dados do parceiro...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar dados para o WhatsApp",
        variant: "destructive",
      });
    },
  });

  const generateDashboardTokenMutation = useMutation({
    mutationFn: async (partnerId: number) => {
      const response = await apiRequest("POST", `/api/partners/${partnerId}/generate-dashboard-token`, {});
      return response.json();
    },
    onSuccess: (data) => {
      // Criar link de login
      const loginLink = `${window.location.origin}/partner-login?email=${encodeURIComponent(data.email)}`;

      // Preparar mensagem do WhatsApp com credenciais
      const whatsappMessage = `🎉 *Credenciais de Acesso Apontt*

Olá ${data.name}! Suas credenciais de acesso ao painel foram geradas:

🔐 *Dados de Login:*
📧 Email: ${data.email}
🔑 Senha: ${data.password}

🌐 *Acesse em:*
${loginLink}

📱 Salve suas credenciais em local seguro e acesse seu painel de parceiro para gerenciar contratos e acompanhar vendas.

Qualquer dúvida, estamos à disposição!

*Equipe Apontt*`;

      // Enviar por WhatsApp se tiver número
      if (data.whatsapp) {
        const whatsappUrl = `https://wa.me/${data.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
      }

      // Mostra o toast com credenciais
      toast({
        title: "✅ Credenciais Geradas e Enviadas!",
        description: `Email: ${data.email} | Senha: ${data.password}\nEnviado via WhatsApp e copiado!`,
        duration: 8000,
      });

      // Copia as credenciais
      navigator.clipboard.writeText(`Email: ${data.email}\nSenha: ${data.password}\nLink: ${loginLink}`);

      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao gerar credenciais do parceiro",
        variant: "destructive",
      });
    },
  });

  const updatePartnerAccessMutation = useMutation({
    mutationFn: async ({ partnerId, enabled }: { partnerId: number; enabled: boolean }) => {
      const response = await apiRequest("PATCH", `/api/partners/${partnerId}/access`, { enabled });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Acesso Atualizado",
        description: `Acesso ${variables.enabled ? 'liberado' : 'bloqueado'} com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar acesso do parceiro",
        variant: "destructive",
      });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Sucesso",
        description: "Parceiro removido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover parceiro",
        variant: "destructive",
      });
    },
  });

  const filteredPartners = partners?.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    const matchesRegion = regionFilter === "all" || partner.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success bg-opacity-10 text-success border-success">Ativo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "pending":
        return <Badge className="bg-warning bg-opacity-10 text-warning border-warning">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando parceiros...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <Card className="mb-6 bg-white border border-gray-300">
        <CardContent className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white text-black border-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white text-black border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-black hover:bg-gray-100">Todos</SelectItem>
                  <SelectItem value="active" className="text-black hover:bg-gray-100">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-black hover:bg-gray-100">Inativo</SelectItem>
                  <SelectItem value="pending" className="text-black hover:bg-gray-100">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Região</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-white text-black border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-black hover:bg-gray-100">Todas</SelectItem>
                  <SelectItem value="sao-paulo" className="text-black hover:bg-gray-100">São Paulo</SelectItem>
                  <SelectItem value="rio-de-janeiro" className="text-black hover:bg-gray-100">Rio de Janeiro</SelectItem>
                  <SelectItem value="minas-gerais" className="text-black hover:bg-gray-100">Minas Gerais</SelectItem>
                  <SelectItem value="outros" className="text-black hover:bg-gray-100">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full bg-white text-black border-gray-300 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card className="bg-white border border-gray-300">
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-black">Parceiro</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Empresa</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Taxa Admin (%)</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Vendas</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Acessos</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Última Atividade</th>
                  <th className="text-right py-4 px-6 font-semibold text-black">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPartners?.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 bg-white">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {partner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-black">{partner.name}</p>
                          <p className="text-sm text-black">{partner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-black">{partner.company || '-'}</p>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(partner.status)}
                    </td>
                    <td className="py-4 px-6">
                      <AdminFeeEditor partner={partner} onUpdate={(updatedPartner) => {
                        queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
                      }} />
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(partner.totalSales || "0")}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {partner.accessCount || 0} acessos
                        </p>
                        <p className="text-gray-500">
                          {partner.lastAccess ? new Date(partner.lastAccess).toLocaleDateString('pt-BR') + ' ' + new Date(partner.lastAccess).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-900">
                        {partner.lastActivity && formatDistanceToNow(new Date(partner.lastActivity), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center space-x-2">
                          {/* Botão WhatsApp sempre visível */}
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => sendToWhatsAppMutation.mutate({ partner })}
                            disabled={sendToWhatsAppMutation.isPending}
                            title="Enviar WhatsApp"
                          >
                            <FaWhatsapp className="h-4 w-4" />
                          </Button>

                          {/* Botão para liberar/bloquear acesso */}
                          <Button
                            size="sm"
                            className={partner.accessEnabled ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                            onClick={() => updatePartnerAccessMutation.mutate({ 
                              partnerId: partner.id, 
                              enabled: !partner.accessEnabled 
                            })}
                            disabled={updatePartnerAccessMutation.isPending}
                            title={partner.accessEnabled ? "Bloquear Acesso" : "Liberar Acesso"}
                          >
                            {partner.accessEnabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>

                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setSelectedPartnerForEdit(partner);
                              setShowEditModal(true);
                            }}
                            title="Editar Dados do Parceiro"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deletePartnerMutation.mutate(partner.id)}
                            disabled={deletePartnerMutation.isPending}
                            title="Excluir Parceiro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {/* Botão para gerar credenciais e enviar por WhatsApp */}
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => generateDashboardTokenMutation.mutate(partner.id)}
                            disabled={generateDashboardTokenMutation.isPending}
                            title="Gerar e Enviar Credenciais"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>

                          {/* Botão para copiar link de acesso (somente se tiver token) */}
                          {partner.dashboardToken && (
                            <Button
                              size="sm"
                              className="bg-gray-600 hover:bg-gray-700 text-white"
                              onClick={() => {
                                const url = `${window.location.origin}/partner-login?token=${partner.dashboardToken}`;
                                navigator.clipboard.writeText(url);
                                toast({
                                  title: "Link copiado!",
                                  description: "Link de acesso do parceiro copiado para a área de transferência",
                                });
                              }}
                              title="Copiar Link de Acesso"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!filteredPartners || filteredPartners.length === 0) && (
              <div className="p-6 text-center text-gray-500">
                Nenhum parceiro encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <PartnerForm 
        open={showEditForm} 
        onOpenChange={(open) => {
          setShowEditForm(open);
          if (!open) {
            setEditingPartner(null);
          }
        }}
        editingPartner={editingPartner}
      />

      {/* Modal de edição completa do parceiro */}
      {selectedPartnerForEdit && (
        <PartnerEditModal
          partner={selectedPartnerForEdit}
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) setSelectedPartnerForEdit(null);
          }}
        />
      )}
    </>
  );
}