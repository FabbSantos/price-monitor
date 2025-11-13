# Changelog

## [1.0.0] - 2025-11-13

### Funcionalidades Iniciais

- ✅ Sistema completo de scraping para múltiplas lojas
- ✅ Interface moderna com Next.js 14 e Tailwind CSS
- ✅ Scrapers para Amazon, Casas Bahia, Magazine Luiza e Mercado Livre
- ✅ Notificações por email via SMTP
- ✅ Histórico de preços com gráficos interativos
- ✅ Atualização automática a cada 30 minutos (configurável)
- ✅ Alertas visuais quando preço atinge meta
- ✅ Persistência de dados em JSON
- ✅ Tratamento robusto de erros
- ✅ Retry automático com backoff exponencial
- ✅ Headers apropriados para evitar bloqueios
- ✅ Interface responsiva (mobile + desktop)
- ✅ Deploy pronto para Vercel

### Características Técnicas

- TypeScript 5+
- Next.js 14 com App Router
- Cheerio para parsing de HTML
- Nodemailer para emails
- Recharts para gráficos
- Lucide React para ícones
- Tailwind CSS para estilos
- date-fns para formatação de datas

### Arquitetura

- Scrapers modulares e extensíveis
- API Routes para scraping server-side
- Sistema de notificações singleton
- Storage em arquivos JSON
- Configuração centralizada

## Roadmap

### Futuras Melhorias

- [ ] Suporte a mais lojas (Shopee, AliExpress)
- [ ] Notificações por Telegram/WhatsApp
- [ ] Dashboard administrativo
- [ ] Comparação de preços entre lojas
- [ ] Exportação de dados para CSV/Excel
- [ ] Alertas de tendências (preço subindo/descendo)
- [ ] Sistema de favoritos
- [ ] PWA (Progressive Web App)
- [ ] Modo escuro
- [ ] Scraping com Puppeteer para sites com JavaScript
- [ ] Cache Redis para melhor performance
- [ ] Autenticação de usuários (multi-tenant)
- [ ] API pública documentada
