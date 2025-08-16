import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, User, Calendar, Clock, AlertCircle, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AponttLogo } from "@/components/logo";

export default function ContractSignature() {
  const { token } = useParams();
  const { toast } = useToast();
  
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
    if (token) {
      fetchContract();
    }
  }, [token]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/contract/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao carregar contrato");
        return;
      }

      const contractData = await response.json();
      setContract(contractData);
      setClientName(contractData.clientName || "");
      setAuthorizationSigned(contractData.authorizationTermSigned || false);
      
      // Se termo já assinado, ir direto para o contrato
      if (contractData.authorizationTermSigned) {
        setCurrentTab("contract");
      }
    } catch (err: any) {
      setError("Erro ao carregar contrato");
      console.error("Error fetching contract:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationSign = async () => {
    if (!authorizationSignature.trim() || !clientName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha seu nome e assinatura",
        variant: "destructive",
      });
      return;
    }

    try {
      setSigning(true);
      const response = await fetch(`/api/public/contract/${token}/sign-authorization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: authorizationSignature,
          clientName,
        }),
      });

      if (response.ok) {
        setAuthorizationSigned(true);
        setCurrentTab("contract");
        toast({
          title: "Sucesso",
          description: "Termo de autorização assinado com sucesso!",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao assinar termo de autorização",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao assinar termo de autorização",
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

    if (!signature.trim() || !clientName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha seu nome e assinatura",
        variant: "destructive",
      });
      return;
    }

    try {
      setSigning(true);
      const response = await fetch(`/api/public/contract/${token}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          clientName,
        }),
      });

      if (response.ok) {
        setSigned(true);
        toast({
          title: "Sucesso",
          description: "Contrato assinado com sucesso!",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao assinar contrato",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao assinar contrato",
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contrato Assinado!</h2>
            <p className="text-gray-600 mb-4">
              Seu contrato foi assinado com sucesso. Você receberá uma cópia por email.
            </p>
            <p className="text-sm text-gray-500">
              Assinado em {format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assinatura Digital de Contrato
          </h1>
          <p className="text-gray-600">
            Complete a assinatura do termo de autorização e do contrato
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="authorization" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Termo de Autorização
              {authorizationSigned && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contrato de Serviços
              {signed && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="authorization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Termo de Autorização
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Este termo deve ser assinado antes do contrato de serviços
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-gray-50 mb-6">
                  <div className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>NOME/RAZÃO SOCIAL:</strong> {contract.clientName}</p>
                      <p><strong>CPF/CNPJ:</strong> {contract.clientDocument}</p>
                    </div>
                    
                    <div className="space-y-3 text-justify">
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
                      
                      <p className="text-center mt-6">
                        <strong>ALAGOAS, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {!authorizationSigned && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Assinatura do Termo</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="authClientName">Nome Completo</Label>
                        <Input
                          id="authClientName"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Digite seu nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="authSignature">Assinatura</Label>
                        <Input
                          id="authSignature"
                          value={authorizationSignature}
                          onChange={(e) => setAuthorizationSignature(e.target.value)}
                          placeholder="Digite sua assinatura"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAuthorizationSign}
                        disabled={signing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {signing ? "Assinando..." : "Assinar Termo de Autorização"}
                      </Button>
                    </div>
                  </div>
                )}

                {authorizationSigned && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Termo de autorização assinado com sucesso!</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Agora você pode prosseguir para a assinatura do contrato.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detalhes do Contrato
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {contract.status === "signed" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Assinado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Aguardando Assinatura</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!authorizationSigned && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Atenção</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      É necessário assinar o termo de autorização antes de prosseguir com a assinatura do contrato.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Cliente:</span>
                      <span>{contract.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Data:</span>
                      <span>{format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Valor:</span>
                      <span className="text-green-600 font-semibold">
                        R$ {parseFloat(contract.value || "0").toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tipo:</span>
                      <span>{contract.type}</span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo do contrato */}
                <div className="border rounded-lg p-6 bg-gray-50 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Conteúdo do Contrato</h3>
                  <div 
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: contract.content || contract.description }}
                  />
                </div>

                {contract.status !== "signed" && !signed && authorizationSigned && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Assinatura Digital</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientName">Nome Completo</Label>
                        <Input
                          id="clientName"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Digite seu nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signature">Assinatura</Label>
                        <Input
                          id="signature"
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          placeholder="Digite sua assinatura"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSign}
                        disabled={signing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {signing ? "Assinando..." : "Assinar Contrato"}
                      </Button>
                    </div>
                  </div>
                )}

                {(contract.status === "signed" || signed) && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Contrato assinado com sucesso!</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Data da assinatura: {contract.signedAt ? format(new Date(contract.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Agora"}</p>
                      <p>Assinado por: {contract.clientSignature || signature}</p>
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