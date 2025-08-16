import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, QrCode, Receipt, CreditCard, Copy, ExternalLink, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { Contract } from "@shared/schema";
import { z } from "zod";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const paymentSchema = z.object({
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD", "UNDEFINED"]),
  value: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().min(1, "Telefone é obrigatório"),
  customerDocument: z.string().min(1, "CPF/CNPJ é obrigatório"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface ContractActionsProps {
  contract: Contract;
}

export default function ContractActions({ contract }: ContractActionsProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [deletingContract, setDeletingContract] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      billingType: "UNDEFINED",
      value: contract.value || "0",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Pagamento do contrato ${contract.id}`,
      customerName: contract.clientName,
      customerEmail: contract.clientEmail,
      customerPhone: "",
      customerDocument: "",
    },
  });

  const sendContractMutation = useMutation({
    mutationFn: async ({ type, recipient }: { type: 'email' | 'whatsapp'; recipient: string }) => {
      const response = await apiRequest("POST", "/api/contracts/send", {
        contractId: contract.id,
        type,
        recipient,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      toast({
        title: "Contrato enviado",
        description: `Contrato enviado por ${variables.type === 'email' ? 'email' : 'WhatsApp'} com sucesso!`,
      });

      if (variables.type === 'whatsapp' && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar contrato",
        variant: "destructive",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      const response = await apiRequest("POST", "/api/payments/asaas", {
        ...data,
        contractId: contract.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPaymentData(data);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      
      toast({
        title: "Cobrança criada",
        description: "Cobrança criada com sucesso no Asaas!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cobrança",
        variant: "destructive",
      });
    },
  });

  const onCreatePayment = (data: PaymentForm) => {
    createPaymentMutation.mutate(data);
  };

  const deleteContractMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/contracts/${contract.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato excluído",
        description: "Contrato excluído com sucesso",
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

  const handleDeleteContract = () => {
    deleteContractMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    });
  };

  const sendPaymentLink = async (method: 'email' | 'whatsapp') => {
    if (!paymentData) return;

    try {
      const response = await apiRequest("POST", "/api/payments/send", {
        paymentId: paymentData.id,
        method,
        recipient: method === 'email' ? contract.clientEmail : form.getValues('customerPhone'),
        paymentUrl: paymentData.invoiceUrl,
      });

      const result = await response.json();

      if (method === 'whatsapp' && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      }

      toast({
        title: "Link enviado",
        description: `Link de pagamento enviado por ${method === 'email' ? 'email' : 'WhatsApp'}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar link de pagamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Enviar Contrato por Email */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => sendContractMutation.mutate({ type: 'email', recipient: contract.clientEmail })}
        disabled={sendContractMutation.isPending}
      >
        <Send className="h-4 w-4 mr-1" />
        Email
      </Button>

      {/* Enviar Contrato por WhatsApp */}
      <Button
        size="sm"
        variant="outline"
        className="bg-green-50 hover:bg-green-100 text-green-600"
        onClick={() => sendContractMutation.mutate({ type: 'whatsapp', recipient: contract.clientEmail })}
        disabled={sendContractMutation.isPending}
      >
        <FaWhatsapp className="h-4 w-4 mr-1" />
        WhatsApp
      </Button>

      {/* Excluir Contrato */}
      {contract.status === 'pending' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="sm" 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
                <br />
                <strong>Cliente:</strong> {contract.clientName}
                <br />
                <strong>Valor:</strong> R$ {parseFloat(contract.value || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteContract}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteContractMutation.isPending}
              >
                {deleteContractMutation.isPending ? "Excluindo..." : "Excluir Contrato"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Criar Cobrança Asaas */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Receipt className="h-4 w-4 mr-1" />
            Cobrança
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border-4 border-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>Criar Cobrança - Asaas</DialogTitle>
          </DialogHeader>

          {!paymentData ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreatePayment)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cliente *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="billingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UNDEFINED">Cliente escolhe</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="BOLETO">Boleto</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="100.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da cobrança" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending ? "Criando..." : "Criar Cobrança"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Cobrança criada com sucesso!</h3>
                <p className="text-sm text-green-700">
                  ID da cobrança: <code className="bg-green-100 px-1 rounded">{paymentData.id}</code>
                </p>
              </div>

              {/* Link de Pagamento */}
              <div className="space-y-3">
                <h4 className="font-medium">Link de Pagamento</h4>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={paymentData.invoiceUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentData.invoiceUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(paymentData.invoiceUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code PIX */}
              {paymentData.pixQrCode && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code PIX
                  </h4>
                  <div className="flex flex-col items-center space-y-3">
                    <img 
                      src={`data:image/png;base64,${paymentData.pixQrCode.encodedImage}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 border rounded-lg"
                    />
                    <div className="w-full">
                      <label className="text-sm font-medium">Código PIX Copia e Cola:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input 
                          value={paymentData.pixQrCode.payload} 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(paymentData.pixQrCode.payload)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ações de Envio */}
              <div className="space-y-3">
                <h4 className="font-medium">Enviar Link de Pagamento</h4>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => sendPaymentLink('email')}
                    className="flex-1"
                    variant="outline"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar por Email
                  </Button>
                  <Button
                    onClick={() => sendPaymentLink('whatsapp')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FaWhatsapp className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => {
                    setPaymentData(null);
                    setShowPaymentDialog(false);
                    form.reset();
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}