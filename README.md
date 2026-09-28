# Digifarma — Repositório de Procedimentos Operacionais (Base de Manuais SOP)

Sistema completo para criação, consulta e documentação de **Procedimentos Operacionais Padrão (POP / SOP)** com suporte a múltiplos manuais, blocos sequenciais flexíveis (títulos, subtítulos, instruções, imagens com zoom, alertas e checklists interativos) e integração direta com o **Supabase** (Banco de dados e Storage de fotos).

---

## 🚀 Principais Funcionalidades

1. **Estrutura Modular Passo a Passo**:
   - Cada procedimento pode ter cabeçalho completo: Título, Subtítulo/Objetivo, Categoria/Setor, Autor/Responsável e Tags.
   - **Blocos Dinâmicos**: crie no seu fluxo exato:
     - 📌 **Subtítulo / Seção**: delimita novos passos do procedimento.
     - 📝 **Texto Explicativo**: instruções detalhadas para o operador.
     - 📷 **Imagem / Diagrama**: upload direto para o Supabase Storage (`procedure-media`) com preview, legenda descritiva e lightbox com zoom ao clicar.
     - ⚠️ **Alertas / Callouts**: destaque visual em cores para *Atenção*, *Informação*, *Dica/Sucesso* ou *Perigo/Proibição*.
     - ✅ **Checklist / Passos Interativos**: caixas de marcação que os operadores podem ticar enquanto executam a tarefa.
   - **Reordenação Flexível**: suba (▲) ou desça (▼) blocos, duplique ou exclua qualquer etapa a qualquer momento.

2. **Nuvem Supabase + Fallback Offline / Local**:
   - Funciona **localmente no seu computador** (não precisa publicar na web).
   - Comunica-se com o Supabase para persistir procedimentos e fotos na nuvem.
   - Se ainda não tiver configurado o Supabase, o sistema funciona perfeitamente em modo local (com armazenamento seguro no navegador e fotos em Base64), sem travar!

3. **Experiência de Uso (Design Moderno)**:
   - **Dark Mode / Light Mode**: alternância instantânea de tema no topo.
   - **Índice Automático (Table of Contents)**: navegação rápida entre os passos do procedimento.
   - **Impressão e Exportação para PDF**: layout formatado via CSS Print especialmente para impressão limpa de manuais físicos POP.
   - **Pesquisa Instantânea e Filtro por Categoria / Favoritos**: encontre qualquer instrução em milissegundos.

---

## 🛠️ Como Conectar ao seu Supabase

### 1. Criar Tabelas e Storage no Supabase
1. Acesse o painel do seu projeto no [Supabase](https://app.supabase.com).
2. Vá em **SQL Editor** (no menu lateral esquerdo).
3. Abra e execute o arquivo `supabase-schema.sql` (disponível na raiz deste projeto) ou clique no botão **"Supabase (Configurar)"** dentro do site e copie o SQL com um clique.

### 2. Configurar as Chaves no Site
Você pode configurar de duas formas simples:

- **Forma 1 (Pelo próprio site)**:
  - Abra o site e clique no botão **"Supabase (Configurar)"** no canto superior direito.
  - Cole sua **Project URL** e a **Anon Public Key**.
  - Clique em **"Salvar e Conectar"**. O sistema testará a conexão na hora!

- **Forma 2 (Arquivo `.env`)**:
  - Crie um arquivo `.env` na raiz do projeto com suas credenciais:
    ```env
    VITE_SUPABASE_URL=https://seu-projeto.supabase.co
    VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
    VITE_SUPABASE_BUCKET=procedure-media
    ```

---

## 💻 Como Rodar o Site no seu Computador

O servidor já está configurado. Para iniciar a qualquer momento:

```powershell
# 1. Entrar na pasta do projeto
cd "c:\Leonardo\Meus Projetos\Digifarma\Repositório"

# 2. Iniciar o servidor local
npm run dev
```

Abra seu navegador em: **`http://localhost:5173/`**
