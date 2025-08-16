import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle, 
  Clock,
  DollarSign,
  FileText
} from "lucide-react";
import { FaWhatsapp, FaPix } from "react-icons/fa6";
import { AponttLogo } from "@/components/logo";

interface Contract {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  type: string;
  value: string;
  description: string;
  status: string;
  paymentStatus?: string;
  signedAt?: string;
}

export default function ContractPayment() {
  const [match, params] = useRoute("/payment/:id");
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (match && params?.id) {
      fetchContract(parseInt(params.id));
    }
  }, [match, params]);

  const fetchContract = async (id: number) => {
    try {
      const response = await fetch(`/api/contracts/${id}`);
      if (response.ok) {
        const contractData = await response.json();
        setContract(contractData);
      } else {
        toast({
          title: "Erro",
          description: "Contrato não encontrado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar contrato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePayment = async () => {
    if (!contract) return;

    setGeneratingPayment(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}/generate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentData(data);
        toast({
          title: "Pagamento gerado!",
          description: "Código PIX e link de pagamento criados com sucesso",
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar pagamento');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar pagamento",
        variant: "destructive",
      });
    } finally {
      setGeneratingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência",
    });
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
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
            
            <p className="text-sm text-blue-500">Preparando pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Contrato não encontrado</h2>
            <p className="text-gray-600">Verifique se o link está correto</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <AponttLogo width={200} height={60} />
          <h1 className="text-3xl font-bold text-gray-800 mt-4">Pagamento do Contrato</h1>
          <p className="text-gray-600 mt-2">Finalize o pagamento do seu contrato de forma segura</p>
        </div>

        {/* Informações do Contrato */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Informações do Cliente</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Nome:</span> <strong>{contract.clientName}</strong></p>
                  <p><span className="text-gray-600">Email:</span> {contract.clientEmail}</p>
                  <p><span className="text-gray-600">Telefone:</span> {contract.clientPhone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Informações do Contrato</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Tipo:</span> {contract.type}</p>
                  <p><span className="text-gray-600">Valor:</span> <strong className="text-green-600 text-lg">{formatCurrency(contract.value)}</strong></p>
                  <p><span className="text-gray-600">Status:</span> 
                    <Badge className="ml-2 bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Assinado
                    </Badge>
                  </p>
                  {contract.signedAt && (
                    <p><span className="text-gray-600">Assinado em:</span> {format(new Date(contract.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  )}
                </div>
              </div>
            </div>

            {contract.description && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Descrição</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{contract.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Área de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract.paymentStatus === 'paid' ? (
              <div className="text-center p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h3>
                <p className="text-gray-600">Este contrato já foi pago e está finalizado.</p>
              </div>
            ) : !paymentData ? (
              <div className="text-center">
                <DollarSign className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerar Pagamento PIX</h3>
                <p className="text-gray-600 mb-6">Clique no botão abaixo para gerar o código PIX e finalizar o pagamento</p>
                <Button
                  onClick={generatePayment}
                  disabled={generatingPayment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  {generatingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FaPix className="h-5 w-5 mr-2" />
                      Gerar PIX
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Pagamento PIX Gerado!</h3>
                  <p className="text-gray-600">Use o código abaixo para fazer o pagamento</p>
                </div>

                {paymentData.pixQrCodeImage && (
                  <div className="text-center">
                    <img 
                      src={`data:image/png;base64,${paymentData.pixQrCodeImage}`}
                      alt="QR Code PIX"
                      className="mx-auto border rounded-lg p-4 bg-white"
                      style={{ maxWidth: '250px' }}
                    />
                  </div>
                )}

                {paymentData.pixCode && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código PIX Copia e Cola:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={paymentData.pixCode}
                        readOnly
                        className="flex-1 p-2 border rounded bg-white text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(paymentData.pixCode)}
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentData.invoiceUrl && (
                    <Button
                      onClick={() => window.open(paymentData.invoiceUrl, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Fatura Completa
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      const message = `Olá! Gerei o PIX para pagamento do contrato. Valor: ${formatCurrency(contract.value)}. Link: ${window.location.href}`;
                      const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    variant="outline"
                    className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <FaWhatsapp className="h-4 w-4 mr-2" />
                    Compartilhar no WhatsApp
                  </Button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">📱 Como pagar:</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Abra o aplicativo do seu banco</li>
                    <li>Procure pela opção "PIX"</li>
                    <li>Escaneie o QR Code acima OU</li>
                    <li>Copie e cole o código PIX</li>
                    <li>Confirme o pagamento</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}