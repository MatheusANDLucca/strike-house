# 🥊 Strike House - Sistema de Gestão para Academia de Lutas

![Strike House Banner](https://img.shields.io/badge/Status-Produção_Pronto-10B981?style=for-the-badge)
![Node Version](https://img.shields.io/badge/Node.js-20%2B_%7C_22_LTS-339933?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)
![Fastify](https://img.shields.io/badge/Fastify-5.2-000000?style=for-the-badge&logo=fastify)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-Native_WAL_Mode-003B57?style=for-the-badge&logo=sqlite)

O **Strike House** é um sistema completo e de alto desempenho para gestão administrativa, operacional e financeira de academias de artes marciais (Muay Thai, Jiu-Jitsu, Boxe, Karatê, Judô, etc.).

Projetado seguindo rigorosamente os padrões de engenharia de software da indústria, o sistema combina backend assíncrono em Fastify com TypeScript em modo estrito, persistência transacional com SQLite nativo (`node:sqlite` com WAL mode e zero dependências C++ externas) e frontend SPA moderno em React com tema alternável **Noturno (Dark Ops)** e **Diurno (Light)** com a vibrante identidade visual marcial vermelha (*Crimson Combat*).

---

## 📑 Sumário

- [Visão Geral e Funcionalidades](#-visão-geral-e-funcionalidades)
- [Arquitetura e Estrutura de Pastas](#-arquitetura-e-estrutura-de-pastas)
- [Requisitos de Instalação](#-requisitos-de-instalação)
- [Como Executar o Sistema](#-como-executar-o-sistema)
  - [Opção 1: Execução Automática (Windows - 1 Clique)](#opcao-1-execucao-automatica-windows---1-clique)
  - [Opção 2: Execução Manual via Terminal](#opcao-2-execucao-manual-via-terminal)
- [Credenciais de Acesso Inicial](#-credenciais-de-acesso-inicial)
- [Modelos e Regras de Negócio](#-modelos-e-regras-de-negocio)
- [Endpoints da API REST](#-endpoints-da-api-rest)
- [Backup e Segurança](#-backup-e-segurança)
- [Perguntas Frequentes & Resolução de Problemas](#-perguntas-frequentes--resolucao-de-problemas)

---

## ⚡ Visão Geral e Funcionalidades

- **Painel Operacional (Dashboard)**:
  - KPIs em tempo real: Total de alunos ativos, turmas ativas, receita realizada no mês, mensalidades pendentes e cobranças em atraso.
  - Alertas dinâmicos de mensalidades vencidas e atalhos para baixa com 1 clique.
  - Grade visual das turmas ativas e taxa de ocupação da capacidade.

- **Tema Noturno & Diurno (Dark / Light Mode)**:
  - Alternador instantâneo com botão Sol/Lua no Cabeçalho, na Barra Lateral e na tela de Login.
  - Modo Noturno: Estética Dark Tech Ops com superfícies de alto contraste e realces em vermelho carmesim.
  - Modo Diurno: Superfícies limpas, fundo suave (`#F8FAFC`) e cartões brancos com sombras sutis.
  - Persistência automática no `localStorage` e script anti-flicker no carregamento.

- **Gestão de Alunos & Responsáveis Legais**:
  - Cadastro unificado de atletas infantis e adultos com cálculo automático de idade.
  - Vínculo de múltiplos responsáveis legais para alunos menores de idade com validação de parentesco e telefone.
  - Histórico completo de frequência, matrículas e graduações.

- **Grade de Turmas & Modalidades**:
  - Configuração flexível de modalidades de luta.
  - Horários fixos por turma, dias da semana, faixa etária (Infantil, Adulto, Misto) e capacidade máxima.
  - Preço da mensalidade definido por turma e pelo professor responsável.

- **Matrículas & Controle Financeiro de Mensalidades**:
  - Geração pontual ou em lote de cobranças mensais.
  - **Histórico imutável de valores**: Alterações futuras no valor de uma turma nunca alteram mensalidades antigas.
  - Baixa de pagamentos com rastreamento de método (PIX, Dinheiro em Espécie, Cartão de Débito, Cartão de Crédito) e código de comprovante.
  - Status em tempo real: `PENDING`, `PAID`, `OVERDUE`.

- **Linha do Tempo de Graduações**:
  - Registro de progressão de faixas, graus e prajieds com data do exame e mestre examinador.

- **Fluxo de Caixa & Despesas**:
  - Controle de saídas operacionais (aluguel, água, energia, materiais, manutenção).
  - Cálculo consolidado de saldo líquido da academia.

- **Controle de Acesso Baseado em Papéis (RBAC)**:
  - `ADMIN`: Acesso global administrativo, financeiro e gerencial.
  - `PROFESSOR`: Visão estritamente restrita às suas próprias turmas, frequência e alunos sob sua responsabilidade.

---

## 🏛️ Arquitetura e Estrutura de Pastas

```
strike-house/
├── client/                      # Frontend SPA em React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/          # Componentes visuais modulares (Header, Sidebar, StatCard)
│   │   ├── context/             # Provedores de contexto global (AuthContext, ThemeContext)
│   │   ├── services/            # Cliente HTTP desacoplado com interceptor de autenticação (api.ts)
│   │   ├── views/               # Telas do sistema (Dashboard, Alunos, Turmas, Matrículas, etc.)
│   │   ├── types/               # Tipos de domínio e interfaces frontend
│   │   ├── App.tsx              # Roteador central e layout responsivo
│   │   ├── main.tsx             # Ponto de montagem React
│   │   └── index.css            # Folha de estilo global com regras dos temas Noite e Dia
│   ├── index.html               # Entrypoint HTML com injeção de fontes e anti-FOUC
│   ├── tailwind.config.js       # Configuração Tailwind com tokens de cores e sombras
│   └── vite.config.ts           # Configuração de build Vite
├── src/                         # Backend REST API com Fastify 5 + TypeScript
│   ├── config.ts                # Validação centralizada de variáveis de ambiente com Zod
│   ├── database/
│   │   ├── connection.ts        # Conexão nativa node:sqlite em modo WAL e Foreign Keys ativas
│   │   ├── migrations/          # Migrações versionadas rastreadas em _schema_migrations
│   │   │   ├── 001_initial_schema.sql
│   │   │   └── migrator.ts
│   │   └── repositories/        # Repositórios de dados isolados e desacoplados
│   │       ├── billingRepository.ts
│   │       ├── classRepository.ts
│   │       ├── enrollmentRepository.ts
│   │       ├── expenseRepository.ts
│   │       ├── graduationRepository.ts
│   │       ├── studentRepository.ts
│   │       └── userRepository.ts
│   ├── routes/                  # Rotas REST e controladores com validação de payload Zod
│   │   ├── authRoutes.ts
│   │   ├── studentRoutes.ts
│   │   ├── classRoutes.ts
│   │   ├── enrollmentRoutes.ts
│   │   ├── billingRoutes.ts
│   │   ├── graduationRoutes.ts
│   │   ├── expenseRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   └── backupRoutes.ts
│   ├── services/                # Regras de negócio puras (authService com scrypt nativo)
│   ├── types/                   # Tipos e interfaces estritas de banco e requisições
│   └── server.ts                # Inicialização do Fastify, rotas e servidor de arquivos estáticos
├── data/                        # Diretório de persistência do SQLite (.db, .db-wal, .db-shm)
│   └── backups/                 # Backups manuais ou automatizados da base
├── start_strike_house.bat       # Iniciador com 1 clique para Windows
├── COMO_EXECUTAR.txt            # Instruções simplificadas para leigos em texto puro
├── package.json                 # Manifesto de dependências e scripts npm
├── tsconfig.json                # Configuração TypeScript estrita
├── .env.example                 # Modelo de variáveis de ambiente
└── .gitignore                   # Regras de exclusão do Git
```

---

## 💻 Requisitos de Instalação

O Strike House foi projetado com dependências mínimas e zero instaladores complexos de banco de dados:

| Software | Versão Necessária | Observações |
| :--- | :--- | :--- |
| **Node.js** | **20 LTS** ou **22 LTS** (Recomendado) | Inclui o executor nativo `node:sqlite`. Baixar em [nodejs.org](https://nodejs.org/) |
| **NPM** | Versão 9+ | Já vem instalado automaticamente junto com o Node.js |
| **Sistema Operacional** | Windows 10/11, Linux ou macOS | Suporte nativo em todas as plataformas |

> **Nota:** Não é necessário instalar SQLite separadamente, nem Visual Studio C++, nem MySQL/PostgreSQL. Tudo funciona com recursos integrados ao Node.js moderno.

---

## 🚀 Como Executar o Sistema

### Opção 1: Execução Automática (Windows - 1 Clique)

1. Dê um duplo clique no arquivo:
   ```cmd
   start_strike_house.bat
   ```
2. O script detecta o Node.js, instala dependências se for a primeira execução, compila o sistema e abre automaticamente seu navegador em `http://localhost:3000`.

---

### Opção 2: Execução Manual via Terminal

1. **Clone ou baixe o repositório:**
   ```bash
   git clone https://github.com/MatheusANDLucca/strike-house.git
   cd strike-house
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   # Windows (CMD / PowerShell):
   copy .env.example .env

   # Linux / macOS:
   cp .env.example .env
   ```

4. **Compile o projeto completo:**
   ```bash
   npm run build
   ```

5. **Inicie o servidor:**
   ```bash
   npm start
   ```

6. **Acesse no seu navegador:**
   👉 **`http://localhost:3000`**

---

## 🔑 Credenciais de Acesso Inicial

Ao iniciar pela primeira vez, o banco de dados é automaticamente inicializado com o Administrador padrão:

- **E-mail:** `admin@strikehouse.com`
- **Senha:** `admin123`
- **Perfil:** Administrador (Acesso Irrestrito)

*Dica: Na tela de login existe um botão de atalho ("Usar") para preenchimento rápido em modo de teste.*

---

## 📋 Endpoints Principais da API REST

| Método | Endpoint | Protegido | Descrição |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Não | Verificação de integridade e status da conexão SQLite |
| `POST` | `/api/auth/login` | Não | Autenticação com e-mail/senha e geração de token |
| `GET` | `/api/auth/me` | Sim | Dados do usuário autenticado na sessão |
| `GET` | `/api/dashboard/stats` | Sim | Métricas consolidadas, receita e inadimplência |
| `GET` | `/api/students` | Sim | Listagem de alunos com busca e filtros |
| `POST` | `/api/students` | Sim | Cadastro de novo aluno (infantil ou adulto) |
| `POST` | `/api/students/:id/guardians` | Sim | Vínculo de responsável legal para atleta |
| `GET` | `/api/classes` | Sim | Grade de turmas e horários |
| `POST` | `/api/classes` | Sim (Admin) | Criação de turma com valor de mensalidade |
| `GET` | `/api/enrollments` | Sim | Listagem de matrículas ativas |
| `POST` | `/api/enrollments` | Sim | Efetivação de matrícula e vencimento |
| `GET` | `/api/billing` | Sim | Consulta de cobranças e mensalidades |
| `POST` | `/api/billing/batch` | Sim (Admin) | Geração em lote de mensalidades por competência |
| `POST` | `/api/billing/:id/pay` | Sim | Baixa e liquidação atômica de mensalidade |
| `GET` | `/api/graduations` | Sim | Linha do tempo de graduações e faixas |
| `POST` | `/api/graduations` | Sim | Lançamento de nova graduação |
| `GET` | `/api/expenses` | Sim (Admin) | Consulta de despesas operacionais |
| `POST` | `/api/expenses` | Sim (Admin) | Lançamento de despesa |
| `GET` | `/api/backup` | Sim (Admin) | Download de segurança da base SQLite com checkpoint WAL |

---

## 🛡️ Backup e Segurança

1. **Pelo Painel (Recomendado)**:
   - Conectado como Administrador, clique no botão **"Backup do Banco"** na barra lateral. O sistema executará internamente o comando `PRAGMA wal_checkpoint(TRUNCATE)` garantindo que todas as transações em memória e do arquivo WAL sejam sincronizadas no disco antes de baixar o arquivo `.db` imediatamente.
2. **Backup Manual em Arquivo**:
   - Basta copiar o arquivo localizado em `strike-house/data/strike_house.db`.

---

## ❓ Perguntas Frequentes & Resolução de Problemas

- **Aparece erro de "porta 3000 em uso"**:
  Altere a porta no arquivo `.env` para `PORT=3001` e acesse `http://localhost:3001`.
- **Como alterar a cor do tema**:
  Utilize o botão de alternância **Dia / Noite** no topo da tela ou na barra lateral.
- **Como resetar a senha de admin**:
  Se necessário recriar a base do zero para testes, basta apagar o arquivo `strike-house/data/strike_house.db` e reiniciar o sistema; o banco será migrado e o admin recriado automaticamente.

---

### Licença e Direitos
Desenvolvido para **Strike House**. Todos os direitos reservados.
