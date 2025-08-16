import { useCallback } from 'react';

/**
 * Hook personalizado para scroll suave nas abas
 * Melhora a experiência do usuário ao navegar entre abas
 */
export function useTabScroll() {
  const scrollToActiveTab = useCallback(() => {
    setTimeout(() => {
      // Buscar o conteúdo da aba ativa
      const activeTabContent = document.querySelector('[data-state="active"]');
      
      if (activeTabContent) {
        // Calcular posição ideal para o scroll
        const headerHeight = 100; // Altura aproximada do header
        const elementTop = activeTabContent.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementTop - headerHeight;

        // Scroll suave para a posição calculada
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 200); // Pequeno delay para garantir que a aba tenha mudado
  }, []);

  return { scrollToActiveTab };
}