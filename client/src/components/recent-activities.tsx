import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, UserPlus, Clock, FileSignature } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Activity } from "@shared/schema";

export default function RecentActivities() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract_signed':
        return <CheckCircle className="text-success h-5 w-5" />;
      case 'partner_added':
        return <UserPlus className="text-primary h-5 w-5" />;
      case 'contract_created':
        return <FileSignature className="text-warning h-5 w-5" />;
      default:
        return <Clock className="text-warning h-5 w-5" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'contract_signed':
        return 'bg-success bg-opacity-10';
      case 'partner_added':
        return 'bg-primary bg-opacity-10';
      case 'contract_created':
        return 'bg-warning bg-opacity-10';
      default:
        return 'bg-warning bg-opacity-10';
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  if (isLoading) {
    return (
      <Card className="travel-card">
        <CardHeader>
          <CardTitle className="travel-high-contrast">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="travel-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="travel-high-contrast">Atividades Recentes</CardTitle>
        <button className="travel-btn text-sm px-3 py-1">Ver todas</button>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-200">
          {activities?.map((activity) => (
            <div key={activity.id} className="p-6 flex items-center space-x-4 first:pt-0 last:pb-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityBgColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{activity.description}</p>
                <p className="text-gray-500 text-sm">
                  {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
              <span className={`font-semibold ${activity.value ? 'text-success' : 'text-gray-400'}`}>
                {formatCurrency(activity.value)}
              </span>
            </div>
          ))}
          
          {(!activities || activities.length === 0) && (
            <div className="p-6 text-center text-gray-500">
              Nenhuma atividade recente encontrada
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
