import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Phone, Mail, FileText, Users, Clock, AlertCircle, CheckCircle2, CalendarPlus, Timer } from "lucide-react";
import type { Partner, Contract, Customer, Opportunity } from "@shared/schema";
import { format, isAfter, addDays, isBefore, differenceInMinutes, differenceInHours, differenceInDays, addMinutes, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

interface NextAction {
  id: string;
  type: 'followup' | 'contract' | 'opportunity' | 'partner' | 'scheduled';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  scheduledDate?: Date;
  relatedTo: string;
  action: string;
  icon: React.ComponentType<any>;
  isCompleted?: boolean;
  minutes?: number;
}

const scheduleActionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.enum(["high", "medium", "low"]),
  scheduledDate: z.date(),
  scheduledTime: z.string(),
  relatedTo: z.string().min(1, "Relacionado a é obrigatório"),
});

type ScheduleActionForm = z.infer<typeof scheduleActionSchema>;

export default function NextActions() {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduledActions, setScheduledActions] = useState<NextAction[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partners } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities'],
  });

  const form = useForm<ScheduleActionForm>({
    resolver: zodResolver(scheduleActionSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      scheduledTime: "09:00",
      relatedTo: "",
    },
  });

  // Atualizar o tempo a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Carregar ações agendadas do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scheduledActions');
    if (saved) {
      const actions = JSON.parse(saved).map((action: any) => ({
        ...action,
        scheduledDate: new Date(action.scheduledDate),
        dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
      }));
      setScheduledActions(actions);
    }
  }, []);

  // Salvar ações agendadas no localStorage
  const saveScheduledActions = (actions: NextAction[]) => {
    localStorage.setItem('scheduledActions', JSON.stringify(actions));
    setScheduledActions(actions);
  };

  const generateNextActions = (): NextAction[] => {
    const actions: NextAction[] = [];
    const today = new Date();
    const threeDaysAgo = addDays(today, -3);
    const oneWeekFromNow = addDays(today, 7);

    // Contratos pendentes há mais de 3 dias
    contracts?.forEach(contract => {
      if (contract.status === 'pending' && contract.createdAt) {
        const contractDate = new Date(contract.createdAt);
        if (isBefore(contractDate, threeDaysAgo)) {
          actions.push({
            id: `contract-${contract.id}`,
            type: 'contract',
            title: 'Contrato pendente',
            description: `Contrato de ${contract.clientName} aguardando assinatura há mais de 3 dias`,
            priority: 'high',
            dueDate: addDays(contractDate, 7),
            relatedTo: contract.clientName,
            action: 'Entrar em contato para agilizar assinatura',
            icon: FileText,
          });
        }
      }
    });

    // Leads sem follow-up
    customers?.forEach(customer => {
      if (customer.status === 'lead' && customer.createdAt) {
        const customerDate = new Date(customer.createdAt);
        if (isBefore(customerDate, threeDaysAgo)) {
          actions.push({
            id: `customer-${customer.id}`,
            type: 'followup',
            title: 'Follow-up necessário',
            description: `Lead ${customer.name} sem contato há mais de 3 dias`,
            priority: 'medium',
            dueDate: addDays(customerDate, 5),
            relatedTo: customer.name,
            action: 'Fazer contato para qualificar lead',
            icon: Phone,
          });
        }
      }
    });

    // Oportunidades com data de fechamento próxima
    opportunities?.forEach(opportunity => {
      if (opportunity.expectedCloseDate && opportunity.stage !== 'closed-won' && opportunity.stage !== 'closed-lost') {
        const closeDate = new Date(opportunity.expectedCloseDate);
        if (isAfter(closeDate, today) && isBefore(closeDate, oneWeekFromNow)) {
          actions.push({
            id: `opportunity-${opportunity.id}`,
            type: 'opportunity',
            title: 'Oportunidade próxima do fechamento',
            description: `${opportunity.title} - fechamento previsto em ${format(closeDate, 'dd/MM/yyyy', { locale: ptBR })}`,
            priority: opportunity.probability && opportunity.probability > 70 ? 'high' : 'medium',
            dueDate: closeDate,
            relatedTo: opportunity.title,
            action: 'Acompanhar negociação',
            icon: Calendar,
          });
        }
      }
    });

    // Parceiros inativos
    partners?.forEach(partner => {
      if (partner.status === 'active' && partner.lastActivity) {
        const lastActivity = new Date(partner.lastActivity);
        if (isBefore(lastActivity, addDays(today, -30))) {
          actions.push({
            id: `partner-${partner.id}`,
            type: 'partner',
            title: 'Parceiro inativo',
            description: `${partner.name} sem atividade há mais de 30 dias`,
            priority: 'low',
            dueDate: addDays(lastActivity, 45),
            relatedTo: partner.name,
            action: 'Verificar status e disponibilidade',
            icon: Users,
          });
        }
      }
    });

    // Adicionar ações agendadas
    scheduledActions.forEach(scheduledAction => {
      if (!scheduledAction.isCompleted && scheduledAction.scheduledDate) {
        actions.push(scheduledAction);
      }
    });

    // Ordenar por prioridade e data
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      const dateA = a.scheduledDate || a.dueDate;
      const dateB = b.scheduledDate || b.dueDate;
      if (dateA && dateB) {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    }).slice(0, 12); // Limitar a 12 ações
  };

  const nextActions = generateNextActions();

  const onScheduleAction = (data: ScheduleActionForm) => {
    const [hours, minutes] = data.scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(data.scheduledDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const newAction: NextAction = {
      id: `scheduled-${Date.now()}`,
      type: 'scheduled',
      title: data.title,
      description: data.description,
      priority: data.priority,
      scheduledDate: scheduledDateTime,
      relatedTo: data.relatedTo,
      action: 'Executar ação agendada',
      icon: CalendarPlus,
      isCompleted: false,
    };

    const updatedActions = [...scheduledActions, newAction];
    saveScheduledActions(updatedActions);

    toast({
      title: "Ação agendada",
      description: `${data.title} foi agendada para ${format(scheduledDateTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
    });

    form.reset();
    setShowScheduleDialog(false);
  };

  const completeAction = (actionId: string) => {
    const updatedActions = scheduledActions.map(action =>
      action.id === actionId ? { ...action, isCompleted: true } : action
    );
    saveScheduledActions(updatedActions);

    toast({
      title: "Ação concluída",
      description: "A ação foi marcada como concluída",
    });
  };

  const getTimeRemaining = (targetDate: Date) => {
    const now = currentTime;
    const diffMinutes = differenceInMinutes(targetDate, now);
    const diffHours = differenceInHours(targetDate, now);
    const diffDays = differenceInDays(targetDate, now);

    if (diffMinutes < 0) {
      return { text: "Atrasado", color: "text-error", expired: true };
    }

    if (diffDays > 0) {
      return { text: `${diffDays}d ${diffHours % 24}h`, color: "text-gray-600", expired: false };
    }

    if (diffHours > 0) {
      return { text: `${diffHours}h ${diffMinutes % 60}m`, color: diffHours < 2 ? "text-warning" : "text-gray-600", expired: false };
    }

    return { text: `${diffMinutes}m`, color: diffMinutes < 30 ? "text-error" : "text-warning", expired: false };
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-error bg-opacity-10 text-error border-error">
            <AlertCircle className="h-3 w-3 mr-1" />
            Alta
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-warning bg-opacity-10 text-warning border-warning">
            <Clock className="h-3 w-3 mr-1" />
            Média
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Baixa
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return FileText;
      case 'followup':
        return Phone;
      case 'opportunity':
        return Calendar;
      case 'partner':
        return Users;
      default:
        return Clock;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Próximas Ações
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{nextActions.length} pendentes</Badge>
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <CalendarPlus className="h-4 w-4 mr-1" />
                Agendar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agendar Nova Ação</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onScheduleAction)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da ação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição detalhada" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relatedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relacionado a *</FormLabel>
                        <FormControl>
                          <Input placeholder="Cliente, parceiro ou projeto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="low">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Agendar Ação
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {nextActions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma ação pendente no momento!</p>
            <p className="text-sm text-gray-400 mt-1">Todas as tarefas estão em dia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nextActions.map((action) => {
              const IconComponent = getTypeIcon(action.type);
              return (
                <div key={action.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    action.priority === 'high' ? 'bg-error bg-opacity-10' :
                    action.priority === 'medium' ? 'bg-warning bg-opacity-10' :
                    'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      action.priority === 'high' ? 'text-error' :
                      action.priority === 'medium' ? 'text-warning' :
                      'text-gray-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(action.priority)}
                        {(action.scheduledDate || action.dueDate) && (() => {
                          const targetDate = action.scheduledDate || action.dueDate!;
                          const timeInfo = getTimeRemaining(targetDate);
                          return (
                            <Badge variant="outline" className={`${timeInfo.color} flex items-center space-x-1`}>
                              <Timer className="h-3 w-3" />
                              <span>{timeInfo.text}</span>
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="font-medium mr-1">Relacionado a:</span>
                        {action.relatedTo}
                        {(action.scheduledDate || action.dueDate) && (
                          <>
                            <span className="mx-2">•</span>
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(action.scheduledDate || action.dueDate!, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {action.type === 'scheduled' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => completeAction(action.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Concluir
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-xs">
                          {action.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}