# 📊 Sistema de Registro Pluvio e Fluviométrico

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=node.js\&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css3\&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge\&logo=vercel\&logoColor=white) ![Status](https://img.shields.io/badge/status-em%20andamento-yellow?style=for-the-badge)


> **Registro diário de marcações pluviométricas e fluviométricas**, formatado para envio às autoridades competentes. Projeto leve, offline-first no frontend e com API serverless em TypeScript para persistência em MongoDB.

---

## ✨ Destaques

* UI simples e responsiva para inserção diária de medições (nível manhã/tarde, precipitação em mm, duração, tipo de chuva, etc.).
* Resumo mensal automático com totais de chuva, dias chuvosos e faixas mínima/máxima do nível do rio.
* Exportação em PDF com tabela detalhada **e** o mesmo resumo mensal pronto para envio oficial.
* API REST (`/api/records`) pronta para deploy serverless (Vercel) ou execução local.
* Validações básicas no frontend e no backend (datas, tipos, faixas de horas/minutos).
* Estrutura pensada para facilitar exportação/relatórios e envio oficial.

---

## 🧭 Tecnologias usadas

* **Node.js** (runtime)
* **TypeScript** (backend em TS)
* **MongoDB** (armazenamento)
* **HTML5**
* **CSS3**
* **JavaScript**
* **Vercel** (deploy opcional)
* **Frontend:** HTML5 / CSS3 / JavaScript (pasta `public/`)

---

## 📁 Estrutura do projeto (resumo)

```
/ (raiz)
├─ api/                 # Endpoints serverless (TypeScript)
│  ├─ records/index.ts  # GET/POST -> /api/records
│  └─ records/[id].ts   # GET/PUT/DELETE -> /api/records/:id
├─ public/              # Frontend estático (formulários, relatório)
│  ├─ index.html        # Formulário principal
│  ├─ relatorio.html    # Página de relatórios/exibição
│  ├─ scripts/          # form.js, relatorio.js
│  └─ styles/           # CSS do projeto
├─ .vercel/             # Configs de deploy (quando presente)
├─ package.json         # scripts e dependências (dotenv, mongodb)
└─ tsconfig.json        # configuração TypeScript
```

---

## 🚀 Como executar localmente

> Pré-requisitos: Node.js (v16+ recomendado), npm/yarn, uma instância do MongoDB (Atlas ou local).

1. Faça o clone ou extraia o projeto.
2. Copie o `.env.example` (se houver) para `.env` e configure `MONGODB_URI` e `MONGODB_DB`.

```bash
# instalar dependências
npm install

# compilar TypeScript (backend)
npm run build

# rodar server (se estiver usando o dist build)
npx vercel dev
```

> Alternativa (Vercel): basta conectar o repositório ao Vercel — as rotas em `api/` são compatíveis com funções serverless.

### Variáveis de ambiente importantes

* `MONGODB_URI` — string de conexão com o MongoDB (obrigatória em local)
* `MONGODB_DB` — (opcional) nome do banco, padrão `pluvio`
* `PORT` — porta local (opcional)

---

## 🧪 Endpoints principais

* `GET /api/records` — lista todos os registros (ordenados por data)
* `POST /api/records` — cria um novo registro (campos: `date`, `nivelManha`, `nivelTarde`, `chuvaMM`, `tipoChuva`, `duracaoHoras`, `duracaoMinutos`, etc.)
* `GET /api/records/:id` — obter um registro
* `PUT /api/records/:id` — atualizar um registro
* `DELETE /api/records/:id` — remover um registro

> O backend faz validação de formatos de data e limites de horas/minutos; verifique mensagens de erro para APIs retornadas em `JSON`.

---

## ✅ Boas práticas e recomendações

* Faça backups regulares da collection `registros` antes de enviar arquivos oficiais às autoridades.
* Use fuso horário e normalização de data consistente (o projeto já normaliza datas para ISO no servidor).
* Para produção, habilite controles de CORS mais restritos e autenticação (token/API key) para proteger endpoints.
* Considere adicionar exportador CSV/PDF na página de relatórios para facilitar envio às autoridades.

---

## ♻️ Próximos passos 

* Exportação CSV dos dados filtrados.
* Autenticação opcional para proteger o painel de edição.

---

## 🧾 Licença



---

## ✍️ Autor

Cláudio Oliveira — [LinkedIn](https://www.linkedin.com/in/claudiohpo)

---

