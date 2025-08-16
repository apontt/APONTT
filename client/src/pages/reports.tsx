import { useQuery } from "@tanstack/react-query";
import { Calendar, Download, TrendingUp, BarChart3, PieChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import type { Partner, Contract, Customer, Opportunity } from "@shared/schema";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";


export default function Reports() {
  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities'],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const isLoading = partnersLoading || contractsLoading || customersLoading || opportunitiesLoading || metricsLoading;

  // Generate monthly sales data for the last 12 months
  const generateMonthlySalesData = () => {
    if (!contracts) return [];

    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthContracts = contracts.filter(contract => {
        if (!contract.signedAt || contract.status !== 'signed') return false;
        const signedDate = new Date(contract.signedAt);
        return signedDate >= monthStart && signedDate <= monthEnd;
      });

      const totalSales = monthContracts.reduce((sum, contract) => sum + parseFloat(contract.value), 0);

      monthlyData.push({
        month: format(date, 'MMM', { locale: ptBR }),
        sales: totalSales,
        contracts: monthContracts.length,
      });
    }

    return monthlyData;
  };

  // Generate partner performance data
  const generatePartnerPerformanceData = () => {
    if (!partners || !contracts) return [];

    return partners.map(partner => {
      const partnerContracts = contracts.filter(c => c.partnerId === partner.id);
      const totalValue = partnerContracts.reduce((sum, c) => sum + parseFloat(c.value), 0);
      const signedContracts = partnerContracts.filter(c => c.status === 'signed');
      const signedValue = signedContracts.reduce((sum, c) => sum + parseFloat(c.value), 0);

      return {
        name: partner.name,
        contracts: partnerContracts.length,
        signedContracts: signedContracts.length,
        totalValue,
        signedValue,
        conversionRate: partnerContracts.length > 0 ? (signedContracts.length / partnerContracts.length) * 100 : 0,
      };
    }).sort((a, b) => b.signedValue - a.signedValue);
  };

  // Generate status distribution data
  const generateStatusDistribution = () => {
    if (!contracts) return [];

    const statusCount = contracts.reduce((acc: any, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {});

    const colors = {
      pending: '#3B82F6',
      signed: '#10B981',
      draft: '#F59E0B',
      expired: '#EF4444',
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status === 'pending' ? 'Pendente' :
            status === 'signed' ? 'Assinado' :
            status === 'draft' ? 'Rascunho' : 'Expirado',
      value: count,
      color: colors[status as keyof typeof colors] || '#6B7280',
    }));
  };

  const monthlySalesData = generateMonthlySalesData();
  const partnerPerformanceData = generatePartnerPerformanceData();
  const statusDistribution = generateStatusDistribution();

  const totalSignedValue = contracts ? contracts
    .filter(c => c.status === 'signed')
    .reduce((sum, c) => sum + parseFloat(c.value), 0) : 0;

  const totalPendingValue = contracts ? contracts
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + parseFloat(c.value), 0) : 0;

  const conversionRate = contracts ? 
    (contracts.filter(c => c.status === 'signed').length / contracts.length) * 100 : 0;

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2 className="travel-title flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Relatórios
          </h2>
          <p className="travel-subtitle">Analytics e relatórios detalhados</p>
        </div>
        <div className="page-header-actions">

          <Select defaultValue="last30">
            <SelectTrigger className="w-full sm:w-40 travel-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Últimos 7 dias</SelectItem>
              <SelectItem value="last30">Últimos 30 dias</SelectItem>
              <SelectItem value="last90">Últimos 90 dias</SelectItem>
              <SelectItem value="last365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button className="btn-mobile bg-blue-600 text-white hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="travel-container">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="travel-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Vendas Assinadas</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {formatCurrency(totalSignedValue)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {contracts?.filter(c => c.status === 'signed').length || 0} contratos
                      </p>
                    </div>
                    <TrendingUp className="text-green-600 h-8 w-8" />
                  </div>
                </CardContent>
              </Card>

              <Card className="travel-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Pipeline</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {formatCurrency(totalPendingValue)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {contracts?.filter(c => c.status === 'pending').length || 0} pendentes
                      </p>
                    </div>
                    <FileText className="text-blue-600 h-8 w-8" />
                  </div>
                </CardContent>
              </Card>

              <Card className="travel-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Taxa de Conversão</p>
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        {conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 mt-1">contratos fechados</p>
                    </div>
                    <TrendingUp className="text-purple-600 h-8 w-8" />
                  </div>
                </CardContent>
              </Card>

              <Card className="travel-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Parceiros Ativos</p>
                      <p className="text-2xl font-bold text-orange-600 mt-2">
                        {partners?.filter(p => p.status === 'active').length || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">em atividade</p>
                    </div>
                    <Calendar className="text-orange-600 h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Vendas Mensais */}
            <Card className="travel-card mb-8">
              <CardHeader>
                <CardTitle className="travel-card-title">Vendas Mensais (Últimos 12 Meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Vendas']} />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Performance dos Parceiros */}
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle className="travel-card-title">Performance dos Parceiros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={partnerPerformanceData.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Vendas']} />
                        <Bar dataKey="signedValue" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição de Status */}
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle className="travel-card-title">Status dos Contratos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Parceiros */}
            <Card className="travel-card">
              <CardHeader>
                <CardTitle className="travel-card-title">Ranking de Parceiros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnerPerformanceData.slice(0, 10).map((partner, index) => (
                    <div key={partner.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                          <p className="text-sm text-gray-500">
                            {partner.signedContracts} de {partner.contracts} contratos fechados
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(partner.signedValue)}</p>
                        <Badge 
                          className={`${
                            partner.conversionRate >= 70 ? 'bg-green-100 text-green-800' :
                            partner.conversionRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {partner.conversionRate.toFixed(1)}% conversão
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}