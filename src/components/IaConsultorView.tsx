import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import type { Procedure, SystemVersion } from '../types/procedure';

interface IaConsultorViewProps {
  procedures: Procedure[];
  activeVersion: SystemVersion;
  onSelectProcedure: (id: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedProcId?: string;
  time: string;
}

export const IaConsultorView: React.FC<IaConsultorViewProps> = ({
  procedures,
  activeVersion,
  onSelectProcedure,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Olá, Leonardo! Eu sou o **Leo**, seu assistente de inteligência e consultor operacional do **Digifarma V10** e **Clássico**.\n\nPergunte-me qualquer dúvida sobre rotinas de balcão, caixa, fechamento cego, entrada de notas XML, controle de lotes ou parametrizações fiscais. Como posso orientar você hoje?',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = 'Entendido. Estou consultando a base de Procedimentos Operacionais Padrão (POP) do Digifarma.';
      let procIdToSuggest: string | undefined;

      const lower = text.toLowerCase();

      if (lower.includes('f7') || lower.includes('tabela') || lower.includes('preço') || lower.includes('bula') || lower.includes('sintoma')) {
        reply =
          'Na versão **Digifarma V10**, a **Tabela F7** foi aprimorada com **Inteligência Artificial**. Agora o balconista pode digitar o sintoma (ex: *dor de garganta*, *azia*) e o sistema apresenta os medicamentos correspondentes, bulas resumidas e similares com suas margens.\n\nRecomendo acessar o procedimento completo para conferir o passo a passo com telas.';
        procIdToSuggest = 'proc-v10-tabela-f7-ia';
      } else if (lower.includes('caixa') || lower.includes('fechamento') || lower.includes('cego') || lower.includes('sangria') || lower.includes('suprimento')) {
        reply =
          'O **Fechamento de Caixa Cego** é um protocolo de segurança essencial. O operador de caixa digita apenas a contagem física das cédulas, moedas e comprovantes de cartão, **sem visualizar o saldo esperado pelo sistema**. O gestor depois confere as eventuais quebras ou sobras na retaguarda.';
        procIdToSuggest = 'proc-v10-caixa-cego-gestor';
      } else if (lower.includes('360') || lower.includes('cliente') || lower.includes('crm') || lower.includes('histórico') || lower.includes('fidelidade')) {
        reply =
          'O **Painel 360º do Cliente** no Digifarma V10 unifica em tela única o histórico de compras, ticket médio, limite de crediário e medicamentos de uso contínuo com previsão de recompra, permitindo um atendimento humanizado e focado em fidelização.';
        procIdToSuggest = 'proc-v10-painel-360-cliente';
      } else if (lower.includes('xml') || lower.includes('nota') || lower.includes('entrada') || lower.includes('lote') || lower.includes('validade') || lower.includes('pvps')) {
        reply =
          'A rotina de **Entrada por XML** permite importar o arquivo da distribuidora com conferência cega e registro obrigatório de **Lote e Validade**. Lembre-se da regra PVPS (*Primeiro que Vence, Primeiro que Sai*) para manter a conformidade BPF.';
        procIdToSuggest = 'proc-classico-entrada-xml';
      } else {
        reply =
          `Analisando sua pergunta sobre "${text}". O Digifarma ${activeVersion === 'v10' ? 'V10' : 'Clássico'} possui procedimentos homologados para esta operação. Consulte o menu lateral ou selecione um dos roteiros em destaque para ver o passo a passo ilustrado.`;
        if (procedures.length > 0) {
          procIdToSuggest = procedures[0].id;
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        suggestedProcId: procIdToSuggest,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClear = () => {
    if (window.confirm('Deseja limpar o histórico da conversa com o Leo?')) {
      setMessages([
        {
          id: 'm-init',
          sender: 'assistant',
          text: 'Conversa reiniciada. O que você gostaria de consultar ou aprender sobre as rotinas da farmácia hoje?',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="ia-view-container">
      <div className="topbar">
        <div>
          <h1 className="dashboard-title head" style={{ margin: 0 }}>
            Leo — Consultor de Procedimentos &amp; IA
          </h1>
          <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Tire dúvidas operacionais, receba orientações de boas práticas e encontre o manual ideal em segundos.
          </div>
        </div>

        <button type="button" className="btn ghost sm" onClick={handleClear}>
          <Trash2 size={14} />
          <span>Limpar conversa</span>
        </button>
      </div>

      <div className="ai-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', marginTop: '1rem' }}>
        {/* Painel Central de Chat */}
        <div className="card ai-chat-card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
          <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            {messages.map((m) => (
              <div key={m.id} className={`ai-message ${m.sender}`}>
                <div className="ai-msg-header">
                  <strong>{m.sender === 'assistant' ? 'Leo' : 'Você'}</strong>
                  <span className="ai-msg-time">{m.time}</span>
                </div>
                <div className="ai-msg-text">
                  {m.text.split('\n\n').map((par, pIdx) => (
                    <p key={pIdx} style={{ margin: '0 0 6px 0' }}>
                      {par.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                {m.suggestedProcId && (
                  <button
                    type="button"
                    className="btn-open-suggested-proc"
                    onClick={() => onSelectProcedure(m.suggestedProcId!)}
                  >
                    <BookOpen size={14} />
                    <span>Abrir Manual Completo (POP)</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="ai-message assistant typing">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-composer" style={{ display: 'flex', gap: '8px', padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--paper-2)' }}>
            <input
              type="text"
              placeholder="Digite sua dúvida sobre rotinas, cadastros ou fechamento..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, padding: '0.65rem 0.95rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <button
              type="button"
              className="btn primary"
              onClick={() => handleSend()}
              disabled={!inputVal.trim() || isTyping}
            >
              <Send size={15} />
              <span>Perguntar</span>
            </button>
          </div>
        </div>

        {/* Painel Lateral com Sugestões Rápidas */}
        <div className="card ai-side" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--red)" />
            <h3 style={{ fontSize: '0.92rem', margin: 0 }}>Consultas Frequentes</h3>
          </div>
          <p className="muted" style={{ fontSize: '0.75rem', margin: '2px 0 8px 0' }}>
            Toque em qualquer pergunta para consultar a regra operacional recomendada:
          </p>

          <button
            type="button"
            className="btn ghost ai-prompt"
            style={{ textAlign: 'left', fontSize: '0.8rem', padding: '0.6rem 0.75rem', lineHeight: 1.35 }}
            onClick={() => handleSend('Como consultar preços, similares e bulas no F7 com IA?')}
          >
            Como usar a Tabela F7 com IA no balcão?
          </button>

          <button
            type="button"
            className="btn ghost ai-prompt"
            style={{ textAlign: 'left', fontSize: '0.8rem', padding: '0.6rem 0.75rem', lineHeight: 1.35 }}
            onClick={() => handleSend('Como funciona o Fechamento de Caixa Cego?')}
          >
            Protocolo de Fechamento de Caixa Cego
          </button>

          <button
            type="button"
            className="btn ghost ai-prompt"
            style={{ textAlign: 'left', fontSize: '0.8rem', padding: '0.6rem 0.75rem', lineHeight: 1.35 }}
            onClick={() => handleSend('Como utilizar o Painel 360 do Cliente para fidelização?')}
          >
            Painel 360º do Cliente e Fidelidade
          </button>

          <button
            type="button"
            className="btn ghost ai-prompt"
            style={{ textAlign: 'left', fontSize: '0.8rem', padding: '0.6rem 0.75rem', lineHeight: 1.35 }}
            onClick={() => handleSend('Como conferir lotes e validades na entrada de notas XML?')}
          >
            Entrada de Notas XML e Regra PVPS
          </button>
        </div>
      </div>
    </div>
  );
};
