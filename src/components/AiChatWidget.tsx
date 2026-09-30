import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import type { Procedure, SystemVersion } from '../types/procedure';

interface AiChatWidgetProps {
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

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  procedures,
  activeVersion,
  onSelectProcedure,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-1',
        sender: 'assistant',
        text: 'Olá! Sou o **Leo**, seu assistente de procedimentos operacionais e conformidade do **Digifarma V10** e **Clássico**. Como posso ajudar no seu atendimento ou rotina hoje?',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputVal).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Resposta inteligente baseada nos procedimentos reais do Digifarma
    setTimeout(() => {
      const qLower = q.toLowerCase();
      let reply = '';
      let procMatch: Procedure | undefined;

      if (qLower.includes('f7') || qLower.includes('preço') || qLower.includes('sintoma') || qLower.includes('bula')) {
        procMatch = procedures.find((p) => p.id === 'proc-v10-tabela-f7-ia' || p.tags.includes('F7'));
        reply = `Na **Tabela de Preços F7 Inteligente** do Digifarma V10:\n\n• Pressione **F7** no balcão para abrir os preços com fotos, última compra e tabloide.\n• Se o cliente não souber o medicamento, use **Ctrl + Enter** para pesquisar por sintoma (IA).\n• Pressione **Ctrl + B** para ler a bula completa da Anvisa instantaneamente.`;
      } else if (qLower.includes('360') || qLower.includes('cliente') || qLower.includes('fidelidade') || qLower.includes('cashback')) {
        procMatch = procedures.find((p) => p.id === 'proc-v10-painel-360-cliente' || p.tags.includes('Clientes'));
        reply = `No **Painel 360º do Cliente**:\n\n• Use o atalho **Ctrl + Espaço** (Busca Global) e digite o nome ou CPF.\n• O saldo de pontos e cashback é exibido logo abaixo da foto.\n• Verifique o histórico de compras e o perfil por estrelas (1 a 5 estrelas) para conceder benefícios.`;
      } else if (qLower.includes('caixa') || qLower.includes('cego') || qLower.includes('fechamento') || qLower.includes('sangria')) {
        procMatch = procedures.find((p) => p.id === 'proc-v10-caixa-cego-gestor' || p.tags.includes('Caixa Cego'));
        reply = `No **Fechamento de Caixa Cego**:\n\n• O operador de caixa faz a contagem física das cédulas e digita os valores apurados sem ver a diferença do sistema.\n• Somente o gestor com senha master acessa a conciliação e homologa eventuais sobras ou faltas, garantindo prevenção de perdas.`;
      } else if (qLower.includes('xml') || qLower.includes('nota') || qLower.includes('lote') || qLower.includes('recebimento')) {
        procMatch = procedures.find((p) => p.id.includes('xml') || p.tags.includes('XML'));
        reply = `Na **Entrada de Nota por Importação de XML**:\n\n• Acesse Estoque > Entrada de Notas e tecle **F5**.\n• Importe a chave de 44 dígitos da DANFE.\n• Faça a conferência cega abrindo as caixas na triagem e guarde usando o padrão **PVPS** (Primeiro que Vence, Primeiro que Sai).`;
      } else if (qLower.includes('controlado') || qLower.includes('portaria 344') || qLower.includes('sngpc') || qLower.includes('receita')) {
        reply = `Para **Medicamentos Controlados (SNGPC - Portaria 344/98)**:\n\n• Marque a opção "Controlado SNGPC" no cadastro do produto.\n• O PDV exigirá obrigatoriamente a retenção de receita médica (notificação A, B ou C), número do CRM do médico prescritor e dados do paciente.`;
      } else {
        reply = `Entendido! Localizei informações relevantes na base de procedimentos do Digifarma.\n\nVocê pode consultar os passos detalhados na lista de procedimentos ou usar os atalhos rápidos de navegação.`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        suggestedProcId: procMatch?.id,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearChat = () => {
    if (window.confirm('Deseja limpar a conversa com o Leo?')) {
      setMessages([
        {
          id: 'msg-init',
          sender: 'assistant',
          text: 'Conversa reiniciada. O que você gostaria de consultar sobre os procedimentos e normas da farmácia?',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <>
      {/* Botão Flutuante (FAB) Estilo LH Group */}
      <button
        type="button"
        className="ai-fab-button no-print"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Falar com o Leo • Consultor Farmacêutico IA"
      >
        <Sparkles size={16} />
        <span>Leo • IA</span>
      </button>

      {/* Janela Mini Chat */}
      {isOpen && (
        <div className="ai-mini-window no-print">
          {/* Header da Janela */}
          <div className="ai-mini-header">
            <div className="mini-header-title">
              <Sparkles size={15} color="var(--red)" />
              <h4>Leo • Consultor {activeVersion === 'v10' ? 'V10' : 'Clássico'}</h4>
              <span className="mini-status" />
            </div>
            <div className="mini-header-actions">
              <button
                type="button"
                className="btn-icon-mini"
                onClick={handleClearChat}
                title="Limpar conversa"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                className="btn-icon-mini"
                onClick={() => setIsOpen(false)}
                title="Fechar janela"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Sugestões de Perguntas Rápidas */}
          <div className="ai-mini-prompts-bar">
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleSend('Como consultar preços e bulas no F7?')}
            >
              F7 com IA
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleSend('Como funciona o Painel 360 do Cliente?')}
            >
              Cliente 360º
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleSend('Como fazer fechamento de caixa cego?')}
            >
              Caixa Cego
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => handleSend('Como importar XML e conferir lotes?')}
            >
              Entrada XML
            </button>
          </div>

          {/* Corpo de Mensagens */}
          <div className="ai-mini-body">
            {messages.map((m) => (
              <div key={m.id} className={`ai-message ${m.sender}`}>
                {m.sender === 'assistant' && (
                  <div className="ai-msg-header">
                    <strong>Leo</strong>
                    <span className="ai-msg-time">{m.time}</span>
                  </div>
                )}
                <div className="ai-msg-text">
                  {m.text.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} style={{ margin: '0 0 6px 0' }}>
                      {paragraph.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                {m.suggestedProcId && (
                  <button
                    type="button"
                    className="btn-open-suggested-proc"
                    onClick={() => {
                      onSelectProcedure(m.suggestedProcId!);
                      setIsOpen(false);
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Abrir Manual Completo (POP)</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="ai-message assistant typing">
                <strong>Leo</strong>
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Rodapé / Input de Envio */}
          <div className="ai-mini-footer">
            <input
              type="text"
              className="ai-mini-input"
              placeholder="Pergunte ao Leo sobre procedimentos..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              type="button"
              className="btn-mini-send"
              onClick={() => handleSend()}
              disabled={!inputVal.trim() || isTyping}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
