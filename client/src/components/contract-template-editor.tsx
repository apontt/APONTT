import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Eye, 
  FileText, 
  Calendar,
  User,
  CreditCard,
  Copy,
  Link,
  Clock,
  CheckCircle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: any) => void;
  editingContract?: any;
}

const defaultTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #2563eb; margin-bottom: 10px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    <p style="color: #666;">Apontt - Sistema de Vendas</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">DADOS DO CONTRATO</h3>
    <p><strong>Contratante:</strong> {{COMPANY_NAME}}</p>
    <p><strong>CNPJ:</strong> {{COMPANY_CNPJ}}</p>
    <p><strong>Endereço:</strong> {{COMPANY_ADDRESS}}</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">DADOS DO CLIENTE</h3>
    <p><strong>Nome/Razão Social:</strong> {{CLIENT_NAME}}</p>
    <p><strong>CPF/CNPJ:</strong> {{CLIENT_DOCUMENT}}</p>
    <p><strong>Email:</strong> {{CLIENT_EMAIL}}</p>
    <p><strong>Telefone:</strong> {{CLIENT_PHONE}}</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">OBJETO DO CONTRATO</h3>
    <p><strong>Tipo de Serviço:</strong> {{CONTRACT_TYPE}}</p>
    <p><strong>Descrição:</strong> {{CONTRACT_DESCRIPTION}}</p>
    <p><strong>Valor Total:</strong> {{CONTRACT_VALUE}}</p>
    <p><strong>Data de Vigência:</strong> {{CONTRACT_DATE}} a {{CONTRACT_END_DATE}}</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">CLÁUSULAS E CONDIÇÕES</h3>
    <div style="text-align: justify;">
      <p><strong>CLÁUSULA 1ª - DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços de {{CONTRACT_TYPE}}, conforme especificações detalhadas neste documento.</p>
      
      <p><strong>CLÁUSULA 2ª - DO PRAZO:</strong> O prazo de vigência deste contrato é de {{CONTRACT_DURATION}}, iniciando-se em {{CONTRACT_DATE}} e terminando em {{CONTRACT_END_DATE}}.</p>
      
      <p><strong>CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO:</strong> O valor total dos serviços é de {{CONTRACT_VALUE}}, a ser pago conforme cronograma de pagamento acordado entre as partes.</p>
      
      <p><strong>CLÁUSULA 4ª - DAS OBRIGAÇÕES:</strong> As partes se comprometem a cumprir fielmente todas as obrigações estabelecidas neste contrato, respeitando os prazos e condições acordadas.</p>
      
      <p><strong>CLÁUSULA 5ª - DA RESCISÃO:</strong> Este contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de 30 (trinta) dias, sem prejuízo das obrigações já assumidas.</p>
      
      <p><strong>CLÁUSULA 6ª - DO FORO:</strong> As partes elegem o foro da comarca de [CIDADE] para dirimir quaisquer questões oriundas do presente contrato.</p>
    </div>
  </div>

  <div style="margin-top: 50px;">
    <p>{{CONTRACT_LOCATION}}, {{CONTRACT_DAY}} de {{CONTRACT_MONTH}} de {{CONTRACT_YEAR}}.</p>
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #000; padding-top: 10px;">
        <p><strong>{{COMPANY_NAME}}</strong></p>
        <p>Contratante</p>
      </div>
    </div>
    
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #000; padding-top: 10px;">
        <p><strong>{{CLIENT_NAME}}</strong></p>
        <p>Contratado</p>
      </div>
    </div>
  </div>
