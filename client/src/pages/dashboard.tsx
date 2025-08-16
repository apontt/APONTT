import { useQuery } from "@tanstack/react-query";
import { Calendar, Download, FileText, Table, Users, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AponttLogo } from "@/components/logo";
import MetricsCards from "@/components/metrics-cards";
import SalesChart from "@/components/sales-chart";
import RecentActivities from "@/components/recent-activities";
import NextActions from "@/components/next-actions";

export default function Dashboard() {
  const { toast } = useToast();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/metrics'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['/api/contracts'],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['/api/partners'],
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/opportunities'],
  });

  const defaultMetrics = {
    monthSales: 0,
    newLeads: 0,
    conversionRate: 0,
    activePartners: 0,
    salesGrowth: 0,
    leadsGrowth: 0,
    conversionGrowth: 0,
    partnersGrowth: 0,
  };

  // Ensure metrics has all required properties
  const normalizedMetrics = metrics && typeof metrics === 'object' && 'monthSales' in metrics 
    ? metrics as typeof defaultMetrics 
    : defaultMetrics;

  const exportToPDF = () => {
    try {
      const reportData = {
        date: new Date().toLocaleDateString('pt-BR'),
        metrics: normalizedMetrics,
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        totalContracts: Array.isArray(contracts) ? contracts.length : 0,
        totalPartners: Array.isArray(partners) ? partners.length : 0,
        totalOpportunities: Array.isArray(opportunities) ? opportunities.length : 0,
      };

      // Criar conteúdo HTML para impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Relatório Dashboard - Apontt</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                .metric-title { font-weight: bold; color: #555; font-size: 14px; }
                .metric-value { font-size: 24px; font-weight: bold; color: #333; margin: 5px 0; }
                .summary { margin-top: 30px; }
                .summary h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Relatório Dashboard - Apontt</h1>
                <p>Gerado em: ${reportData.date}</p>
              </div>
              
              <div class="metrics">
                <div class="metric-card">
                  <div class="metric-title">Vendas do Mês</div>
                  <div class="metric-value">R$ ${((reportData.metrics as any)?.monthSales || 0).toLocaleString('pt-BR')}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-title">Novos Leads</div>
                  <div class="metric-value">${(reportData.metrics as any)?.newLeads || 0}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-title">Taxa de Conversão</div>
                  <div class="metric-value">${(reportData.metrics as any)?.conversionRate || 0}%</div>
                </div>
                <div class="metric-card">
                  <div class="metric-title">Parceiros Ativos</div>
                  <div class="metric-value">${(reportData.metrics as any)?.activePartners || 0}</div>
                </div>
              </div>

              <div class="summary">
                <h3>Resumo Geral</h3>
                <p><strong>Total de Clientes:</strong> ${reportData.totalCustomers}</p>
                <p><strong>Total de Contratos:</strong> ${reportData.totalContracts}</p>
                <p><strong>Total de Parceiros:</strong> ${reportData.totalPartners}</p>
                <p><strong>Total de Oportunidades:</strong> ${reportData.totalOpportunities}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "PDF gerado",
        description: "Relatório PDF foi aberto em nova janela para impressão",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório PDF",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    try {
      const reportData = {
        metrics: metrics || defaultMetrics,
        customers: customers,
        contracts: contracts,
        partners: partners,
        opportunities: opportunities,
      };

      // Criar dados CSV
      const csvData = [
        ['Relatório Dashboard Apontt - ' + new Date().toLocaleDateString('pt-BR')],
        [''],
        ['MÉTRICAS PRINCIPAIS'],
        ['Vendas do Mês', `R$ ${((reportData.metrics as any)?.monthSales || 0).toLocaleString('pt-BR')}`],
        ['Novos Leads', (reportData.metrics as any)?.newLeads || 0],
        ['Taxa de Conversão', `${(reportData.metrics as any)?.conversionRate || 0}%`],
        ['Parceiros Ativos', (reportData.metrics as any)?.activePartners || 0],
        [''],
        ['RESUMO GERAL'],
        ['Total de Clientes', Array.isArray(customers) ? customers.length : 0],
        ['Total de Contratos', Array.isArray(contracts) ? contracts.length : 0],
        ['Total de Parceiros', Array.isArray(partners) ? partners.length : 0],
        ['Total de Oportunidades', Array.isArray(opportunities) ? opportunities.length : 0],
        [''],
        ['CLIENTES'],
        ['Nome', 'Email', 'Status', 'Categoria'],
        ...(Array.isArray(customers) ? customers.map((customer: any) => [
          customer.name || 'N/A',
          customer.email || 'N/A', 
          customer.status || 'N/A',
          customer.category || 'N/A'
        ]) : [])
      ];

      // Converter para CSV
      const csvContent = csvData.map(row => 
        row.map((cell: any) => `"${cell}"`).join(',')
      ).join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Excel gerado",
        description: "Arquivo CSV foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar planilha Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <AponttLogo width={160} height={50} />
            <div>
              <h2 className="travel-title">Dashboard</h2>
              <p className="travel-subtitle">Acompanhe suas vendas e métricas em tempo real</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select defaultValue="30days">
                <SelectTrigger className="border-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="thismonth">Este mês</SelectItem>
                  <SelectItem value="lastmonth">Mês anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="travel-btn">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <Table className="h-4 w-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="travel-container">
        {isLoading ? (
          <div className="travel-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="travel-card h-32 animate-pulse bg-gradient-to-r from-blue-200 to-blue-300"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Layout */}
            <div className="desktop-content space-y-8">
              <MetricsCards metrics={normalizedMetrics} />
              <SalesChart />
              <div className="travel-grid">
                <RecentActivities />
                <NextActions />
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="mobile-layout">
              {/* Mobile Metrics */}
              <div className="mobile-metrics">
                <div className="mobile-metric-card">
                  <div className="mobile-metric-value">R$ {normalizedMetrics.monthSales.toLocaleString('pt-BR')}</div>
                  <div className="mobile-metric-label">Vendas do Mês</div>
                </div>
                <div className="mobile-metric-card">
                  <div className="mobile-metric-value">{normalizedMetrics.newLeads}</div>
                  <div className="mobile-metric-label">Novos Leads</div>
                </div>
                <div className="mobile-metric-card">
                  <div className="mobile-metric-value">{normalizedMetrics.conversionRate}%</div>
                  <div className="mobile-metric-label">Taxa Conversão</div>
                </div>
                <div className="mobile-metric-card">
                  <div className="mobile-metric-value">{normalizedMetrics.activePartners}</div>
                  <div className="mobile-metric-label">Parceiros Ativos</div>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="mobile-action-grid">
                <div className="mobile-action-btn">
                  <div className="mobile-action-icon bg-blue-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="mobile-action-text">Parceiros</div>
                </div>
                <div className="mobile-action-btn">
                  <div className="mobile-action-icon bg-purple-500">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="mobile-action-text">Oportunidades</div>
                </div>
                <div className="mobile-action-btn">
                  <div className="mobile-action-icon bg-orange-500">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="mobile-action-text">Carteira</div>
                </div>
                <div className="mobile-action-btn">
                  <div className="mobile-action-icon bg-green-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="mobile-action-text">Contratos</div>
                </div>
              </div>

              {/* Mobile Recent Transactions */}
              <div className="mobile-transaction-list">
                <div className="mobile-transaction-header">Atividades Recentes</div>
                <div className="mobile-transaction-item">
                  <div className="mobile-transaction-icon">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="mobile-transaction-content">
                    <div className="mobile-transaction-title">Novo contrato criado</div>
                    <div className="mobile-transaction-subtitle">LUCAS SOARES - há 2 horas</div>
                  </div>
                  <div className="mobile-transaction-value">R$ 300</div>
                </div>
                <div className="mobile-transaction-item">
                  <div className="mobile-transaction-icon">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="mobile-transaction-content">
                    <div className="mobile-transaction-title">Parceiro logou</div>
                    <div className="mobile-transaction-subtitle">Sistema - há 5 horas</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
