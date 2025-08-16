import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Eye, 
  FileText, 
  Calendar,
  User,
  Shield,
  Copy,
  Link,
  Clock,
  CheckCircle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuthorizationTermEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (termData: any) => void;
  editingTerm?: any;
}

const defaultAuthorizationTemplate = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #333;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #2563eb; margin-bottom: 20px; font-size: 24px; font-weight: bold;">TERMO DE AUTORIZAÇÃO</h1>
  </div>

  <div style="margin-bottom: 30px; text-align: left;">
    <p><strong>NOME/RAZÃO SOCIAL:</strong> {{CLIENT_NAME}}</p>
    <p><strong>CPF/CNPJ:</strong> {{CLIENT_DOCUMENT}}</p>
  </div>

  <div style="margin-bottom: 30px; text-align: justify;">
    <p>O associado, por meio desta filiação, autoriza a entidade representativa a atuar em seu nome, em qualquer juízo, instância ou tribunal, em todo o território nacional. A entidade poderá propor as ações cabíveis contra terceiros, bem como defendê-lo em ações contrárias, acompanhando-as até decisão final, inclusive utilizando todos os recursos legais disponíveis.</p>
    
    <p><strong>Confere-se à entidade poderes especiais para:</strong></p>
    
    <ul style="margin: 20px 0; padding-left: 40px;">
      <li>Reconhecer a procedência de pedidos;</li>
      <li>Desistir de ações;</li>
      <li>Renunciar a direitos;</li>
      <li>Transigir, agindo em juízo ou fora dele, exclusivamente na defesa dos direitos do consumidor.</li>
    </ul>
    
    <p>Além disso, o associado autoriza expressamente a entidade a atuar como substituta processual nas ações judiciais propostas.</p>
    
    <p>Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), Lei nº 13.709/2018, que visa proteger os direitos fundamentais de liberdade, privacidade e a livre formação da personalidade, o associado declara:</p>
    
    <ol style="margin: 20px 0; padding-left: 40px;">
      <li>Autorizar, por prazo indeterminado e de forma irretratável, a entidade e seus representantes a compartilhar informações pessoais entre si ou com terceiros, sempre em conformidade com os objetivos de defesa dos direitos do consumidor.</li>
      <li>Reconhecer que tal autorização está em conformidade com os artigos 43 e 83 do Código de Defesa do Consumidor (CDC).</li>
    </ol>
  </div>

  <div style="margin-top: 50px; text-align: center;">
    <p>{{TERM_LOCATION}}, {{TERM_DAY}} DE {{TERM_MONTH}} DE {{TERM_YEAR}}</p>
  </div>

  <div style="margin-top: 60px; text-align: center;">
    <div style="border-top: 1px solid #000; padding-top: 20px; margin: 0 auto; width: 300px;">
      <p><strong>{{CLIENT_NAME}}</strong></p>
      <p>ASSINATURA</p>
    </div>
  </div>
</div>
`;

export default function AuthorizationTermEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  editingTerm 
}: AuthorizationTermEditorProps) {
  const { toast } = useToast();
  const [termData, setTermData] = useState({
    clientName: editingTerm?.clientName || "",
    clientDocument: editingTerm?.clientDocument || "",
    content: editingTerm?.content || defaultAuthorizationTemplate,
    termLocation: "Alagoas",
  });

  const [previewMode, setPreviewMode] = useState(false);

  const generatePreview = () => {
    const today = new Date();
    let content = termData.content;
    
    // Substituir variáveis no template
    const replacements = {
      '{{CLIENT_NAME}}': termData.clientName,
      '{{CLIENT_DOCUMENT}}': termData.clientDocument,
      '{{TERM_LOCATION}}': termData.termLocation,
      '{{TERM_DAY}}': format(today, 'dd', { locale: ptBR }),
      '{{TERM_MONTH}}': format(today, 'MMMM', { locale: ptBR }).toUpperCase(),
      '{{TERM_YEAR}}': format(today, 'yyyy', { locale: ptBR }),
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, value || '');
    });

    return content;
  };

  const handleSave = () => {
    if (!termData.clientName || !termData.clientDocument) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const finalTermData = {
      ...termData,
      content: generatePreview(),
      status: "pending",
      type: "authorization_term",
    };

    onSave(finalTermData);
    onClose();
    
    toast({
      title: "Termo salvo",
      description: "Termo de autorização criado com sucesso!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-4 border-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            {editingTerm ? "Editar Termo de Autorização" : "Novo Termo de Autorização"}
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
                  value={termData.clientName}
                  onChange={(e) => setTermData(prev => ({...prev, clientName: e.target.value}))}
                  placeholder="Nome completo ou razão social"
                />
              </div>
              <div>
                <Label htmlFor="clientDocument">CPF/CNPJ *</Label>
                <Input
                  id="clientDocument"
                  value={termData.clientDocument}
                  onChange={(e) => setTermData(prev => ({...prev, clientDocument: e.target.value}))}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                />
              </div>
              <div>
                <Label htmlFor="termLocation">Local</Label>
                <Input
                  id="termLocation"
                  value={termData.termLocation}
                  onChange={(e) => setTermData(prev => ({...prev, termLocation: e.target.value}))}
                  placeholder="Cidade/Estado"
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
                  Template do Termo de Autorização
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
                  value={termData.content}
                  onChange={(e) => setTermData(prev => ({...prev, content: e.target.value}))}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Conteúdo HTML do termo de autorização..."
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
              Salvar Termo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}