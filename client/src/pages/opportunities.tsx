import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Opportunity } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Opportunities() {
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities'],
  });

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "closed-won":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Fechado - Ganho</Badge>;
      case "closed-lost":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Fechado - Perdido</Badge>;
      case "negotiation":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Negociação</Badge>;
      case "proposal":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Proposta</Badge>;
      case "qualified":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Qualificado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Prospecção</Badge>;
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const opportunityStats = opportunities ? {
    prospecting: opportunities.filter(o => o.stage === "prospecting").length,
    qualified: opportunities.filter(o => o.stage === "qualified").length,
    proposal: opportunities.filter(o => o.stage === "proposal").length,
    negotiation: opportunities.filter(o => o.stage === "negotiation").length,
    won: opportunities.filter(o => o.stage === "closed-won").length,
    lost: opportunities.filter(o => o.stage === "closed-lost").length,
    total: opportunities.length,
    totalValue: opportunities.reduce((sum, o) => sum + parseFloat(o.value), 0),
  } : { 
    prospecting: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0, 
    total: 0, totalValue: 0 
  };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="travel-title">Oportunidades</h2>
            <p className="travel-subtitle">Gerencie suas oportunidades de vendas</p>
          </div>
          <Button 
            className="travel-btn bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              // Scroll suave para a seção de oportunidades
              setTimeout(() => {
                const opportunitiesSection = document.querySelector('.travel-container');
                if (opportunitiesSection) {
                  opportunitiesSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                  });
                }
              }, 100);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="travel-container">
        {/* Opportunity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-medium">Prospecção</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{opportunityStats.prospecting}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-medium">Qualificado</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{opportunityStats.qualified}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-medium">Proposta</p>
                <p className="text-xl font-bold text-purple-600 mt-1">{opportunityStats.proposal}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-medium">Negociação</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">{opportunityStats.negotiation}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-medium">Fechado</p>
                <p className="text-xl font-bold text-green-600 mt-1">{opportunityStats.won}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs font-medium">Valor Total</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {formatCurrency(opportunityStats.totalValue.toString())}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="travel-card mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="travel-label">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Título ou descrição..." className="travel-input pl-10" />
                </div>
              </div>
              <div>
                <label className="travel-label">Estágio</label>
                <Select defaultValue="all">
                  <SelectTrigger className="travel-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="prospecting">Prospecção</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="proposal">Proposta</SelectItem>
                    <SelectItem value="negotiation">Negociação</SelectItem>
                    <SelectItem value="closed-won">Fechado - Ganho</SelectItem>
                    <SelectItem value="closed-lost">Fechado - Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="travel-label">Probabilidade</label>
                <Select defaultValue="all">
                  <SelectTrigger className="travel-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta (70%+)</SelectItem>
                    <SelectItem value="medium">Média (30-70%)</SelectItem>
                    <SelectItem value="low">Baixa (0-30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="travel-btn-outline w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities List */}
        <Card className="travel-card">
          <CardHeader>
            <CardTitle className="travel-card-title">Lista de Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !opportunities || opportunities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma oportunidade encontrada</h3>
                <p className="text-gray-500 mb-6">Comece criando sua primeira oportunidade de vendas</p>
                <Button className="travel-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Oportunidade
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                          {getStageBadge(opportunity.stage)}
                        </div>
                        <p className="text-gray-600 mt-1">{opportunity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Valor: {formatCurrency(opportunity.value)}</span>
                          <span>Probabilidade: {opportunity.probability}%</span>
                          <span>Criado: {format(new Date(opportunity.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={opportunity.probability} className="w-24" />
                        <Button variant="outline" size="sm" className="travel-btn-outline">
                          Ver Detalhes
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