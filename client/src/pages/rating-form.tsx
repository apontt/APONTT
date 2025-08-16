import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Download, Save } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

const ratingFormSchema = z.object({
  // Dados Pessoais
  nomeCompleto: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  dataExpedicaoRG: z.string().min(1, "Data de expedição do RG é obrigatória"),
  tituloEleitor: z.string().min(1, "Título de eleitor é obrigatório"),
  nomePai: z.string().min(1, "Nome do pai é obrigatório"),
  nomeMae: z.string().min(1, "Nome da mãe é obrigatório"),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório"),
  estadoRG: z.string().min(1, "Estado do RG é obrigatório"),
  email: z.string().email("Email inválido"),
  
  // Endereço
  cep: z.string().min(8, "CEP é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  
  // Contato
  telefoneResidencial: z.string().optional(),
  celular: z.string().min(1, "Celular é obrigatório"),
  grauInstrucao: z.string().min(1, "Grau de instrução é obrigatório"),
  rendaFamiliar: z.string().min(1, "Renda familiar é obrigatória"),
  
  // Dados Financeiros
  bancosVinculo: z.string().min(1, "Bancos de vínculo são obrigatórios"),
  placaVeiculo: z.string().optional(),
  anoVeiculo: z.string().optional(),
  
  // Referências Pessoais
  referencia1Nome: z.string().min(1, "Nome da 1ª referência é obrigatório"),
  referencia1Telefone: z.string().min(1, "Telefone da 1ª referência é obrigatório"),
  referencia1Parentesco: z.string().min(1, "Parentesco da 1ª referência é obrigatório"),
  referencia2Nome: z.string().min(1, "Nome da 2ª referência é obrigatório"),
  referencia2Telefone: z.string().min(1, "Telefone da 2ª referência é obrigatório"),
  referencia2Parentesco: z.string().min(1, "Parentesco da 2ª referência é obrigatório"),
  referencia3Nome: z.string().min(1, "Nome da 3ª referência é obrigatório"),
  referencia3Telefone: z.string().min(1, "Telefone da 3ª referência é obrigatório"),
  referencia3Parentesco: z.string().min(1, "Parentesco da 3ª referência é obrigatório"),
  
  // Dados Profissionais
  empresaTrabalha: z.string().min(1, "Empresa onde trabalha é obrigatória"),
  dataAdmissao: z.string().min(1, "Data de admissão é obrigatória"),
  renda: z.string().min(1, "Renda é obrigatória"),
  ocupacao: z.string().min(1, "Ocupação é obrigatória"),
  
  // Dados Adicionais
  senhaSerasa: z.string().min(1, "Senha Serasa é obrigatória"),
  observacoes: z.string().optional(),
});

type RatingFormData = z.infer<typeof ratingFormSchema>;

export default function RatingForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedData, setSavedData] = useState<RatingFormData | null>(null);

  const form = useForm<RatingFormData>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      nomeCompleto: "",
      cpf: "",
      dataExpedicaoRG: "",
      tituloEleitor: "",
      nomePai: "",
      nomeMae: "",
      estadoCivil: "",
      estadoRG: "",
      email: "",
      cep: "",
      endereco: "",
      numero: "",
      cidade: "",
      bairro: "",
      telefoneResidencial: "",
      celular: "",
      grauInstrucao: "",
      rendaFamiliar: "",
      bancosVinculo: "",
      placaVeiculo: "",
      anoVeiculo: "",
      referencia1Nome: "",
      referencia1Telefone: "",
      referencia1Parentesco: "",
      referencia2Nome: "",
      referencia2Telefone: "",
      referencia2Parentesco: "",
      referencia3Nome: "",
      referencia3Telefone: "",
      referencia3Parentesco: "",
      empresaTrabalha: "",
      dataAdmissao: "",
      renda: "",
      ocupacao: "",
      senhaSerasa: "",
      observacoes: "",
    },
  });

  const saveRatingMutation = useMutation({
    mutationFn: async (data: RatingFormData) => {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao salvar rating");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rating salvo com sucesso!",
        description: "Os dados foram salvos e podem ser baixados.",
      });
      setSavedData(form.getValues());
      setIsSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o rating. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RatingFormData) => {
    saveRatingMutation.mutate(data);
  };

  const downloadPDF = () => {
    if (!savedData) return;
    
    // Criar conteúdo para download
    const content = `
FORMULÁRIO DE RATING - PESSOA FÍSICA

=== DADOS PESSOAIS ===
Nome Completo: ${savedData.nomeCompleto}
CPF: ${savedData.cpf}
Data de Expedição do RG: ${savedData.dataExpedicaoRG}
Título de Eleitor: ${savedData.tituloEleitor}
Nome do Pai: ${savedData.nomePai}
Nome da Mãe: ${savedData.nomeMae}
Estado Civil: ${savedData.estadoCivil}
Estado do RG: ${savedData.estadoRG}
E-mail: ${savedData.email}

=== ENDEREÇO ===
CEP: ${savedData.cep}
Endereço: ${savedData.endereco}
Número: ${savedData.numero}
Cidade: ${savedData.cidade}
Bairro: ${savedData.bairro}

=== CONTATO ===
Telefone Residencial: ${savedData.telefoneResidencial || 'Não informado'}
Celular: ${savedData.celular}
Grau de Instrução: ${savedData.grauInstrucao}
Renda Familiar: ${savedData.rendaFamiliar}

=== DADOS FINANCEIROS ===
Bancos e Instituições Financeiras: ${savedData.bancosVinculo}
Placa do Veículo: ${savedData.placaVeiculo || 'Não informado'}
Ano do Veículo: ${savedData.anoVeiculo || 'Não informado'}

=== REFERÊNCIAS PESSOAIS ===
1ª Referência: ${savedData.referencia1Nome} - ${savedData.referencia1Telefone} (${savedData.referencia1Parentesco})
2ª Referência: ${savedData.referencia2Nome} - ${savedData.referencia2Telefone} (${savedData.referencia2Parentesco})
3ª Referência: ${savedData.referencia3Nome} - ${savedData.referencia3Telefone} (${savedData.referencia3Parentesco})

=== DADOS PROFISSIONAIS ===
Empresa onde Trabalha: ${savedData.empresaTrabalha}
Data de Admissão: ${savedData.dataAdmissao}
Renda: ${savedData.renda}
Ocupação: ${savedData.ocupacao}

=== DADOS ADICIONAIS ===
Senha Serasa: ${savedData.senhaSerasa}
Observações: ${savedData.observacoes || 'Nenhuma observação'}

Data de Preenchimento: ${new Date().toLocaleDateString('pt-BR')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rating-${savedData.nomeCompleto.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
      {/* Header */}
      <header className="partner-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">Formulário de Rating</h1>
                <p className="text-sm text-blue-100">Documentação Pessoa Física</p>
              </div>
            </div>
            {isSubmitted && (
              <Button 
                onClick={downloadPDF}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="partner-dashboard">
        <div className="max-w-4xl mx-auto">
          <Card className="partner-content-card">
            <CardHeader>
              <CardTitle>Formulário de Rating - Pessoa Física</CardTitle>
              <CardDescription>
                Preencha todas as informações necessárias para a análise de rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nomeCompleto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="000.000.000-00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dataExpedicaoRG"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Expedição do RG *</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tituloEleitor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título de Eleitor *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nomePai"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Pai *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nomeMae"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Mãe *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="estadoCivil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado Civil *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="input-banking">
                                  <SelectValue placeholder="Selecione o estado civil" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                                <SelectItem value="casado">Casado(a)</SelectItem>
                                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                                <SelectItem value="uniao_estavel">União Estável</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="estadoRG"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado do RG *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="Ex: SP, RJ, MG" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="00000-000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Endereço *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bairro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contato e Instrução */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Contato e Informações Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="telefoneResidencial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone Residencial</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="(11) 0000-0000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="celular"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Celular *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="(11) 00000-0000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="grauInstrucao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grau de Instrução *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="input-banking">
                                  <SelectValue placeholder="Selecione o grau de instrução" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                                <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                                <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                                <SelectItem value="medio_completo">Médio Completo</SelectItem>
                                <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                                <SelectItem value="superior_completo">Superior Completo</SelectItem>
                                <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rendaFamiliar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renda Familiar *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="R$ 0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Dados Financeiros */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Dados Financeiros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bancosVinculo"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Bancos e Instituições Financeiras *</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="input-banking" 
                                placeholder="Ex: CAIXA ECONÔMICA, RENNER, etc."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="placaVeiculo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa do Veículo</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="ABC-1234" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="anoVeiculo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano do Veículo (2024 em diante)</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="2024" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Referências Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Referências Pessoais (3 obrigatórias)</h3>
                    
                    {/* Referência 1 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">1ª Referência</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="referencia1Nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referencia1Telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referencia1Parentesco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grau de Parentesco *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" placeholder="Ex: Irmão, Amigo" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Referência 2 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">2ª Referência</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="referencia2Nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referencia2Telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referencia2Parentesco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grau de Parentesco *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" placeholder="Ex: Irmão, Amigo" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Referência 3 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">3ª Referência</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="referencia3Nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referencia3Telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="referencia3Parentesco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grau de Parentesco *</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-banking" placeholder="Ex: Irmão, Amigo" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Dados Profissionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="empresaTrabalha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresa onde Trabalha *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dataAdmissao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Admissão *</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="renda"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renda *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" placeholder="R$ 0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ocupacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ocupação *</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Dados Adicionais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Dados Adicionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="senhaSerasa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Serasa *</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" className="input-banking" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="observacoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="input-banking" 
                                placeholder="Informações adicionais..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button
                      type="submit"
                      disabled={saveRatingMutation.isPending}
                      className="btn-banking bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveRatingMutation.isPending ? "Salvando..." : "Salvar Rating"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}