# 🔧 Corrigindo Preços Errados

Se o scraper está pegando preços de TVs aleatórias, siga este guia.

## 🎯 Problema Comum

**Sintoma**: Configurou a URL da TCL C755, mas o preço que aparece é de outra TV.

**Causa**: URL de **listagem/busca** em vez de **produto específico**.

---

## ✅ Solução Passo a Passo

### 1️⃣ Verifique se a URL está correta

#### ❌ URL ERRADA (Listagem/Busca)

```
https://www.amazon.com.br/s?k=TCL+C755+65
https://www.casasbahia.com.br/tv-c755-65/b
https://www.magazineluiza.com.br/busca/tcl+c755+65/
https://lista.mercadolivre.com.br/tcl-c755-65
```

👆 Essas são páginas de **busca**. O scraper vai pegar o **primeiro resultado** (que pode ser qualquer TV!).

#### ✅ URL CERTA (Produto Específico)

```
https://www.amazon.com.br/dp/B0CXXXXX
https://www.casasbahia.com.br/smart-tv-65-tcl/p/1234567
https://www.magazineluiza.com.br/smart-tv-tcl/p/234567890/
https://produto.mercadolivre.com.br/MLB-3456789-tv-tcl-c755
```

👆 Essas são páginas **específicas** de um produto.

---

### 2️⃣ Como Pegar a URL Certa

#### Amazon

1. Acesse amazon.com.br
2. Busque: **"TCL C755 65"**
3. **CLIQUE no produto** desejado (não em "Visitar loja")
4. Na página do produto, copie a URL
5. **Dica:** Pode encurtar para apenas `/dp/CODIGO`:
   ```
   https://www.amazon.com.br/dp/B0CXXXXX
   ```

#### Casas Bahia

1. Acesse casasbahia.com.br
2. Busque: **"TCL C755 65"**
3. **CLIQUE no produto** específico
4. Copie a URL completa:
   ```
   https://www.casasbahia.com.br/smart-tv-65-tcl-c755/p/1234567
   ```

#### Magazine Luiza

1. Acesse magazineluiza.com.br
2. Busque: **"TCL C755 65"**
3. **CLIQUE no produto**
4. Copie a URL:
   ```
   https://www.magazineluiza.com.br/smart-tv-tcl-c755/p/234567890/
   ```

#### Mercado Livre

1. Acesse mercadolivre.com.br
2. Busque: **"TCL C755 65"**
3. **CLIQUE no produto** (não em "visitar loja")
4. Copie a URL:
   ```
   https://produto.mercadolivre.com.br/MLB-3456789-tv-tcl
   ```

---

### 3️⃣ Use o Script de Debug

Execute para **ver exatamente** o que o scraper está capturando:

```bash
npm run debug:scraper "SUA_URL_AQUI"
```

**Exemplo:**

```bash
npm run debug:scraper "https://www.amazon.com.br/dp/B0CXXXXX"
```

**Saída esperada:**

```
🔍 DEBUG DE SCRAPING

📍 URL: https://www.amazon.com.br/dp/B0CXXXXX

⏳ Fazendo requisição HTTP...

✅ Página carregada (234567 bytes)
📊 Status: 200

💾 HTML salvo em: debug-page.html

🏪 Loja detectada: amazon

🎯 Testando 6 seletores...

✅ Seletor 1: ".a-price-whole" → 1 elementos encontrados
   [1] Texto: "3.899"
       HTML: <span class="a-price-whole">3.899</span>...

💰 Preços encontrados no HTML (10 de 15):
   1. R$ 3.899,99
   2. R$ 200,00
   3. R$ 4.199,99
   ...

📋 Análise da página:

✅ Página de Produto: 3 indicadores
❌ Página de Listagem: 0 indicadores

📝 RESUMO

✅ Seletores funcionando!
💡 Se os preços estão errados, verifique:
   - A URL é do produto correto?
   - O seletor está pegando o elemento certo?
```

---

### 4️⃣ Análise dos Resultados

#### Caso 1: "Página de Listagem: X indicadores"

**Problema:** URL é de busca/listagem, não de produto.

**Solução:** Pegue a URL correta (passo 2).

#### Caso 2: Múltiplos preços encontrados

**Problema:** Página tem vários preços (frete, parcelamento, etc).

**Solução:** Verifique qual preço está sendo capturado:

```bash
# Abra o HTML salvo
start debug-page.html  # Windows
open debug-page.html   # Mac
xdg-open debug-page.html  # Linux
```

No browser:
1. **F12** (DevTools)
2. **Inspecione o preço** principal
3. **Copie a classe/ID** do elemento
4. **Atualize o scraper** (passo 5)

#### Caso 3: "Nenhum seletor encontrou resultados"

**Problema:** Site mudou a estrutura HTML.

**Solução:** Atualize os seletores (passo 5).

---

### 5️⃣ Atualize os Seletores (se necessário)

Se o debug mostrou que precisa atualizar seletores:

#### Amazon - [src/lib/scrapers/amazon.ts:18-25](src/lib/scrapers/amazon.ts#L18-L25)

```typescript
const priceSelectors = [
  '.novo-seletor-aqui',  // ← ADICIONE aqui
  '.a-price-whole',
  '#priceblock_ourprice',
  // ...
];
```

