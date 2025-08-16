import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AponttLogo } from "@/components/logo";
import { 
  Plus, 
  Eye, 
  ExternalLink, 
  Copy, 
  FileText, 
  Download, 
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Save,
  Star
} from "lucide-react";
import ContractTemplateEditor from "@/components/contract-template-editor";
import AuthorizationTermEditor from "@/components/authorization-term-editor";
import { 
  XCircle, 
  Link, 
  Send,
  Edit,
  FileCheck,
  Calendar,
  Trash2,
  QrCode,
  Shield
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import SignatureDisplay from "@/components/signature-display";

const contractSchema = z.object({
  clientName: z.string().min(1, "Nome obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  clientPhone: z.string().optional(),
  type: z.string().min(1, "Tipo obrigatório"),
  value: z.string().min(1, "Valor obrigatório"),
  description: z.string().optional(),
});

const contractConfigSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa obrigatório"),
  companyDocument: z.string().min(1, "CNPJ obrigatório"),
  companyAddress: z.string().min(1, "Endereço obrigatório"),
  companyCity: z.string().min(1, "Cidade obrigatória"),
  contractTemplate: z.string().min(1, "Template do contrato obrigatório"),
});

type ContractForm = z.infer<typeof contractSchema>;
type ContractConfigForm = z.infer<typeof contractConfigSchema>;

interface Contract {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocument?: string;
  type: string;
  value: string;
  description?: string;
  content?: string;
  status: string;
  partnerId?: number;
  signatureLink?: string;
  linkToken?: string;
  linkExpiresAt?: string;
  signedAt?: string;
  authorizationTermSigned?: boolean;
  authorizationSignedAt?: string;
  createdAt: string;
  updatedAt?: string;
  paymentStatus?: string;
}

