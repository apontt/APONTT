// Sistema de persistência específico para dados do perfil
export class ProfilePersistence {
  private static readonly PROFILE_KEY = "apontt_profile_data";

  // Salvar dados do perfil separadamente
  static saveProfile(profileData: any) {
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profileData));
      console.log('ProfilePersistence - Dados salvos:', profileData);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  }

  // Carregar dados do perfil
  static loadProfile() {
    try {
      const data = localStorage.getItem(this.PROFILE_KEY);
      const profile = data ? JSON.parse(data) : null;
      console.log('ProfilePersistence - Dados carregados:', profile);
      return profile;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  }

  // Mesclar dados do perfil com dados padrão
  static mergeWithDefault(defaultData: any) {
    const savedProfile = this.loadProfile();
    if (!savedProfile) return defaultData;

    const merged = {
      ...defaultData,
      ...savedProfile,
      // Preservar campos específicos do perfil
      name: savedProfile.name || defaultData.name,
      email: savedProfile.email || defaultData.email,
      role: savedProfile.role || defaultData.role
    };

    console.log('ProfilePersistence - Dados mesclados:', merged);
    return merged;
  }

  // Limpar dados (apenas para casos específicos)
  static clearProfile() {
    localStorage.removeItem(this.PROFILE_KEY);
  }
}