#### Casas Bahia - [src/lib/scrapers/casasbahia.ts:18-23](src/lib/scrapers/casasbahia.ts#L18-L23)

```typescript
const priceSelectors = [
  '.novo-seletor',  // ← ADICIONE aqui
  '[data-testid="price-value"]',
  // ...
];
```

#### Magazine Luiza - [src/lib/scrapers/magazineluiza.ts:18-23](src/lib/scrapers/magazineluiza.ts#L18-L23)

```typescript
const priceSelectors = [
  '.novo-seletor',  // ← ADICIONE aqui
  '[data-testid="price-value"]',
  // ...
];
```

#### Mercado Livre - [src/lib/scrapers/mercadolivre.ts:18-23](src/lib/scrapers/mercadolivre.ts#L18-L23)

```typescript
const priceSelectors = [
  '.novo-seletor',  // ← ADICIONE aqui
  '.price-tag-fraction',
  // ...
];
```

---

## 🧪 Testando a Correção

Após atualizar as URLs no [config/products.json](config/products.json):

```bash
# 1. Rode o servidor
npm run dev

# 2. Na interface, clique "Atualizar"

# 3. Verifique os preços nos cards
```

**Resultado esperado:**
- ✅ Preço correto aparece
- ✅ Nome do produto aparece
- ✅ Botão "Ver produto" vai para URL certa

---

## 🔍 Exemplo Real

### Problema:

```json
{
  "urls": {
    "amazon": "https://www.amazon.com.br/s?k=TCL+C755+65"
  }
}
```

**Resultado:** Pega o primeiro resultado da busca (pode ser qualquer TV).

### Solução:

1. Acesse a URL
2. Clique na TCL C755 desejada
3. Copie a nova URL: `https://www.amazon.com.br/dp/B0D123456`
4. Atualize:

```json
{
  "urls": {
    "amazon": "https://www.amazon.com.br/dp/B0D123456"
  }
}
```

5. Teste:

```bash
npm run debug:scraper "https://www.amazon.com.br/dp/B0D123456"
```

6. Verifique a saída:

```
✅ Seletor 1: ".a-price-whole" → 1 elementos encontrados
   [1] Texto: "3899"

📋 Análise da página:
✅ Página de Produto: 3 indicadores
```

**Pronto!** Agora está pegando o produto certo! ✅

---

## 🆘 Ainda não funciona?

### Possível causa: Site usa JavaScript para carregar preços

Alguns sites (como Mercado Livre) carregam preços via JavaScript.

**Sintomas:**
- debug-page.html não mostra o preço
- Seletores não encontram nada
- HTML salvo está "vazio"

**Solução:** Use Puppeteer (navegador headless)

Crie um novo scraper com Puppeteer:

```bash
npm install puppeteer
```

```typescript
// src/lib/scrapers/mercadolivre-puppeteer.ts
import puppeteer from 'puppeteer';
import { BaseScraper } from './base';

export class MercadoLivrePuppeteerScraper extends BaseScraper {
  async scrape(url: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });

    const price = await page.evaluate(() => {
      const element = document.querySelector('.price-tag-fraction');
      return element ? parseFloat(element.textContent.replace(/[^\d]/g, '')) : null;
    });

    await browser.close();

    return {
      price,
      available: price !== null,
    };
  }
}
```

**Desvantagem:** Mais lento (3-5 segundos por produto).

---

## 📝 Checklist Final

Antes de considerar "resolvido":

- [ ] URL é de produto específico (não de busca)?
- [ ] `debug:scraper` mostra "Página de Produto"?
- [ ] Seletores estão encontrando o preço?
- [ ] Preço encontrado é o correto?
- [ ] Testou na interface (`npm run dev` → Atualizar)?
- [ ] Preço aparece correto nos cards?

**Todos ✅? Problema resolvido!** 🎉

---

## 💡 Dicas Pro

### 1. Teste uma loja de cada vez

```json
{
  "stores": [
    { "id": "amazon", "enabled": true },
    { "id": "casasbahia", "enabled": false },
    { "id": "magazineluiza", "enabled": false },
    { "id": "mercadolivre", "enabled": false }
  ]
}
```

### 2. Use URLs encurtadas

```
❌ https://www.amazon.com.br/Smart-TV-TCL-65-polegadas/dp/B0D123456/ref=sr_1_1?keywords=tcl
✅ https://www.amazon.com.br/dp/B0D123456
```

Ambas funcionam, mas a segunda é mais limpa.

### 3. Salve URLs testadas

Crie um arquivo `urls-testadas.txt`:

```
# TCL C755 65"
Amazon: https://www.amazon.com.br/dp/B0D123456 ✅
Casas Bahia: https://www.casasbahia.com.br/.../p/123 ✅
Magazine Luiza: https://www.magazineluiza.com.br/.../p/456 ✅
```

---

## 🔗 Recursos

- **Script de debug:** `npm run debug:scraper <URL>`
- **Scrapers:** [src/lib/scrapers/](src/lib/scrapers/)
- **Config:** [config/products.json](config/products.json)

---

**Resumo:** Use URLs de **produto específico**, não de **busca/listagem**! 🎯
