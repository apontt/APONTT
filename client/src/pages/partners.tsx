import { useState } from "react";
import { Plus, Link, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AponttLogo } from "@/components/logo";
import PartnerForm from "@/components/partner-form";
import PartnerTable from "@/components/partner-table";
import { useToast } from "@/hooks/use-toast";

export default function Partners() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const copyRegisterLink = () => {
    const registerUrl = `${window.location.origin}/partner-register`;
    navigator.clipboard.writeText(registerUrl);
    toast({
      title: "Link copiado!",
      description: "Link de cadastro de parceiro copiado para área de transferência",
    });
  };

  return (
    <div className="travel-bg min-h-screen">
      {/* Header */}
      <header className="travel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <AponttLogo width={160} height={50} />
            <div>
              <h2 className="travel-title">Parceiros</h2>
              <p className="travel-subtitle">Gerencie sua rede de parceiros</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={copyRegisterLink}
              className="travel-btn bg-green-600 text-white hover:bg-green-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link de Cadastro
            </Button>
            <Button onClick={() => setShowForm(true)} className="travel-btn bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Parceiro
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="travel-container">
        <PartnerTable />
      </div>

      {/* Partner Form Modal */}
      <PartnerForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
