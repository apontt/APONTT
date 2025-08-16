import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SignatureDisplayProps {
  authorizationSignature?: string;
  contractSignature?: string;
  authorizationSignedAt?: Date | null;
  signedAt?: Date | null;
  clientName: string;
  onDownloadPDF: () => void;
}

export default function SignatureDisplay({
  authorizationSignature,
  contractSignature,
  authorizationSignedAt,
  signedAt,
  clientName,
  onDownloadPDF
}: SignatureDisplayProps) {
  return (
    <div className="space-y-4 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-green-600" />
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Contrato Assinado
          </Badge>
        </div>
        <Button
          onClick={onDownloadPDF}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </div>

      {/* Assinatura do Termo de Autorização */}
      {authorizationSignature && authorizationSignedAt && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Assinatura do Termo de Autorização
          </h4>
          <div className="space-y-2">
            <div 
              className="text-lg text-blue-700 font-script min-h-[40px] flex items-center"
              style={{ 
                fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                fontSize: '24px',
                letterSpacing: '1px'
              }}
            >
              {authorizationSignature}
            </div>
            <p className="text-xs text-gray-500">
              Assinado em {format(new Date(authorizationSignedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      )}

      {/* Assinatura do Contrato */}
      {contractSignature && signedAt && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Assinatura do Contrato
          </h4>
          <div className="space-y-2">
            <div 
              className="text-lg text-green-700 font-script min-h-[40px] flex items-center"
              style={{ 
                fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                fontSize: '24px',
                letterSpacing: '1px'
              }}
            >
              {contractSignature}
            </div>
            <p className="text-xs text-gray-500">
              Assinado em {format(new Date(signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      )}

      {/* Informações do Cliente */}
      <div className="bg-gray-50 p-3 rounded text-center">
        <p className="text-sm text-gray-600">
          <strong>Cliente:</strong> {clientName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Assinaturas digitais com validade jurídica
        </p>
      </div>
    </div>
  );
}