// Sistema centralizado para gerenciamento de dados do usuário
import { useState, useEffect } from 'react';

// Store global para dados do usuário
class UserDataStore {
  private listeners: Array<(userData: any) => void> = [];
  private currentData: any = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem("apontt_user");
      this.currentData = data ? JSON.parse(data) : { name: "Usuário", role: "" };
    } catch (error) {
      this.currentData = { name: "Usuário", role: "" };
    }
  }

  subscribe(listener: (userData: any) => void) {
    this.listeners.push(listener);
    // Imediatamente chamar com dados atuais
    listener(this.currentData);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  updateData(newData: any) {
    this.currentData = newData;
    localStorage.setItem("apontt_user", JSON.stringify(newData));
    
    // Notificar todos os listeners
    this.listeners.forEach(listener => {
      try {
        listener(newData);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  getCurrentData() {
    this.loadFromStorage(); // Sempre recarregar do storage
    return this.currentData;
  }
}

// Instância global
export const userDataStore = new UserDataStore();

// Hook personalizado para usar os dados do usuário
export function useUserData() {
  const [userData, setUserData] = useState(() => userDataStore.getCurrentData());

  useEffect(() => {
    const unsubscribe = userDataStore.subscribe(setUserData);
    return unsubscribe;
  }, []);

  return userData;
}