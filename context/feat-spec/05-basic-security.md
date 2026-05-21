# 05. Základní Bezpečnost (Basic Security)

Tento dokument definuje základní bezpečnostní opatření pro aplikaci **Training Planner**, zaměřená na ochranu dodavatelského řetězce (supply chain) a zabezpečení komunikace mezi klientem a serverem.

---

## 1. Ochrana dodavatelského řetězce (NPM Security)

Vzhledem k rostoucímu počtu útoků na NPM registr (malicious packages publikované a stažené během několika hodin) zavádíme striktní pravidlo pro instalaci balíčků.

### **Pravidlo 3 dnů (3-Day Age Rule)**
Do projektu smí být nainstalovány pouze verze balíčků, které jsou publikovány v NPM registru **minimálně 3 dny**.

### **Technická implementace:**
*   **Skript pro ověření**: Bude vytvořen skript `scripts/security/verify-package-age.mjs`, který:
    1.  Přečte změny v `package.json` nebo `package-lock.json`.
    2.  Pro každý nový nebo aktualizovaný balíček zavolá `npm view <package>@<version> time.<version>`.
    3.  Vypočítá stáří verze. Pokud je < 72 hodin, instalace selže s chybovým hlášením.
*   **Integrace**:
    *   **Pre-install hook**: Skript bude spouštěn automaticky před instalací (pokud to nástroj dovoluje) nebo jako součást CI/CD pipeline.
    *   **NPM Config**: Do souboru `.npmrc` (nebo `pnpm-workspace.yaml`) přidáme informativní komentář nebo vlastní proměnnou `min-package-age=3d`, kterou bude skript respektovat.

---

## 2. Zabezpečení komunikace (CORS & CSP)

Aplikace musí být chráněna proti útokům typu XSS (Cross-Site Scripting) a neautorizovaným požadavkům z jiných domén.

### **CORS (Cross-Origin Resource Sharing)**
Konfigurace přístupu k serverovým funkcím (Server Functions).

*   **Vývoj (Development)**:
    *   Povolit pouze `http://localhost:3000` a `http://127.0.0.1:3000`.
    *   Povolené metody: `GET, POST, OPTIONS`.
*   **Produkce (Production)**:
    *   Striktní whitelist produkční domény (např. `https://training-planner.tld`).
    *   Zakázat všechny ostatní originální zdroje.

### **CSP (Content Security Policy)**
Nastavení hlaviček pro omezení zdrojů, ze kterých může prohlížeč načítat obsah.

*   **Základní politika**:
    *   `default-src 'self'`: Veškerý obsah musí pocházet ze stejné domény.
    *   `script-src 'self' 'unsafe-inline'`: Povolit vlastní skripty (TanStack Start vyžaduje inline skripty pro hydrataci, v budoucnu zvážit `nonces`).
    *   `style-src 'self' 'unsafe-inline'`: Povolit styly (Tailwind a CSS Modules).
    *   `connect-src 'self' https://generativelanguage.googleapis.com`: Povolit API volání na vlastní server a na Google Gemini API.
    *   `img-src 'self' data: blob:`: Povolit obrázky ze stejné domény a datové URI (pro ikony/avatary).
    *   `frame-ancestors 'none'`: Ochrana proti Clickjackingu (aplikace nesmí být vložena do iframe).

### **Implementace v TanStack Start / Vinxi**:
Hlavičky budou nastaveny v rámci serverového middleware nebo v konfiguraci `ssr.tsx`:

```typescript
// Příklad zamýšlené konfigurace hlaviček
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://generativelanguage.googleapis.com;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

---

## 3. Akční plán pro MVP

1.  `[ ]` Vytvořit verifikační skript `verify-package-age.mjs`.
2.  `[ ]` Přidat kontrolu stáří balíčků do CI (GitHub Actions / Local pre-commit).
3.  `[ ]` Konfigurovat Vinxi middleware pro injekci bezpečnostních hlaviček (CSP, X-Frame-Options).
4.  `[ ]` Ověřit funkčnost CSP při volání Gemini AI SDK (zda neblokuje streamování odpovědí).