export default function Contracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showAuthTermForm, setShowAuthTermForm] = useState(false);
  const [showValueDialog, setShowValueDialog] = useState(false);
  const [contractForValue, setContractForValue] = useState<Contract | null>(null);
  const [contractValue, setContractValue] = useState("");

  // Estados para seleção múltipla
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  const [selectAllContracts, setSelectAllContracts] = useState(false);

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const contractForm = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      type: "",
      value: "",
      description: "",
    },
  });

  const configForm = useForm<ContractConfigForm>({
    resolver: zodResolver(contractConfigSchema),
    defaultValues: {
      companyName: "GRUPO APONTT",
      companyDocument: "",
      companyAddress: "",
      companyCity: "São Paulo, Estado de São Paulo",
      contractTemplate: `V.1.3 – Ao assinar este contrato, o CONTRATANTE se declara de acordo com todas as cláusulas descritas, não havendo nada a reclamar e/ou contestar posteriormente.

V.2 – Para dirimir eventuais questões advindas deste contrato, as partes elegem o Foro da Comarca de São Paulo, Estado de São Paulo, em detrimento de qualquer outro mais privilegiado.

Assim ajustados, as partes firmam o presente contrato na presença das duas testemunhas adiante indicadas.

São Paulo, ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}.

Contratada: GRUPO APONTT
Contratante: [NOME_CLIENTE]

Anexo I

Parcela Valor   Vencimento
Fatura N° 1 da venda N° [NUMERO_VENDA]  R$ [VALOR_CONTRATO]     [DATA_VENCIMENTO]`,
    },
  });

  // Mutation para criar contrato
  const createContractMutation = useMutation({
    mutationFn: async (data: ContractForm) => {
      return await apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Contrato criado!",
        description: "Contrato criado com sucesso.",
        duration: 3000,
      });
      contractForm.reset();
      setShowContractForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message || "Não foi possível criar o contrato",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: ContractConfigForm) => {
      return await apiRequest("POST", "/api/contract-config", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Configuração salva!",
        description: "Dados do contrato salvos com sucesso.",
        duration: 3000,
      });
      setShowConfigForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message || "Não foi possível salvar as configurações",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutation para gerar link de assinatura
  const generateLinkMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/generate-link`, {
        expirationHours: 72
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.signatureLink);
      setShowLinkDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Link gerado",
        description: "Link de assinatura gerado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar link",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir contrato
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await apiRequest("DELETE", `/api/contracts/${contractId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato excluído",
        description: "Contrato excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir contrato",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir múltiplos contratos selecionados
  const deleteMultipleContractsMutation = useMutation({
    mutationFn: async (contractIds: number[]) => {
      const promises = contractIds.map(id => apiRequest("DELETE", `/api/contracts/${id}`, {}));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "✅ Contratos excluídos!",
        description: `${selectedContracts.length} contratos removidos com sucesso.`,
        duration: 3000,
      });
      setSelectedContracts([]);
      setSelectAllContracts(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir contratos",
        description: error.message || "Não foi possível excluir os contratos",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Função para gerar pagamento de contrato
  const handleGeneratePayment = async (contractId: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/generate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Pagamento gerado!",
          description: `PIX criado com sucesso - Valor: R$ ${parseFloat(data.value).toFixed(2)}`,
        });

        // Abrir link de pagamento
        if (data.paymentUrl || data.invoiceUrl) {
          window.open(data.paymentUrl || data.invoiceUrl, '_blank');
        }

        // Copiar código PIX se disponível
        if (data.pixCode) {
          copyToClipboard(data.pixCode);
        }
      } else {
        throw new Error(data.error || 'Erro ao gerar pagamento');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar pagamento",
        variant: "destructive",
      });
    }
  };

  // Função para enviar pagamento via WhatsApp
  const handleWhatsAppPayment = async (contract: any) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/generate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        const paymentUrl = data.paymentUrl || data.invoiceUrl;
        const message = `Olá ${contract.clientName}! Seu contrato foi assinado com sucesso. Para finalizar, faça o pagamento através deste link: ${paymentUrl}

Valor: R$ ${parseFloat(data.value).toFixed(2)}
${data.simulationMode ? '⚠️ Modo teste - Configure chave Asaas para pagamentos reais' : '✅ Pagamento real via Asaas'}`;

        const whatsappUrl = `https://wa.me/55${contract.clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        toast({
          title: "WhatsApp aberto!",
          description: "Mensagem com link de pagamento preparada",
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar pagamento');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao preparar WhatsApp",
        variant: "destructive",
      });
    }
  };

  // Funções para gerenciar seleção de contratos
  const handleSelectContract = (contractId: number) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAllContracts = () => {
    const signedContracts = contracts.filter(c => c.status === 'signed');
    if (selectAllContracts) {
      setSelectedContracts([]);
      setSelectAllContracts(false);
    } else {
      setSelectedContracts(signedContracts.map(c => c.id));
      setSelectAllContracts(true);
    }
  };

  // Mutation para gerar pagamento PIX
  const generatePixMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/generate-payment`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pagamento PIX gerado",
        description: "Código PIX gerado com sucesso!",
      });
      // Pode exibir o QR Code ou código PIX em um modal
      console.log("PIX Data:", data);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar pagamento PIX",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar termo de autorização
  const createAuthTermMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/authorization-terms", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Termo criado!",
        description: "Termo de autorização criado com sucesso.",
        duration: 3000,
      });
      setShowAuthTermForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar termo",
        description: error.message || "Não foi possível criar o termo",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleSaveContract = (contractData: any) => {
    createContractMutation.mutate(contractData);
  };

  const handleSaveAuthTerm = (termData: any) => {
    createAuthTermMutation.mutate(termData);
  };

  const handleGenerateLink = (contract: Contract) => {
    setContractForValue(contract);
    setContractValue(contract.value || "");
    setShowValueDialog(true);
  };

  const handleConfirmValue = () => {
    if (!contractForValue || !contractValue) return;

    // Primeiro atualizar o contrato com o novo valor
    const updatedContract = {
      ...contractForValue,
      value: contractValue
    };

    // Depois gerar o link
    generateLinkMutation.mutate(contractForValue.id);
    setShowValueDialog(false);
    setContractForValue(null);
    setContractValue("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Link copiado para a área de transferência",
    });
  };

  const downloadContract = (contract: Contract) => {
    // Criar conteúdo HTML profissional para o PDF
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contrato - ${contract.clientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap');
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
          }
          .logo { 
            color: #007bff; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .contract-info { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 25px 0; 
            border-left: 5px solid #007bff;
          }
          .signatures { 
            margin-top: 40px; 
            padding: 25px; 
            border: 3px solid #28a745; 
            background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
            border-radius: 12px;
          }
          .signature-item { 
            margin: 20px 0; 
            padding: 20px; 
            background: white;
            border-radius: 8px;
            border-left: 5px solid #007bff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .signature-text { 
            font-family: 'Dancing Script', 'Brush Script MT', cursive; 
            font-size: 28px; 
            color: #007bff; 
            margin: 15px 0;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .footer { 
            margin-top: 60px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .status-badge {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
          }
          .content-section {
            margin: 25px 0;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">📋 Apontt</div>
          <h1>CONTRATO DIGITAL ASSINADO</h1>
          <div class="status-badge">✓ DOCUMENTO VÁLIDO</div>
        </div>

        <div class="contract-info">
          <h3 style="color: #007bff; margin-top: 0;">📋 Informações do Contrato</h3>
          <p><strong>Cliente:</strong> ${contract.clientName}</p>
          <p><strong>Email:</strong> ${contract.clientEmail}</p>
          ${contract.clientPhone ? `<p><strong>Telefone:</strong> ${contract.clientPhone}</p>` : ''}
          ${contract.clientDocument ? `<p><strong>Documento:</strong> ${contract.clientDocument}</p>` : ''}
          <p><strong>Tipo de Contrato:</strong> ${contract.type}</p>
          <p><strong>Valor:</strong> ${formatCurrency(contract.value)}</p>
          <p><strong>Data de Criação:</strong> ${contract.createdAt ? format(new Date(contract.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
        </div>

        ${contract.description ? `
          <div class="content-section">
            <h3 style="color: #007bff;">📝 Descrição</h3>
            <p>${contract.description}</p>
          </div>
        ` : ''}

        ${contract.content ? `
          <div class="content-section">
            <h3 style="color: #007bff;">📄 Conteúdo do Contrato</h3>
            ${contract.content}
          </div>
        ` : ''}

        <div class="signatures">
          <h3 style="color: #28a745; text-align: center; margin-top: 0;">
            ✅ ASSINATURAS DIGITAIS VÁLIDAS
          </h3>
          <p style="text-align: center; color: #666; margin-bottom: 30px;">
            Este documento possui assinaturas digitais com validade jurídica
          </p>

          ${(contract as any).authorizationSignature ? `
            <div class="signature-item">
              <h4 style="color: #007bff; margin-top: 0;">📋 Termo de Autorização</h4>
              <div class="signature-text">${(contract as any).authorizationSignature}</div>
              <p style="color: #666; margin-bottom: 0;">
                <strong>Assinado em:</strong> ${(contract as any).authorizationSignedAt ? format(new Date((contract as any).authorizationSignedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
          ` : ''}

          ${(contract as any).contractSignature ? `
            <div class="signature-item">
              <h4 style="color: #28a745; margin-top: 0;">📝 Contrato Principal</h4>
              <div class="signature-text">${(contract as any).contractSignature}</div>
              <p style="color: #666; margin-bottom: 0;">
                <strong>Assinado em:</strong> ${contract.signedAt ? format(new Date(contract.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p><strong>Apontt - Sistema de Gestão de Vendas</strong></p>
          <p>Documento gerado digitalmente em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>As assinaturas digitais possuem validade jurídica conforme Lei 14.063/2020</p>
          <p style="margin-top: 15px; font-size: 10px;">
            Este documento contém assinaturas eletrônicas que garantem sua autenticidade e integridade
          </p>
        </div>
      </body>
      </html>
    `;

    // Abrir em nova janela para impressão/PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.print();

      // Focar na janela de impressão
      printWindow.focus();
    }

    toast({
      title: "PDF Gerado",
      description: `Contrato de ${contract.clientName} aberto para impressão/download`,
    });
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (status === 'signed' && paymentStatus === 'paid') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
          <DollarSign className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      );
    }

    switch (status) {
      case "signed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Assinado
          </Badge>
        );
      case "awaiting_signature":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Send className="h-3 w-3 mr-1" />
            Aguardando Assinatura
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Rascunho
          </Badge>
        );
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const generatePayment = (contract: any) => {
    // Lógica para gerar pagamento
    toast({
      title: "Sucesso",
      description: `Link de pagamento gerado para ${contract.clientName}`,
    });
  };

  const contractStats = {
    pending: contracts.filter(c => c.status === "pending").length,
    awaiting: contracts.filter(c => c.status === "awaiting_signature").length,
    signed: contracts.filter(c => c.status === "signed").length,
    cancelled: contracts.filter(c => c.status === "cancelled").length,
    total: contracts.length,
    totalValue: contracts.reduce((sum, c) => sum + parseFloat(c.value || '0'), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header com Moldura Moderna - Responsivo */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <AponttLogo width={120} height={40} className="md:w-40 md:h-12" />
              <div className="text-white">
                <h1 className="text-lg md:text-2xl font-bold">Sistema de Contratos</h1>
                <p className="text-blue-100 text-xs md:text-sm hidden sm:block">Gestão completa de assinaturas digitais</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content com Moldura - Responsivo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
          
          {/* Header interno com botões de ação - Responsivo */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 md:px-6 py-3 md:py-4 border-b border-blue-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-blue-900">Gerenciamento de Contratos</h2>
                <p className="text-blue-700 text-sm mt-1 hidden sm:block">Controle total sobre assinaturas digitais</p>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button
                  onClick={() => setShowAuthTermForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-md text-xs md:text-sm"
                  size="sm"
                >
                  <Shield className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Termo de Autorização</span>
                  <span className="sm:hidden">Termo</span>
                </Button>

                <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs md:text-sm" size="sm">
                      <Settings className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Configurações</span>
                      <span className="sm:hidden">Config</span>
                    </Button>
                  </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border-4 border-white shadow-2xl">
              <DialogHeader>
                <DialogTitle>Configurações do Contrato</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={configForm.handleSubmit((data) => saveConfigMutation.mutate(data))}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Empresa *</Label>
                    <Input {...configForm.register("companyName")} />
                  </div>
                  <div>
                    <Label>CNPJ *</Label>
                    <Input {...configForm.register("companyDocument")} placeholder="00.000.000/0000-00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Endereço *</Label>
                    <Input {...configForm.register("companyAddress")} />
                  </div>
                  <div>
                    <Label>Cidade *</Label>
                    <Input {...configForm.register("companyCity")} />
                  </div>
                </div>
                <div>
                  <Label>Template do Contrato *</Label>
                  <Textarea 
                    {...configForm.register("contractTemplate")} 
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Digite o template do seu contrato aqui..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use as variáveis: [NOME_CLIENTE], [VALOR_CONTRATO], [NUMERO_VENDA], [DATA_VENCIMENTO]
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowConfigForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveConfigMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </form>
            </DialogContent>
                </Dialog>

                <Dialog open={showContractForm} onOpenChange={setShowContractForm}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setEditingContract(null);
                        contractForm.reset();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Contrato
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white border-4 border-white shadow-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Contrato</DialogTitle>
                    </DialogHeader>
                    <form 
                      onSubmit={contractForm.handleSubmit((data) => createContractMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome do Cliente *</Label>
                          <Input {...contractForm.register("clientName")} />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input type="email" {...contractForm.register("clientEmail")} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Telefone</Label>
                          <Input {...contractForm.register("clientPhone")} />
                        </div>
                        <div>
                          <Label>Tipo de Contrato *</Label>
                          <Input {...contractForm.register("type")} placeholder="Ex: Prestação de Serviços" />
                        </div>
                      </div>
                      <div>
                        <Label>Valor do Contrato *</Label>
                        <Input {...contractForm.register("value")} placeholder="Ex: 1500.00" />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea {...contractForm.register("description")} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowContractForm(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createContractMutation.isPending}>
                          {createContractMutation.isPending ? "Adicionando..." : "Adicionar Contrato"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Navegação por Abas dentro da moldura - Responsiva */}
          <div className="px-4 md:px-6">
            <Tabs defaultValue="contracts" className="space-y-4 md:space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-blue-50 border border-blue-200 gap-1 md:gap-0">
                <TabsTrigger value="contracts" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-blue-700 hover:bg-blue-100 text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">📋 Lista de Contratos</span>
                  <span className="md:hidden">📋 Lista</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-blue-700 hover:bg-blue-100 text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">✏️ Inserir Contrato</span>
                  <span className="md:hidden">✏️ Inserir</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-blue-700 hover:bg-blue-100 text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">💳 Pagamentos</span>
                  <span className="md:hidden">💳 Pagar</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-blue-700 hover:bg-blue-100 text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">📊 Estatísticas</span>
                  <span className="md:hidden">📊 Stats</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contracts" className="space-y-6">
                {/* Lista de Contratos */}
                <Card className="bg-white border border-blue-200 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-blue-900">Lista de Contratos</CardTitle>
              <div className="flex gap-2">
                {selectedContracts.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir ${selectedContracts.length} contratos selecionados? Esta ação não pode ser desfeita.`)) {
                        deleteMultipleContractsMutation.mutate(selectedContracts);
                      }
                    }}
                    disabled={deleteMultipleContractsMutation.isPending}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {deleteMultipleContractsMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir ({selectedContracts.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Carregando contratos...</div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum contrato encontrado</p>
              </div>
            ) : (
              <>
                {/* Desktop Layout - ESCONDIDO NO MOBILE */}
                <div className="desktop-table space-y-6 hidden md:block">
                  {/* Header para seleção de contratos assinados */}
                  {contracts.filter(c => c.status === 'signed').length > 0 && (
                    <div className="border-b pb-4">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectAllContracts}
                          onCheckedChange={handleSelectAllContracts}
                          aria-label="Selecionar todos os contratos assinados"
                        />
                        <span className="text-sm font-medium text-gray-600">
                          Selecionar todos os contratos assinados ({contracts.filter(c => c.status === 'signed').length})
                        </span>
                        {selectedContracts.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedContracts.length} selecionados
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectAllContracts}
                            onCheckedChange={handleSelectAllContracts}
                            aria-label="Selecionar todos"
                          />
                        </TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract: any) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedContracts.includes(contract.id)}
                              onCheckedChange={() => handleSelectContract(contract.id)}
                              aria-label={`Selecionar contrato de ${contract.clientName}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{contract.clientName}</p>
                              <p className="text-sm text-gray-500">{contract.clientEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{contract.type}</TableCell>
                          <TableCell>
                            <p className="font-bold text-green-600">
                              R$ {parseFloat(contract.value || "0").toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              contract.status === 'signed' ? 'default' :
                              contract.status === 'pending' ? 'secondary' : 'outline'
                            }>
                              {contract.status === 'pending' ? 'Pendente' :
                               contract.status === 'awaiting_signature' ? 'Aguardando' : 'Assinado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedContract(contract)}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleGenerateLink(contract)}
                                title="Gerar link"
                              >
                                <Link className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Layout - VISÍVEL APENAS NO MOBILE com design moderno */}
                <div className="mobile-layout mobile-contracts-layout block md:hidden space-y-4">
                  {contracts.map((contract: any) => (
                    <Card key={contract.id} className="mobile-contract-card bg-white border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {contract.status === 'signed' && (
                              <Checkbox 
                                checked={selectedContracts.includes(contract.id)}
                                onCheckedChange={() => handleSelectContract(contract.id)}
                                aria-label={`Selecionar contrato de ${contract.clientName}`}
                              />
                            )}
                            <div>
                              <CardTitle className="text-sm font-bold text-blue-900">{contract.clientName}</CardTitle>
                              <p className="text-xs text-blue-700">{contract.clientEmail}</p>
                            </div>
                          </div>
                          <Badge variant={
                            contract.status === 'signed' ? 'default' :
                            contract.status === 'pending' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {contract.status === 'pending' ? 'Pendente' :
                             contract.status === 'awaiting_signature' ? 'Aguardando' : 'Assinado'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-xs text-blue-700 font-medium">Tipo</Label>
                            <p className="font-medium text-blue-900">{contract.type}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-blue-700 font-medium">Valor</Label>
                            <p className="font-bold text-green-600">
                              R$ {parseFloat(contract.value || "0").toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {contract.clientPhone && (
                          <div>
                            <Label className="text-xs text-blue-700 font-medium">Telefone</Label>
                            <p className="text-sm text-blue-900">{contract.clientPhone}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedContract(contract)}
                            className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateLink(contract)}
                            className="flex-1 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                          >
                            <Link className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        </div>
                        
                        {contract.status === 'signed' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Função de gerar PIX - implementar conforme necessário
                                toast({
                                  title: "Funcionalidade em desenvolvimento",
                                  description: "Geração de PIX será implementada em breve",
                                });
                              }}
                              className="flex-1 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              PIX
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Função WhatsApp - implementar conforme necessário
                                const message = `Olá ${contract.clientName}! Seu contrato foi processado.`;
                                const whatsappUrl = `https://wa.me/55${contract.clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <FaWhatsapp className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <Card className="bg-white border border-blue-200 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <CardTitle className="text-blue-900">Inserir Contrato Manual</CardTitle>
                    <CardDescription className="text-blue-700">
                      Adicione contratos diretamente no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500 py-8">
                      Funcionalidade em desenvolvimento
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                <Card className="bg-white border border-blue-200 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <CardTitle className="text-blue-900">Pagamentos</CardTitle>
                    <CardDescription className="text-blue-700">
                      Controle de pagamentos e cobranças
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500 py-8">
                      Funcionalidade em desenvolvimento
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white border border-blue-200 shadow-md">
                    <CardContent className="flex items-center p-6">
                      <FileText className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900">{contracts?.length || 0}</p>
                        <p className="text-sm text-blue-700">Total Contratos</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-blue-200 shadow-md">
                    <CardContent className="flex items-center p-6">
                      <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-green-700">
                          {contracts?.filter(c => c.status === 'signed').length || 0}
                        </p>
                        <p className="text-sm text-green-600">Assinados</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-blue-200 shadow-md">
                    <CardContent className="flex items-center p-6">
                      <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-700">
                          {contracts?.filter(c => c.status === 'pending').length || 0}
                        </p>
                        <p className="text-sm text-yellow-600">Pendentes</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-blue-200 shadow-md">
                    <CardContent className="flex items-center p-6">
                      <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-purple-700">
                          R$ {contractStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-purple-600">Total</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Diálogo de detalhes do contrato */}
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <p className="font-medium">{selectedContract.clientName}</p>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <p>{selectedContract.type}</p>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <p className="font-bold text-green-600">
                      R$ {parseFloat(selectedContract.value || "0").toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={
                      selectedContract.status === 'signed' ? 'default' :
                      selectedContract.status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {selectedContract.status === 'pending' ? 'Pendente' :
                       selectedContract.status === 'awaiting_signature' ? 'Aguardando' : 'Assinado'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de valor do contrato */}
        <Dialog open={showValueDialog} onOpenChange={setShowValueDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Definir Valor do Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contract-value">Valor (R$)</Label>
                <Input
                  id="contract-value"
                  type="number"
                  step="0.01"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  placeholder="Ex: 1500.00"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowValueDialog(false);
                    setContractForValue(null);
                    setContractValue("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmValue}
                  disabled={!contractValue || generateLinkMutation.isPending}
                >
                  {generateLinkMutation.isPending ? "Gerando..." : "Confirmar e Gerar Link"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal do Termo de Autorização */}
        <AuthorizationTermEditor
          isOpen={showAuthTermForm}
          onClose={() => setShowAuthTermForm(false)}
          onSave={handleSaveAuthTerm}
        />
      </div>
    </div>
  );
}
