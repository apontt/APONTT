import csrf from 'csurf';
import cookieParser from 'cookie-parser';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

export const setupCSRF = (app: any) => {
  app.use(cookieParser());
  
  // CSRF token endpoint
  app.get('/api/csrf-token', csrfProtection, (req: any, res: any) => {
    res.json({ csrfToken: req.csrfToken() });
  });
};