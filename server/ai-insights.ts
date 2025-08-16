// Sistema de insights inteligentes baseado em análise de dados reais
// Gera insights e recomendações sem dependência de APIs externas

export interface FinancialData {
  totalRevenue: number;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  overduePayments: number;
  averageTicket: number;
  conversionRate: number;
  topCustomers: Array<{
    name: string;
    value: number;
    status: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    payments: number;
  }>;
  partnerPerformance: Array<{
    name: string;
    contracts: number;
    revenue: number;
  }>;
}

export interface AIInsight {
  type: 'revenue' | 'conversion' | 'customer' | 'prediction' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  priority: number;
  confidence: number;
}

// Gera insights baseados em análise inteligente dos dados financeiros
export async function generateFinancialInsights(data: FinancialData): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Análise de receita
  if (data.totalRevenue > 0) {
    if (data.paidPayments / data.totalPayments > 0.8) {
      insights.push({
        type: 'revenue',
        title: 'Alta Taxa de Pagamentos',
        description: `Excelente performance com ${((data.paidPayments / data.totalPayments) * 100).toFixed(1)}% dos pagamentos recebidos. Isso indica boa saúde financeira e confiabilidade dos clientes.`,
        impact: 'high',
        action: 'Manter estratégias atuais de cobrança e relacionamento com clientes',
        priority: 1,
        confidence: 95
      });
    } else if (data.paidPayments / data.totalPayments < 0.5) {
      insights.push({
        type: 'risk',
        title: 'Taxa de Inadimplência Elevada',
        description: `Apenas ${((data.paidPayments / data.totalPayments) * 100).toFixed(1)}% dos pagamentos foram recebidos. Isso pode indicar problemas no processo de cobrança ou seleção de clientes.`,
        impact: 'high',
        action: 'Revisar processo de cobrança e implementar ações de recuperação',
        priority: 1,
        confidence: 90
      });
    }
  }

  // Análise de conversão
  if (data.conversionRate > 70) {
    insights.push({
      type: 'conversion',
      title: 'Excelente Taxa de Conversão',
      description: `Taxa de conversão de ${data.conversionRate.toFixed(1)}% está acima da média do mercado, indicando eficácia na qualificação de leads.`,
      impact: 'high',
      action: 'Escalar estratégias de geração de leads para maximizar resultados',
      priority: 2,
      confidence: 85
    });
  } else if (data.conversionRate < 30) {
    insights.push({
      type: 'opportunity',
      title: 'Oportunidade de Melhoria na Conversão',
      description: `Taxa de conversão de ${data.conversionRate.toFixed(1)}% está abaixo do potencial. Há espaço significativo para otimização.`,
      impact: 'medium',
      action: 'Revisar processo de qualificação de leads e treinamento de vendas',
      priority: 2,
      confidence: 80
    });
  }

  // Análise de ticket médio
  if (data.averageTicket > 0) {
    if (data.averageTicket > 5000) {
      insights.push({
        type: 'revenue',
        title: 'Alto Valor de Ticket Médio',
        description: `Ticket médio de R$ ${data.averageTicket.toFixed(2)} indica clientes de alto valor. Foque em retenção e satisfação.`,
        impact: 'high',
        action: 'Implementar programa de fidelização para clientes premium',
        priority: 2,
        confidence: 85
      });
    } else if (data.averageTicket < 1000) {
      insights.push({
        type: 'opportunity',
        title: 'Potencial para Aumento de Ticket',
        description: `Ticket médio de R$ ${data.averageTicket.toFixed(2)} sugere oportunidade para upselling e cross-selling.`,
        impact: 'medium',
        action: 'Desenvolver estratégias de aumento de ticket médio',
        priority: 3,
        confidence: 75
      });
    }
  }

  // Análise de parceiros
  if (data.partnerPerformance.length > 0) {
    const topPartner = data.partnerPerformance.reduce((max, partner) => 
      partner.revenue > max.revenue ? partner : max
    );
    
    insights.push({
      type: 'customer',
      title: 'Parceiro Destaque',
      description: `${topPartner.name} é o parceiro com melhor performance, gerando R$ ${topPartner.revenue.toFixed(2)} em receita.`,
      impact: 'medium',
      action: 'Analisar estratégias do parceiro top para replicar com outros',
      priority: 3,
      confidence: 90
    });
  }

  // Predições baseadas em tendências
  if (data.pendingPayments > data.paidPayments) {
    insights.push({
      type: 'prediction',
      title: 'Previsão de Fluxo de Caixa',
      description: `${data.pendingPayments} pagamentos pendentes podem impactar o fluxo de caixa nos próximos 30 dias.`,
      impact: 'medium',
      action: 'Intensificar ações de cobrança preventiva',
      priority: 2,
      confidence: 80
    });
  }

  // Análise de risco por pagamentos em atraso
  if (data.overduePayments > 0) {
    const riskLevel = data.overduePayments / data.totalPayments;
    if (riskLevel > 0.2) {
      insights.push({
        type: 'risk',
        title: 'Alto Risco de Inadimplência',
        description: `${data.overduePayments} pagamentos em atraso representam ${(riskLevel * 100).toFixed(1)}% do total, indicando alto risco.`,
        impact: 'high',
        action: 'Implementar ações urgentes de recuperação de crédito',
        priority: 1,
        confidence: 95
      });
    }
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

// Gera recomendações estratégicas baseadas nos insights
export async function generateBusinessRecommendations(insights: AIInsight[]): Promise<string> {
  let recommendations = "## Recomendações Estratégicas\n\n";

  const highImpactInsights = insights.filter(i => i.impact === 'high');
  const riskInsights = insights.filter(i => i.type === 'risk');
  const opportunityInsights = insights.filter(i => i.type === 'opportunity');

  if (riskInsights.length > 0) {
    recommendations += "### 🚨 Ações Prioritárias (Risco Alto)\n";
    riskInsights.forEach((insight, index) => {
      recommendations += `${index + 1}. **${insight.title}**: ${insight.action}\n`;
    });
    recommendations += "\n";
  }

  if (highImpactInsights.length > 0) {
    recommendations += "### 🎯 Foco Estratégico (Alto Impacto)\n";
    highImpactInsights.forEach((insight, index) => {
      recommendations += `${index + 1}. **${insight.title}**: ${insight.action}\n`;
    });
    recommendations += "\n";
  }

  if (opportunityInsights.length > 0) {
    recommendations += "### 💡 Oportunidades de Crescimento\n";
    opportunityInsights.forEach((insight, index) => {
      recommendations += `${index + 1}. **${insight.title}**: ${insight.action}\n`;
    });
    recommendations += "\n";
  }

  recommendations += "### 📈 Próximos 30 Dias\n";
  recommendations += "1. Monitore indicadores de performance semanalmente\n";
  recommendations += "2. Ajuste estratégias baseadas nos resultados obtidos\n";
  recommendations += "3. Mantenha foco nas ações de maior impacto e prioridade\n";

  return recommendations;
}