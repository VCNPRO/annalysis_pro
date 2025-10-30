# 🎬 Annalysis Pro

Plataforma professional d'anàlisi de vídeo impulsada per Intel·ligència Artificial (Google Gemini 2.0 Flash).

## ✨ Característiques

- 🎥 **Anàlisi multimodal de vídeo** amb Google Gemini 2.0 Flash
- 🔍 **Detecció intel·ligent** d'objectes, persones, text, accions i més
- 📊 **Gràfics de confiança interactius** amb Recharts
- ⚖️ **Comparació de vídeos** costat a costat
- 🔎 **Cerca avançada** dins de les anàlisis
- 📥 **Exportació professional** en JSON, TXT i PDF
- 📁 **Gestió de projectes** amb organització per carpetes
- ⚡ **Cache intel·ligent** (30 dies) per anàlisis instantànies
- ⏱️ **Timeline interactiva** amb thumbnails en temps real
- 🌍 **7 idiomes d'anàlisi**: Català, Español, English, Français, Deutsch, Italiano, Português
- ⚙️ **Configuració avançada** amb gestió de cache i emmagatzematge

## 🚀 Desplegament a Vercel

### Opció 1: Des de la interfície web (RECOMANAT)

1. **Registra't o inicia sessió a Vercel:**
   - Ves a [vercel.com](https://vercel.com)
   - Inicia sessió amb GitHub

2. **Importa el projecte:**
   - Fes clic a "Add New..." → "Project"
   - Selecciona el repositori `annalysis_pro`
   - Fes clic a "Import"

3. **Configura el projecte:**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Desplega:**
   - Fes clic a "Deploy"
   - Espera 2-3 minuts
   - Rebràs un enllaç tipus: `https://annalysis-pro.vercel.app`

### Opció 2: Des de la línia de comandes

1. **Instal·la Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Inicia sessió:**
   ```bash
   vercel login
   ```

3. **Desplega:**
   ```bash
   vercel
   ```

4. **Desplega a producció:**
   ```bash
   vercel --prod
   ```

## 🔑 Configuració de la clau API

Després del desplegament:

1. Obre l'aplicació desplegada
2. Fes clic a "Clau API" a la capçalera
3. Introdueix la teva clau API de Google Gemini
4. Fes clic a "Desar"

**Obtenir clau API gratuïta:**
- Ves a [Google AI Studio](https://aistudio.google.com/)
- Inicia sessió amb Google
- Fes clic a "Get API Key"
- Copia la clau

## 💰 Costos

- **Aplicació**: GRATUÏT (Vercel té pla gratuït generós)
- **Google Gemini API**:
  - Tier gratuït: 1.500 sol·licituds/dia
  - Pay-as-you-go: ~$0.075 per 1M tokens input, $0.30 per 1M output
  - Cost estimat: €0-25/mes segons ús

## 🛠️ Desenvolupament local

```bash
# Clonar el repositori
git clone https://github.com/VCNPRO/annalysis_pro.git
cd annalysis_pro

# Instal·lar dependències
npm install

# Executar en mode desenvolupament
npm run dev

# Build per producció
npm run build

# Preview del build
npm run preview
```

## 📦 Stack tecnològic

- **Frontend**: React 19.2.0 + TypeScript
- **Build**: Vite 6.2.0
- **IA**: Google Gemini 2.0 Flash (API)
- **Gràfics**: Recharts 3.3.0
- **Markdown**: react-markdown + remark-gfm
- **Fonts**: @fontsource/orbitron
- **Emmagatzematge**: LocalStorage (client-side)
- **Hosting**: Vercel

## 📄 Llicència

MIT License - Lliure per ús personal i comercial

## 🤝 Contribucions

Les contribucions són benvingudes! Si us plau, obre un issue o pull request.

## 📞 Contacte

- GitHub: [VCNPRO/annalysis_pro](https://github.com/VCNPRO/annalysis_pro)
- Issues: [Reportar problema](https://github.com/VCNPRO/annalysis_pro/issues)

---

**Impulsat per Google Gemini AI** ✨
