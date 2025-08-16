import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const salesData = [
  { month: 'Jan', sales: 45000 },
  { month: 'Fev', sales: 52000 },
  { month: 'Mar', sales: 48000 },
  { month: 'Abr', sales: 61000 },
  { month: 'Mai', sales: 55000 },
  { month: 'Jun', sales: 67000 },
  { month: 'Jul', sales: 73000 },
  { month: 'Ago', sales: 69000 },
  { month: 'Set', sales: 78000 },
  { month: 'Out', sales: 84000 },
  { month: 'Nov', sales: 89000 },
  { month: 'Dez', sales: 125430 },
];

const funnelData = [
  { name: 'Leads', value: 1248, color: '#1976D2' },
  { name: 'Qualificados', value: 623, color: '#388E3C' },
  { name: 'Propostas', value: 312, color: '#FF9800' },
  { name: 'Fechados', value: 186, color: '#4CAF50' },
];

export default function SalesChart() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="travel-grid">
      <Card className="travel-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold travel-high-contrast">Vendas por Mês</CardTitle>
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
            <option>2024</option>
            <option>2023</option>
          </select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#1976D2" 
                strokeWidth={3}
                dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="travel-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold travel-high-contrast">Funil de Vendas</CardTitle>
          <button className="travel-btn text-sm px-3 py-1">Ver detalhes</button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={funnelData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {funnelData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