</div>
`;

const assessoriaFinanceiraTemplate = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #333;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #2563eb; margin-bottom: 20px; font-size: 24px; font-weight: bold;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORIA FINANCEIRA</h1>
  </div>

  <div style="margin-bottom: 30px; text-align: justify;">
    <p><strong>CONTRATANTE –</strong> {{CLIENT_NAME}}, brasileiro(a), cadastrado(a) no CPF/CNPJ sob nº {{CLIENT_DOCUMENT}}, data de nascimento: {{CLIENT_BIRTH_DATE}}.</p>
    
    <p><strong>CONTRATADA –</strong> {{COMPANY_NAME}}, regularmente inscrita no CNPJ sob o nº {{COMPANY_CNPJ}}, escritório comercial na {{COMPANY_ADDRESS}}, e com suporte através do endereço eletrônico: {{COMPANY_EMAIL}}</p>
    
    <p>As partes convencionam entre si de comum acordo o instrumento com as presentes cláusulas seguintes:</p>
    
    <p>Pelo presente instrumento, de acordo com a legislação vigente e na melhor forma de Direito, partes retro indicadas e qualificadas que são, de um lado, {{CLIENT_NAME}}, doravante denominado unicamente <strong>CONTRATANTE</strong>, e de outro, {{COMPANY_NAME}}, doravante denominada tão somente <strong>CONTRATADA</strong>, têm entre si ajustado um contrato de consultoria e assessoria de crédito que se regerá consoante às disposições seguintes.</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #2563eb; font-weight: bold;">I – A CONSULTORIA</h3>
    <div style="text-align: justify;">
      <p><strong>I.1</strong> – O CONTRATANTE e seus sócios/avalistas possuem restrições nos órgãos de proteção ao crédito SCPC Boa Vista, SPC e SERASA.</p>
      
      <p><strong>I.1.1</strong> – Esse contrato tem as seguintes características: obter, através de meios judiciais, extrajudiciais e/ou administrativos, a retirada do nome do CONTRATANTE dos órgãos elencados no item I.1.</p>
      
      <p><strong>I.2</strong> – Nessas condições, a CONTRATADA prestará ao CONTRATANTE serviços de consultoria e assessoria de crédito para eliminar restrições.</p>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #2563eb; font-weight: bold;">II – OS SERVIÇOS</h3>
    <div style="text-align: justify;">
      <p><strong>II.1</strong> – Os serviços de consultoria consistirão na retirada dos apontamentos das dívidas do CONTRATANTE que constam nos órgãos privados de proteção ao crédito como SPC, SCPC Boa Vista e SERASA.</p>
      
      <p><strong>II.2</strong> – O primeiro passo é o CONTRATANTE enviar a ficha de filiação preenchida, bem como cópia do RG ou CNH e contrato social, pessoalmente, por e-mail, foto ou por correios à CONTRATADA.</p>
      
      <p><strong>II.2.1</strong> – Após o pagamento e envio dos documentos solicitados, a CONTRATADA iniciará os trâmites para retirada dos apontamentos no nome do CONTRATANTE.</p>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #2563eb; font-weight: bold;">III – AS OBRIGAÇÕES E AS CONDIÇÕES ESPECIAIS</h3>
    <div style="text-align: justify;">
      <p><strong>III.1</strong> – A CONTRATADA se obriga a entregar o resultado sob pena de devolução integral dos valores pagos pelo CONTRATANTE.</p>
      
      <p><strong>III.1.1</strong> – A CONTRATADA precisa de um prazo médio de 30 (trinta) dias úteis para entregar o resultado, podendo este prazo perdurar por até 90 (noventa) dias úteis caso ocorra algum tipo de agravo no processo.</p>
      
      <p><strong>III.1.2</strong> – O prazo de 30 dias (trinta dias) úteis começa a ser contabilizado a partir do momento em que a CONTRATADA estiver com todos os documentos solicitados ao CONTRATANTE em mãos e o pagamento completo.</p>
      
      <p><strong>III.1.3</strong> – O CONTRATANTE perde automaticamente a garantia de serviços, prevista neste contrato, caso não efetue o pagamento das faturas recorrentes após a entrada no ato, tornando-se assim responsável por quaisquer consequências decorrentes.</p>
      
      <p><strong>III.2</strong> – A CONTRATADA garante a retirada dos apontamentos do CONTRATANTE apenas nos órgãos mencionados no item I.1 deste contrato e deixa claro que eventuais apontamentos em órgãos públicos, como o cadastro do CCF do Banco Central, não serão retirados.</p>
      
      <p><strong>III.3</strong> – A CONTRATADA deixa claro que não se responsabiliza caso o CONTRATANTE não consiga obter crédito no mercado junto a bancos, financeiras e/ou comércio em geral.</p>
      
      <p><strong>III.4</strong> – O prazo de garantia será válido enquanto a liminar estiver vigente, cessando automaticamente caso a liminar seja revogada ou deixe de produzir efeitos.</p>
      
      <p><strong>III.5</strong> – Fica claro que a CONTRATADA é um meio e não um fim, não podendo ser responsabilizada por eventuais insucessos ou resultados não satisfatórios.</p>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #2563eb; font-weight: bold;">IV – A REMUNERAÇÃO</h3>
    <div style="text-align: justify;">
      <p><strong>IV</strong> – Para remunerar os serviços previstos neste contrato, o CONTRATANTE pagará à CONTRATADA o valor de: {{CONTRACT_VALUE}}, pagos da seguinte forma: Pix em 1x declarado como ENTRADA e o restante, caso solicitado parcelamento, no período acordado.</p>
      
      <p><strong>IV.1</strong> – O não pagamento da prestação de serviços nas exatas condições contratadas ensejará a rescisão do presente contrato, multa e a imediata cessação dos serviços que estiverem em andamento.</p>
      
      <p><strong>IV.1.1</strong> – Caso o CONTRATANTE desista do contrato depois da CONTRATADA ter iniciado os procedimentos, não terá a quantia devolvida, pois não há como desfazer o procedimento depois de iniciado.</p>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h3 style="color: #2563eb; font-weight: bold;">V – DISPOSIÇÕES GERAIS</h3>
    <div style="text-align: justify;">
      <p><strong>V.1</strong> – O presente contrato vigorará por tempo indeterminado, a contar da data da presente contratação.</p>
      
      <p><strong>V.1.1</strong> – A CONTRATADA deverá dar início imediato às providências para limpeza do nome.</p>
      
      <p><strong>V.1.2</strong> – A prestação dos serviços contratados se encerrará imediatamente quando o nome do CONTRATANTE estiver limpo nos órgãos mencionados no item I.1.</p>
      
      <p><strong>V.1.3</strong> – Ao assinar este contrato, o CONTRATANTE se declara de acordo com todas as cláusulas descritas, não havendo nada a reclamar e/ou contestar posteriormente.</p>
      
      <p><strong>V.2</strong> – Para dirimir eventuais questões advindas deste contrato, as partes elegem o Foro da Comarca de {{CONTRACT_LOCATION}}, em detrimento de qualquer outro mais privilegiado.</p>
    </div>
  </div>

  <div style="margin-top: 50px; text-align: center;">
    <p>Assim ajustados, as partes firmam o presente contrato na presença das duas testemunhas adiante indicadas.</p>
    <br>
    <p>{{CONTRACT_LOCATION}}, {{CONTRACT_DAY}}/{{CONTRACT_MONTH_NUMBER}}/{{CONTRACT_YEAR}}.</p>
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #000; padding-top: 10px;">
        <p><strong>{{COMPANY_NAME}}</strong></p>
        <p>Contratada</p>
      </div>
    </div>
    
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #000; padding-top: 10px;">
        <p><strong>{{CLIENT_NAME}}</strong></p>
        <p>Contratante</p>
      </div>
    </div>
  </div>

  <div style="margin-top: 40px;">
    <h3 style="color: #2563eb; font-weight: bold; text-align: center;">Anexo I - Cronograma de Pagamento</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Parcela</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Valor</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Vencimento</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">Fatura N° 1 da venda N° {{CONTRACT_ID}}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">{{CONTRACT_VALUE}}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">{{PAYMENT_DUE_DATE}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`;

