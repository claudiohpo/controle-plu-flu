# 📊 Sistema de Registro Pluvio e Fluviométrico

![Node.js](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg) ![TypeScript](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg) ![MongoDB](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg) ![HTML5](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg) ![CSS3](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg) ![JavaScript](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg) ![Vercel](https://assets.vercel.com/image/upload/q_auto/front/favicon/vercel/180x180.png)

> **Registro diário de marcações pluviométricas e fluviométricas**, formatado para envio às autoridades competentes. Projeto leve, offline-first no frontend e com API serverless em TypeScript para persistência em MongoDB.

---

## ✨ Destaques

* UI simples e responsiva para inserção diária de medições (nível manhã/tarde, precipitação em mm, duração, tipo de chuva, etc.).
* API REST (`/api/records`) pronta para deploy serverless (Vercel) ou execução local.
* Validações básicas no frontend e no backend (datas, tipos, faixas de horas/minutos).
* Estrutura pensada para facilitar exportação/relatórios e envio oficial.

---

## 🧭 Tecnologias usadas

* ![Node.js](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg) **Node.js** (runtime)
* ![TypeScript](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg) **TypeScript** (backend em TS)
* ![MongoDB](https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg) **MongoDB** (armazenamento)
* ![Vercel](https://assets.vercel.com/image/upload/q_auto/front/favicon/vercel/180x180.png) **Vercel** (deploy/desdobramento serverless, opcional)
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
npm start
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

* Geração automática de PDF do relatório diário pronto para assinatura e envio.

---

## 🧾 Licença



---

## ✍️ Autor

Cláudio Oliveira — [LinkedIn](https://www.linkedin.com/in/claudiohpo)

---

