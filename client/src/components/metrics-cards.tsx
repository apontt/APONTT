import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, UserPlus, Percent, Handshake } from "lucide-react";

interface MetricsCardsProps {
  metrics: {
    monthSales: number;
    newLeads: number;
    conversionRate: number;
    activePartners: number;
    salesGrowth: number;
    leadsGrowth: number;
    conversionGrowth: number;
    partnersGrowth: number;
  };
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatGrowth = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="travel-grid">
      <Card className="travel-card">
        <CardContent className="travel-metric-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="travel-label">Vendas do Mês</p>
              <p className="travel-value">
                {formatCurrency(metrics.monthSales)}
              </p>
              <div className="flex items-center mt-3">
                {metrics.salesGrowth >= 0 ? (
                  <TrendingUp className="text-primary text-sm mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-destructive text-sm mr-1 h-4 w-4" />
                )}
                <span className={`text-sm font-semibold ${metrics.salesGrowth >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatGrowth(metrics.salesGrowth)}
                </span>
                <span className="text-muted-foreground text-sm ml-1">vs mês anterior</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="text-primary h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="travel-card">
        <CardContent className="travel-metric-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="travel-label">Novos Leads</p>
              <p className="travel-value">
                {metrics.newLeads.toLocaleString()}
              </p>
              <div className="flex items-center mt-3">
                {metrics.leadsGrowth >= 0 ? (
                  <TrendingUp className="text-primary text-sm mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-destructive text-sm mr-1 h-4 w-4" />
                )}
                <span className={`text-sm font-semibold ${metrics.leadsGrowth >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatGrowth(metrics.leadsGrowth)}
                </span>
                <span className="text-muted-foreground text-sm ml-1">vs mês anterior</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <UserPlus className="text-secondary h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="travel-card">
        <CardContent className="travel-metric-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="travel-label">Taxa de Conversão</p>
              <p className="travel-value">
                {metrics.conversionRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-3">
                {metrics.conversionGrowth >= 0 ? (
                  <TrendingUp className="text-primary text-sm mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-destructive text-sm mr-1 h-4 w-4" />
                )}
                <span className={`text-sm font-semibold ${metrics.conversionGrowth >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatGrowth(metrics.conversionGrowth)}
                </span>
                <span className="text-muted-foreground text-sm ml-1">vs mês anterior</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center">
              <Percent className="text-warning h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="travel-card">
        <CardContent className="travel-metric-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="travel-label">Parceiros Ativos</p>
              <p className="travel-value">
                {metrics.activePartners}
              </p>
              <div className="flex items-center mt-3">
                {metrics.partnersGrowth >= 0 ? (
                  <TrendingUp className="text-primary text-sm mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-destructive text-sm mr-1 h-4 w-4" />
                )}
                <span className={`text-sm font-semibold ${metrics.partnersGrowth >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatGrowth(metrics.partnersGrowth)}
                </span>
                <span className="text-muted-foreground text-sm ml-1">vs mês anterior</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center">
              <Handshake className="text-success h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
