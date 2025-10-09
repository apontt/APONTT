// Configurações de Segurança - APONTTPAY
// Este arquivo contém funções de segurança e validação

// Rate limiting simples
const rateLimiter = {
    attempts: new Map(),
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    
    isBlocked(ip) {
        const now = Date.now();
        const attempts = this.attempts.get(ip) || { count: 0, resetTime: now + this.windowMs };
        
        if (now > attempts.resetTime) {
            this.attempts.set(ip, { count: 0, resetTime: now + this.windowMs });
            return false;
        }
        
        return attempts.count >= this.maxAttempts;
    },
    
    recordAttempt(ip, success = false) {
        const now = Date.now();
        const attempts = this.attempts.get(ip) || { count: 0, resetTime: now + this.windowMs };
        
        if (now > attempts.resetTime) {
            attempts.count = 0;
            attempts.resetTime = now + this.windowMs;
        }
        
        if (!success) {
            attempts.count++;
        } else {
            attempts.count = 0; // Reset on successful login
        }
        
        this.attempts.set(ip, attempts);
    }
};

// Validações de entrada
const validators = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    },
    
    phone: (phone) => {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    },
    
    document: (doc) => {
        const cleanDoc = doc.replace(/[^\d]/g, '');
        return cleanDoc.length === 11 || cleanDoc.length === 14;
    },
    
    name: (name) => {
        return name.length >= 2 && name.length <= 100 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
    },
    
    password: (password) => {
        // Mínimo 8 caracteres, pelo menos 1 letra e 1 número
        return password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(password);
    },
    
    contractValue: (value) => {
        const numValue = parseFloat(value);
        return !isNaN(numValue) && numValue > 0 && numValue <= 1000000;
    }
};

// Sanitização de dados
const sanitizer = {
    html: (input) => {
        if (typeof input !== 'string') return '';
        return input.replace(/[<>\"'&]/g, function(match) {
            const map = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return map[match];
        });
    },
    
    sql: (input) => {
        if (typeof input !== 'string') return '';
        return input.replace(/['";\\]/g, '');
    },
    
    filename: (input) => {
        if (typeof input !== 'string') return '';
        return input.replace(/[^a-zA-Z0-9._-]/g, '');
    },
    
    general: (input) => {
        if (typeof input !== 'string') return '';
        return input.trim().substring(0, 1000); // Limitar tamanho
    }
};

// Criptografia simples (para demonstração - usar bcrypt em produção)
const crypto = {
    hash: (password) => {
        let hash = 0;
        const salt = 'aponttpay_salt_2024';
        const combined = password + salt;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return 'hash_' + Math.abs(hash).toString(16);
    },
    
    verify: (password, hash) => {
        return crypto.hash(password) === hash;
    },
    
    generateToken: () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
};

// Configurações de segurança
const securityConfig = {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
    
    // Headers de segurança
    securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"
    }
};

// Logs de segurança
const securityLogger = {
    logs: [],
    
    log: (level, message, data = {}) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.logs.push(logEntry);
        
        // Manter apenas os últimos 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        
        // Log crítico no console
        if (level === 'critical' || level === 'error') {
            console.error('Security Alert:', logEntry);
        }
        
        // Salvar logs no localStorage
        try {
            localStorage.setItem('aponttpay_security_logs', JSON.stringify(this.logs));
        } catch (e) {
            console.warn('Não foi possível salvar logs de segurança');
        }
    },
    
    getLogs: (level = null) => {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    },
    
    clearLogs: () => {
        this.logs = [];
        localStorage.removeItem('aponttpay_security_logs');
    }
};

// Verificações de integridade
const integrityChecker = {
    checkDataIntegrity: (data) => {
        try {
            // Verificar se os dados são válidos JSON
            if (typeof data === 'string') {
                JSON.parse(data);
            }
            
            // Verificar estrutura básica
            if (typeof data === 'object' && data !== null) {
                const requiredKeys = ['users', 'partners', 'clients'];
                for (const key of requiredKeys) {
                    if (!(key in data)) {
                        return false;
                    }
                }
            }
            
            return true;
        } catch (e) {
            securityLogger.log('error', 'Data integrity check failed', { error: e.message });
            return false;
        }
    },
    
    sanitizeSystemData: (data) => {
        if (!data || typeof data !== 'object') return null;
        
        const sanitized = {};
        
        // Sanitizar usuários
        if (data.users && Array.isArray(data.users)) {
            sanitized.users = data.users.map(user => ({
                username: sanitizer.general(user.username),
                password: user.password, // Já deve estar hasheado
                name: sanitizer.html(user.name),
                type: sanitizer.general(user.type)
            }));
        }
        
        // Sanitizar parceiros
        if (data.partners && Array.isArray(data.partners)) {
            sanitized.partners = data.partners.map(partner => ({
                ...partner,
                company: sanitizer.html(partner.company),
                email: sanitizer.general(partner.email),
                phone: sanitizer.general(partner.phone),
                responsible: sanitizer.html(partner.responsible)
            }));
        }
        
        // Copiar outros dados
        sanitized.clients = data.clients || [];
        sanitized.partnerClients = data.partnerClients || {};
        sanitized.systemSettings = data.systemSettings || {};
        
        return sanitized;
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        rateLimiter,
        validators,
        sanitizer,
        crypto,
        securityConfig,
        securityLogger,
        integrityChecker
    };
}