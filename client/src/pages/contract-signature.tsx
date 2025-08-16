
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, User, Calendar, Clock, AlertCircle, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SignaturePad from "@/components/signature-pad";
import { AponttLogo } from "@/components/logo";

export default function ContractSignature() {
  const params = useParams();
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Obter token da URL de forma mais robusta
  let token = params.token;
  
  if (!token) {
    // Tentar obter token da query string
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token') || undefined;
    
    // Tentar obter token da URL diretamente
    const pathMatch = window.location.pathname.match(/\/sign\/([^/?]+)/);
    if (pathMatch) {
      token = pathMatch[1];
    }
    
    // Última tentativa: obter da URL atual
    const parts = window.location.pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'sign') {
      token = parts[2];
    }
  }
  
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [clientName, setClientName] = useState("");
  const [authorizationSigned, setAuthorizationSigned] = useState(false);
  const [authorizationSignature, setAuthorizationSignature] = useState("");
  const [currentTab, setCurrentTab] = useState("authorization");

  useEffect(() => {
    console.log("Token detectado:", token);
    console.log("URL atual:", window.location.href);
    console.log("Params:", params);
    console.log("Location:", location);
    
    if (token) {
      fetchContract();
    } else {
      setError("Token de contrato não encontrado na URL");
      setLoading(false);
    }
  }, [token, location]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Buscando contrato com token:", token);
      
      if (!token || token.length < 10) {
        setError("Token de contrato inválido");
        return;
      }
      
      const response = await fetch(`/api/public/contract/${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        let errorMessage = "Erro ao carregar contrato";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          if (response.status === 404) {
            errorMessage = "Contrato não encontrado. Verifique se o link está correto.";
          } else if (response.status === 410) {
            errorMessage = "Link de assinatura expirado. Solicite um novo link.";
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        }
        
        console.error("Erro na resposta:", errorMessage);
        setError(errorMessage);
        return;
      }

      const contractData = await response.json();
      console.log("Dados do contrato:", contractData);
      
      // Validar dados do contrato
      if (!contractData.id || !contractData.clientName) {
        setError("Dados do contrato estão incompletos");
        return;
      }
      
      setContract(contractData);
      setClientName(contractData.clientName || "");
      setAuthorizationSigned(contractData.authorizationTermSigned || false);
      setSigned(contractData.status === "signed" || false);
      
      // Se termo já assinado, ir direto para o contrato
      if (contractData.authorizationTermSigned) {
        setCurrentTab("contract");
      }
    } catch (err: any) {
      console.error("Erro ao buscar contrato:", err);
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationSign = async () => {
    if (!authorizationSignature || authorizationSignature.length < 10) {
      toast({
        title: "Erro",
        description: "Por favor, assine no campo de assinatura",
        variant: "destructive",
      });
      return;
    }

    if (!clientName.trim() || clientName.length < 2) {
      toast({
        title: "Erro",
        description: "Por favor, preencha seu nome completo",
        variant: "destructive",
      });
      return;
    }

    try {
      setSigning(true);
      const response = await fetch(`/api/public/contract/${encodeURIComponent(token || '')}/sign-authorization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: authorizationSignature,
          clientName: clientName.trim(),
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setAuthorizationSigned(true);
        setCurrentTab("contract");
        toast({
          title: "Sucesso",
          description: "Termo de autorização assinado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: responseData.error || "Erro ao assinar termo de autorização",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao assinar termo:", err);
      toast({
        title: "Erro",
        description: "Erro de conexão ao assinar termo de autorização",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  const handleSign = async () => {
    if (!authorizationSigned) {
      toast({
        title: "Erro",
        description: "Por favor, assine primeiro o termo de autorização",
        variant: "destructive",
      });
      setCurrentTab("authorization");
      return;
    }

    if (!signature || signature.length < 10) {
      toast({
        title: "Erro",
        description: "Por favor, assine no campo de assinatura",
        variant: "destructive",
      });
      return;
    }

    if (!clientName.trim() || clientName.length < 2) {
      toast({
        title: "Erro",
        description: "Por favor, preencha seu nome completo",
        variant: "destructive",
      });
      return;
    }

    try {
      setSigning(true);
      const response = await fetch(`/api/public/contract/${encodeURIComponent(token || '')}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: signature,
          clientName: clientName.trim(),
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSigned(true);
        
        // Verificar se há link de pagamento para redirecionamento automático
        if (responseData.paymentUrl) {
          toast({
            title: "✅ Contrato assinado!",
            description: "Redirecionando para pagamento...",
            duration: 2000,
          });
          
          // Redirecionar para a página de pagamento do Asaas após 2 segundos
          setTimeout(() => {
            window.location.href = responseData.paymentUrl;
          }, 2000);
        } else {
          toast({
            title: "Sucesso",
            description: "Contrato assinado com sucesso!",
          });
        }
      } else {
        toast({
          title: "Erro",
          description: responseData.error || "Erro ao assinar contrato",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao assinar contrato:", err);
      toast({
        title: "Erro",
        description: "Erro de conexão ao assinar contrato",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white shadow-md border-2 border-gray-200">
          <CardContent className="p-8 text-center">
            {/* Logo */}
            <div className="mb-8">
              <AponttLogo width={150} height={50} className="mx-auto" />
            </div>
            
            {/* Spinner animado */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto mb-6"></div>
            
            {/* Título */}
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Carregando contrato...</h2>
            <p className="text-blue-600 mb-6">Por favor, aguarde enquanto carregamos seus dados.</p>
            
            {/* Barra de progresso animada */}
            <div className="w-full bg-blue-100 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full loading-bar"></div>
            </div>
            
            <p className="text-sm text-blue-500">Preparando documentos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Erro</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Tentar Novamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contrato Assinado!</h2>
            <p className="text-gray-600 mb-6">
              Seu contrato foi assinado com sucesso. Você receberá uma cópia por email em breve.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                <strong>Assinado em:</strong><br />
                {format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contrato não encontrado</h2>
            <p className="text-gray-600">Verifique o link e tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-full">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Assinatura Digital de Contrato
          </h1>
          <p className="text-xl text-gray-600">
            Complete a assinatura do termo de autorização e do contrato de serviços
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${authorizationSigned ? 'text-green-600' : 'text-blue-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${authorizationSigned ? 'bg-green-600' : 'bg-blue-600'} text-white text-sm font-bold`}>
                {authorizationSigned ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="font-medium">Termo de Autorização</span>
            </div>
            <div className={`w-8 h-1 ${authorizationSigned ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center space-x-2 ${signed ? 'text-green-600' : authorizationSigned ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${signed ? 'bg-green-600' : authorizationSigned ? 'bg-blue-600' : 'bg-gray-300'} text-white text-sm font-bold`}>
                {signed ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="font-medium">Contrato de Serviços</span>
            </div>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="authorization" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              Termo de Autorização
              {authorizationSigned && <CheckCircle className="h-4 w-4 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              Contrato de Serviços
              {signed && <CheckCircle className="h-4 w-4 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="authorization" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-6 w-6" />
                  Termo de Autorização
                </CardTitle>
                <p className="text-blue-100">
                  Este termo deve ser assinado antes do contrato de serviços
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border rounded-lg p-6 bg-gray-50 mb-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4 text-sm">
                    <div className="space-y-2 bg-white p-4 rounded border">
                      <p><strong>NOME/RAZÃO SOCIAL:</strong> {contract.clientName}</p>
                      <p><strong>CPF/CNPJ:</strong> {contract.clientDocument || 'Não informado'}</p>
                    </div>
                    
                    <div className="space-y-3 text-justify leading-relaxed">
                      <p>
                        O associado, por meio desta filiação, autoriza a entidade representativa a atuar em seu nome, 
                        em qualquer juízo, instância ou tribunal, em todo o território nacional. A entidade poderá 
                        propor as ações cabíveis contra terceiros, bem como defendê-lo em ações contrárias, 
                        acompanhando-as até decisão final, inclusive utilizando todos os recursos legais disponíveis.
                      </p>
                      
                      <p><strong>Confere-se à entidade poderes especiais para:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Reconhecer a procedência de pedidos;</li>
                        <li>Desistir de ações;</li>
                        <li>Renunciar a direitos;</li>
                        <li>Transigir, agindo em juízo ou fora dele, exclusivamente na defesa dos direitos do consumidor.</li>
                      </ul>
                      
                      <p>
                        Além disso, o associado autoriza expressamente a entidade a atuar como substituta processual 
                        nas ações judiciais propostas.
                      </p>
                      
                      <p>
                        Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), Lei nº 13.709/2018, que visa 
                        proteger os direitos fundamentais de liberdade, privacidade e a livre formação da personalidade, 
                        o associado declara:
                      </p>
                      
                      <ol className="list-decimal list-inside ml-4 space-y-1">
                        <li>
                          Autorizar, por prazo indeterminado e de forma irretratável, a entidade e seus representantes 
                          a compartilhar informações pessoais entre si ou com terceiros, sempre em conformidade com os 
                          objetivos de defesa dos direitos do consumidor.
                        </li>
                        <li>
                          Reconhecer que tal autorização está em conformidade com os artigos 43 e 83 do Código de 
                          Defesa do Consumidor (CDC).
                        </li>
                      </ol>
                      
                      <p className="text-center mt-6 font-bold">
                        ALAGOAS, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {!authorizationSigned && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Assinatura do Termo
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="authClientName" className="text-base font-medium">Nome Completo</Label>
                        <Input
                          id="authClientName"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Digite seu nome completo"
                          className="mt-2 h-12"
                        />
                      </div>
                      
                      <SignaturePad
                        onSignature={setAuthorizationSignature}
                        placeholder="Assine o termo de autorização aqui"
                        width={600}
                        height={200}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAuthorizationSign}
                        disabled={signing || !authorizationSignature || !clientName.trim()}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 px-8"
                      >
                        {signing ? "Assinando..." : "Assinar Termo de Autorização"}
                      </Button>
                    </div>
                  </div>
                )}

                {authorizationSigned && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-3 text-green-600 mb-4 bg-green-50 p-4 rounded-lg">
                      <CheckCircle className="h-6 w-6" />
                      <span className="font-semibold text-lg">Termo de autorização assinado com sucesso!</span>
                    </div>
                    <div className="text-gray-600">
                      <p>Agora você pode prosseguir para a assinatura do contrato de serviços.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-6 w-6" />
                    Detalhes do Contrato
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {contract.status === "signed" ? (
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Assinado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Aguardando Assinatura</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!authorizationSigned && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Atenção</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      É necessário assinar o termo de autorização antes de prosseguir com a assinatura do contrato.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-700">Cliente:</span>
                        <p className="text-gray-900">{contract.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-700">Data:</span>
                        <p className="text-gray-900">
                          {contract.createdAt && format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Valor:</span>
                      <p className="text-green-600 font-bold text-xl">
                        R$ {parseFloat(contract.value || "0").toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <p className="text-blue-600 font-semibold">{contract.type}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6 bg-gray-50 mb-6 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Conteúdo do Contrato
                  </h3>
                  <div 
                    className="prose max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contract.content || contract.description }}
                  />
                </div>

                {contract.status !== "signed" && !signed && authorizationSigned && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Assinatura Digital
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="clientName" className="text-base font-medium">Nome Completo</Label>
                        <Input
                          id="clientName"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Digite seu nome completo"
                          className="mt-2 h-12"
                        />
                      </div>
                      
                      <SignaturePad
                        onSignature={setSignature}
                        placeholder="Assine o contrato aqui"
                        width={600}
                        height={200}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSign}
                        disabled={signing || !signature || !clientName.trim()}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 px-8"
                      >
                        {signing ? "Assinando..." : "Assinar Contrato"}
                      </Button>
                    </div>
                  </div>
                )}

                {(contract.status === "signed" || signed) && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-3 text-green-600 mb-4 bg-green-50 p-4 rounded-lg">
                      <CheckCircle className="h-6 w-6" />
                      <span className="font-semibold text-lg">Contrato assinado com sucesso!</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>
                        <strong>Data da assinatura:</strong> {contract.signedAt ? format(new Date(contract.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Agora"}
                      </p>
                      <p>
                        <strong>Assinado por:</strong> {contract.clientSignature || signature}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
