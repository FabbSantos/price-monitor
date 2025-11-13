# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o Monitor de Preços!

## Como Contribuir

### 1. Reportar Bugs

Encontrou um bug? Abra uma issue com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Versão do Node.js e sistema operacional

### 2. Sugerir Funcionalidades

Tem uma ideia? Abra uma issue com:
- Descrição detalhada da funcionalidade
- Casos de uso
- Benefícios esperados
- Mockups ou exemplos (se aplicável)

### 3. Adicionar Novos Scrapers

Para adicionar suporte a uma nova loja:

1. Crie um arquivo em `src/lib/scrapers/novaLoja.ts`:

```typescript
import { BaseScraper } from './base';
import * as cheerio from 'cheerio';

export class NovaLojaScraper extends BaseScraper {
  async scrape(url: string) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Adicione os seletores CSS apropriados
      const priceSelectors = [
        '.price-class',
        '[data-price]',
      ];

      let price: number | null = null;

      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const priceText = element.text().trim();
          price = this.extractPrice(priceText);
          if (price && price > 0) break;
        }
      }

      const outOfStock = $('body').text().includes('Indisponível');

      return {
        price,
        available: !outOfStock && price !== null,
        error: price === null ? 'Preço não encontrado' : undefined,
      };
    } catch (error) {
      return {
        price: null,
        available: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}
```

2. Adicione no `src/lib/scrapers/index.ts`:

```typescript
import { NovaLojaScraper } from './novaLoja';

export function getScraperForStore(storeId: string): BaseScraper {
  switch (storeId.toLowerCase()) {
    // ... casos existentes
    case 'novaloja':
      return new NovaLojaScraper();
    // ...
  }
}
```

3. Adicione em `config/products.json`:

```json
{
  "stores": [
    {
      "id": "novaloja",
      "name": "Nova Loja",
      "enabled": true
    }
  ]
}
```

### 4. Melhorar Seletores CSS

Se uma loja mudou a estrutura HTML:

1. Acesse a URL do produto
2. Inspecione o elemento do preço (F12)
3. Identifique classes/IDs únicos
4. Atualize os seletores no scraper correspondente
5. Teste localmente
6. Envie um PR

### 5. Code Style

- Use TypeScript
- Siga as convenções do ESLint
- Adicione comentários em código complexo
- Mantenha funções pequenas e focadas
- Use nomes descritivos

### 6. Testes

Antes de enviar um PR:

```bash
# Rode o projeto localmente
npm run dev

# Teste as funcionalidades afetadas
# Verifique logs no terminal
# Confirme que não há erros

# Build de produção
npm run build
```

### 7. Pull Request

1. Fork o repositório
2. Crie uma branch descritiva:
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ou
   git checkout -b fix/corrigir-bug
   ```

3. Commit com mensagens claras:
   ```bash
   git commit -m "feat: adiciona scraper para Loja X"
   git commit -m "fix: corrige seletor de preço na Amazon"
   ```

4. Push para seu fork:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

5. Abra um Pull Request com:
   - Título claro
   - Descrição do que foi feito
   - Screenshots (se aplicável)
   - Checklist de testes realizados

## Estrutura de Commits

Use conventional commits:

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição de testes
- `chore`: Tarefas de manutenção

Exemplos:
```
feat: adiciona scraper para Shopee
fix: corrige parsing de preço no Mercado Livre
docs: atualiza README com instruções de deploy
refactor: melhora lógica de retry nos scrapers
```

## Dúvidas?

Abra uma issue ou entre em contato!

Obrigado pela contribuição! 🎉
