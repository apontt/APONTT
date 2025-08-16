import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Target,
  Users,
  DollarSign,
  BarChart3,
  Lightbulb,
  Download,
  RefreshCw,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// import AponttLogo from "@/components/apontt-logo";

interface AIInsight {
  type: 'revenue' | 'conversion' | 'customer' | 'prediction' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  priority: number;
  confidence: number;
}

interface InsightsData {
  insights: AIInsight[];
  recommendations: string;
  lastUpdated: string;
}

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("insights");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Buscar insights de IA
  const { data: insightsData, isLoading, refetch } = useQuery<InsightsData>({
    queryKey: ["/api/ai-insights"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const generateNewInsights = async () => {
    setIsGenerating(true);
    try {
      await apiRequest("POST", "/api/ai-insights/generate");
      await refetch();
      toast({
        title: "Insights Atualizados!",
        description: "Novos insights de IA foram gerados com base nos dados mais recentes.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar insights",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'conversion': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'customer': return <Users className="h-5 w-5 text-purple-600" />;
      case 'prediction': return <BarChart3 className="h-5 w-5 text-orange-600" />;
      case 'risk': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'opportunity': return <Target className="h-5 w-5 text-indigo-600" />;
      default: return <Lightbulb className="h-5 w-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const downloadReport = () => {
    if (!insightsData) return;
    
    const reportContent = `
RELATÓRIO DE INSIGHTS FINANCEIROS - APONTT
Gerado em: ${new Date(insightsData.lastUpdated).toLocaleString()}

=== INSIGHTS IDENTIFICADOS ===
${insightsData.insights.map(insight => `
${insight.title.toUpperCase()}
Tipo: ${insight.type}
Impacto: ${insight.impact}
Prioridade: ${insight.priority}/10
Confiança: ${insight.confidence}%

Descrição: ${insight.description}
Ação Recomendada: ${insight.action}
`).join('\n---\n')}

=== RECOMENDAÇÕES ESTRATÉGICAS ===
${insightsData.recommendations}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-apontt-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório Baixado!",
      description: "O relatório de insights foi salvo em seu computador.",
    });
  };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-lg">
              GRUPO APONTT
            </div>
            <div>
              <h2 className="travel-title flex items-center">
                <Brain className="h-6 w-6 mr-2" />
                Insights de IA
              </h2>
              <p className="travel-subtitle">Análises inteligentes e recomendações estratégicas</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={generateNewInsights}
              disabled={isGenerating}
              className="travel-btn bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Gerando...' : 'Atualizar'}
            </Button>
            {insightsData && (
              <Button
                onClick={downloadReport}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="travel-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Brain className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
              <p className="text-lg font-medium">Analisando dados financeiros...</p>
              <p className="text-sm text-gray-600">Gerando insights inteligentes</p>
            </div>
          </div>
        ) : !insightsData ? (
          <Card className="travel-card text-center">
            <CardContent className="pt-6">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum insight disponível</h3>
              <p className="text-gray-600 mb-4">
                Clique em "Atualizar" para gerar insights baseados nos seus dados financeiros.
              </p>
              <Button onClick={generateNewInsights} disabled={isGenerating} className="travel-btn">
                <Brain className="h-4 w-4 mr-2" />
                Gerar Primeiro Insight
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="insights" className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Insights ({insightsData.insights.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Recomendações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              {/* Estatísticas dos Insights */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="travel-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Insights</p>
                        <p className="text-2xl font-bold">{insightsData.insights.length}</p>
                      </div>
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="travel-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Alto Impacto</p>
                        <p className="text-2xl font-bold text-red-600">
                          {insightsData.insights.filter(i => i.impact === 'high').length}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="travel-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                        <p className="text-2xl font-bold text-green-600">
                          {insightsData.insights.filter(i => i.type === 'opportunity').length}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="travel-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Confiança Média</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(insightsData.insights.reduce((acc, i) => acc + i.confidence, 0) / insightsData.insights.length)}%
                        </p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insightsData.insights
                  .sort((a, b) => b.priority - a.priority)
                  .map((insight, index) => (
                    <Card key={index} className="travel-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getInsightIcon(insight.type)}
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                          </div>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact === 'high' ? 'Alto' : 
                             insight.impact === 'medium' ? 'Médio' : 'Baixo'} Impacto
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-700">{insight.description}</p>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Ação Recomendada:</p>
                          <p className="text-sm text-blue-800">{insight.action}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>Prioridade: {insight.priority}/10</span>
                            <span>Confiança: {insight.confidence}%</span>
                          </div>
                          <Progress value={insight.confidence} className="w-20 h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Recomendações Estratégicas
                  </CardTitle>
                  <CardDescription>
                    Relatório executivo baseado na análise de IA dos seus dados financeiros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {insightsData.recommendations}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {insightsData && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Última atualização: {new Date(insightsData.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}