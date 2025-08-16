import { useState } from "react";
import { useUserData } from "@/lib/userDataStore";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  FileSignature, 
  NotebookTabs, 
  Target, 
  ChartBar,
  Wallet,
  User,
  Menu,
  X,
  LogOut,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Logo APONTT em SVG inline

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Parceiros", href: "/partners", icon: Users },
  { name: "Contratos", href: "/contracts", icon: FileSignature },
  { name: "Clientes", href: "/customers", icon: NotebookTabs },
  { name: "Oportunidades", href: "/opportunities", icon: Target },
  { name: "Carteira", href: "/wallet", icon: Wallet },
  { name: "Insights de IA", href: "/insights", icon: Brain },
  { name: "Relatórios", href: "/reports", icon: ChartBar },
  { name: "Meu Perfil", href: "/profile", icon: User },
];

interface MobileNavProps {
  onLogout: () => void;
}

export default function MobileNav({ onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  
  // Usar o hook personalizado para dados do usuário
  const userData = useUserData();

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
            <rect width="32" height="32" rx="6" fill="currentColor"/>
            <text x="16" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">A</text>
          </svg>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Apontt</h1>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="p-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "md:hidden fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
              <rect width="32" height="32" rx="6" fill="currentColor"/>
              <text x="16" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">A</text>
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                <p className="text-xs text-gray-500">{userData.role}</p>
              </div>
            </div>
          </div>
          
          {/* Logout button */}
          <div className="p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}