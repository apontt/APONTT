import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertPartnerSchema, type InsertPartner } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";

interface PartnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPartner?: any;
}

export default function PartnerForm({ open, onOpenChange, editingPartner }: PartnerFormProps) {
  const [sendToWhatsApp, setSendToWhatsApp] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPartner>({
    resolver: zodResolver(insertPartnerSchema),
    defaultValues: editingPartner ? {
      name: editingPartner.name || "",
      email: editingPartner.email || "",
      phone: editingPartner.phone || "",
      whatsapp: editingPartner.whatsapp || "",
      company: editingPartner.company || "",
      cnpj: editingPartner.cnpj || "",
      region: editingPartner.region || "",
      city: editingPartner.city || "",
      state: editingPartner.state || "",
      address: editingPartner.address || "",
      observations: editingPartner.observations || "",
      status: editingPartner.status || "active",
      adminFeeRate: editingPartner.adminFeeRate || "",
    } : {
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      company: "",
      cnpj: "",
      region: "",
      city: "",
      state: "",
      address: "",
      observations: "",
      status: "active",
      adminFeeRate: "",
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: InsertPartner) => {
      const method = editingPartner ? "PUT" : "POST";
      const url = editingPartner ? `/api/partners/${editingPartner.id}` : "/api/partners";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: async (partner) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });

      // Mostrar credenciais geradas para novos parceiros
      if (!editingPartner && partner.generatedCredentials) {
        const { login, password } = partner.generatedCredentials;
        const loginUrl = `${window.location.origin}/partner-login`;

        toast({
          title: "Parceiro criado com sucesso!",
          description: `${partner.name} foi adicionado. Login: ${login} | Senha: ${password}`,
          duration: 10000,
        });

        // Enviar via WhatsApp se solicitado
        if (sendToWhatsApp) {
          const message = `Olá ${partner.name}! 

Seu cadastro como parceiro foi realizado com sucesso! ✅

📋 *Dados do Parceiro:*
👤 Nome: ${partner.name}
📧 Email: ${partner.email}
🏢 Empresa: ${partner.company || 'Não informado'}
📍 Cidade: ${partner.city}/${partner.state}

🔐 *Credenciais de Acesso:*
🌐 Link: ${loginUrl}
👤 Login: ${login}
🔑 Senha: ${password}

Para começar a usar o sistema, acesse o link e faça login com suas credenciais.

Bem-vindo à equipe! 🎉`;

          const whatsappUrl = `https://wa.me/${(partner.whatsapp || partner.phone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
      } else if (editingPartner) {
        toast({
          title: "Parceiro atualizado",
          description: `${partner.name} foi atualizado com sucesso.`,
        });
      }

      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar parceiro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPartner) => {
    createPartnerMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto bg-white border-4 border-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{editingPartner ? "Editar Parceiro" : "Cadastrar Novo Parceiro"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do parceiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
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

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123.456.789-01" 
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        // Máscara de CPF
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
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
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp *</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Região</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a região" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="norte">Norte</SelectItem>
                        <SelectItem value="nordeste">Nordeste</SelectItem>
                        <SelectItem value="centro-oeste">Centro-Oeste</SelectItem>
                        <SelectItem value="sudeste">Sudeste</SelectItem>
                        <SelectItem value="sul">Sul</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a cidade" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado (UF) *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção de Taxa Administrativa */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-black mb-4">💰 Taxa Administrativa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="adminFeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Administrativa (%) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          max="100"
                          placeholder="Ex: 5.00" 
                          {...field} 
                          value={field.value || "5.00"} 
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">Taxa personalizada que o parceiro pagará pelos serviços (0-100%)</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-center">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">💡 Valor Flexível</p>
                    <p className="text-xs text-blue-600 mt-1">Configure o valor sugerido personalizado para este parceiro</p>
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Rua, número, bairro, cidade, CEP" 
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o parceiro" 
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="whatsappTemplate" 
                checked={sendToWhatsApp}
                onCheckedChange={(checked) => setSendToWhatsApp(checked === true)}
              />
              <label htmlFor="whatsappTemplate" className="text-sm text-gray-700">
                Enviar dados automaticamente para WhatsApp após cadastro
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createPartnerMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createPartnerMutation.isPending ? "Cadastrando..." : "Cadastrar Parceiro"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}