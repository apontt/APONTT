import { Link, useLocation } from "wouter";
import { useUserData } from "@/lib/userDataStore";
import { ThemeToggle } from "./theme-toggle";
import { SimpleAponttLogo } from "./logo";
import { 
  BarChart3, 
  Users, 
  FileSignature, 
  NotebookTabs, 
  Target, 
  ChartBar,
  Wallet,
  LogOut,
  User,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
// Logo APONTT em SVG inline

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Parceiros", href: "/partners", icon: Users },
  { name: "Contratos", href: "/contracts", icon: FileSignature },
  { name: "Clientes", href: "/customers", icon: NotebookTabs },
  { name: "Oportunidades", href: "/opportunities", icon: Target },
  { name: "Carteira", href: "/wallet", icon: Wallet },

  { name: "Relatórios", href: "/reports", icon: ChartBar },
  { name: "Meu Perfil", href: "/profile", icon: User },
];

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Usar o hook personalizado para dados do usuário
  const userData = useUserData();

  const handleLogout = () => {
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    onLogout();
  };

  return (
    <aside className="w-64 lg:w-72 xl:w-80 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex justify-center flex-1">
            <SimpleAponttLogo width={120} height={40} />
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 lg:space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 lg:h-5 w-4 lg:w-5" />
                <span className="text-sm lg:text-base">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{userData.name}</p>
            <p className="text-xs text-gray-500">{userData.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
