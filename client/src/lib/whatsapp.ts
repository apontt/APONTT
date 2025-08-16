export const generateWhatsAppLink = (phoneNumber: string, message: string): string => {
  // Remove caracteres especiais do número de telefone
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Verifica se o número já tem código do país (Brasil: 55)
  const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
  
  // Codifica a mensagem para URL
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
};

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, '');
  
  // Adiciona código do país se necessário
  if (numbers.length === 11 && !numbers.startsWith('55')) {
    return `55${numbers}`;
  }
  
  return numbers;
};

export const generateWhatsAppMessage = (partner: any): string => {
  return `Olá ${partner.name}! 👋

Espero que esteja bem. Sou da equipe ApontT e gostaria de conversar sobre oportunidades de parceria.

Sobre você:
• Nome: ${partner.name}
• Email: ${partner.email}
• Empresa: ${partner.company || 'Não informado'}

Estamos interessados em estabelecer uma parceria estratégica que possa gerar resultados positivos para ambas as partes.

Quando seria um bom momento para conversarmos?

Atenciosamente,
Equipe ApontT`;
};