export default function ContractTemplateEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  editingContract 
}: ContractTemplateEditorProps) {
  const { toast } = useToast();
  const [contractData, setContractData] = useState({
    clientName: editingContract?.clientName || "",
    clientEmail: editingContract?.clientEmail || "",
    clientPhone: editingContract?.clientPhone || "",
    clientDocument: editingContract?.clientDocument || "",
    type: editingContract?.type || "Consultoria",
    description: editingContract?.description || "",
    value: editingContract?.value || "",
    content: editingContract?.content || defaultTemplate,
    templateType: editingContract?.templateType || "default",
    clientBirthDate: editingContract?.clientBirthDate || "",
    companyEmail: "grupoapontt@gmail.com",
    contractLocation: "São Paulo",
    contractDuration: "12 meses",
    contractEndDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: ptBR }),
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Dados da empresa atualizados conforme contrato anexado
  const companyData = {
    name: "GRUPO APONTT",
    cnpj: "58.929.808.0001/38",
    address: "Rua ver Otacílio L Santos, N 369, Centro, Feira Grande - AL, CEP: 57340-00",
    email: "grupoapontt@gmail.com"
  };

  const generatePreview = () => {
    const today = new Date();
    let content = contractData.content;
    
    // Substituir variáveis no template
    const replacements = {
      '{{COMPANY_NAME}}': companyData.name,
      '{{COMPANY_CNPJ}}': companyData.cnpj,
      '{{COMPANY_ADDRESS}}': companyData.address,
      '{{CLIENT_NAME}}': contractData.clientName,
      '{{CLIENT_EMAIL}}': contractData.clientEmail,
      '{{CLIENT_PHONE}}': contractData.clientPhone,
      '{{CLIENT_DOCUMENT}}': contractData.clientDocument,
      '{{CONTRACT_TYPE}}': contractData.type,
      '{{CONTRACT_DESCRIPTION}}': contractData.description,
      '{{CONTRACT_VALUE}}': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(contractData.value || '0')),
      '{{CONTRACT_DATE}}': format(today, 'dd/MM/yyyy', { locale: ptBR }),
      '{{CONTRACT_END_DATE}}': contractData.contractEndDate,
      '{{CONTRACT_DURATION}}': contractData.contractDuration,
      '{{CONTRACT_LOCATION}}': contractData.contractLocation,
      '{{CONTRACT_DAY}}': format(today, 'dd', { locale: ptBR }),
      '{{CONTRACT_MONTH}}': format(today, 'MMMM', { locale: ptBR }),
      '{{CONTRACT_MONTH_NUMBER}}': format(today, 'MM', { locale: ptBR }),
      '{{CONTRACT_YEAR}}': format(today, 'yyyy', { locale: ptBR }),
      '{{CLIENT_BIRTH_DATE}}': contractData.clientBirthDate,
      '{{COMPANY_EMAIL}}': companyData.email,
      '{{CONTRACT_ID}}': Math.floor(Math.random() * 100000),
      '{{PAYMENT_DUE_DATE}}': format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: ptBR }),
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, value || '');
    });

    return content;
  };

  const handleSave = () => {
    if (!contractData.clientName || !contractData.clientEmail || !contractData.value) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const finalContractData = {
      ...contractData,
      content: generatePreview(),
      status: "pending",
    };

    onSave(finalContractData);
    onClose();
    
    toast({
      title: "Contrato salvo",
      description: "Contrato criado com sucesso!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-4 border-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {editingContract ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nome/Razão Social *</Label>
                <Input
                  id="clientName"
                  value={contractData.clientName}
                  onChange={(e) => setContractData(prev => ({...prev, clientName: e.target.value}))}
                  placeholder="Nome completo ou razão social"
                />
              </div>
              <div>
                <Label htmlFor="clientDocument">CPF/CNPJ *</Label>
                <Input
                  id="clientDocument"
                  value={contractData.clientDocument}
                  onChange={(e) => setContractData(prev => ({...prev, clientDocument: e.target.value}))}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={contractData.clientEmail}
                  onChange={(e) => setContractData(prev => ({...prev, clientEmail: e.target.value}))}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  value={contractData.clientPhone}
                  onChange={(e) => setContractData(prev => ({...prev, clientPhone: e.target.value}))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="clientBirthDate">Data de Nascimento</Label>
                <Input
                  id="clientBirthDate"
                  type="date"
                  value={contractData.clientBirthDate}
                  onChange={(e) => setContractData(prev => ({...prev, clientBirthDate: e.target.value}))}
                  placeholder="Data de nascimento"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="h-5 w-5 mr-2" />
                Dados do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Serviço *</Label>
                <Select 
                  value={contractData.type} 
                  onValueChange={(value) => {
                    setContractData(prev => ({
                      ...prev, 
                      type: value,
                      content: value === "Assessoria Financeira" ? assessoriaFinanceiraTemplate : defaultTemplate
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultoria">Consultoria</SelectItem>
                    <SelectItem value="Assessoria Financeira">Assessoria Financeira</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                    <SelectItem value="Treinamento">Treinamento</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Valor Total (R$) *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={contractData.value}
                  onChange={(e) => setContractData(prev => ({...prev, value: e.target.value}))}
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Descrição dos Serviços</Label>
                <Textarea
                  id="description"
                  value={contractData.description}
                  onChange={(e) => setContractData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Descreva detalhadamente os serviços que serão prestados..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Editor de Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Template do Contrato
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? "Editar" : "Preview"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div 
                  className="border rounded-lg p-4 min-h-[400px] bg-white"
                  dangerouslySetInnerHTML={{ __html: generatePreview() }}
                />
              ) : (
                <Textarea
                  value={contractData.content}
                  onChange={(e) => setContractData(prev => ({...prev, content: e.target.value}))}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Conteúdo HTML do contrato..."
                />
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Contrato
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}