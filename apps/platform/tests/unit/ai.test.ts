import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, detectHandoff, historyToMessages, isWithinBusinessHours, parseAssistantOutput } from '@/server/ai/agent';
import { chunkText, cosine, keywordScore, tokenize } from '@/server/ai/rag';

describe('RAG', () => {
  it('divide textos longos em trechos com sobreposição', () => {
    const text = Array.from({ length: 30 }, (_, i) => `Parágrafo ${i} com informações sobre a pousada e seus serviços.`).join('\n\n');
    const chunks = chunkText(text, 300, 50);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.length <= 450)).toBe(true);
    expect(chunkText('')).toEqual([]);
  });

  it('pontua relevância por palavras-chave (sem acento e stopwords)', () => {
    expect(tokenize('Horário de CHECK-IN às 14h')).toEqual(expect.arrayContaining(['horario', 'check', '14h']));
    const pets = keywordScore('vocês aceitam animais de estimação?', 'Aceitamos animais de estimação de pequeno porte.');
    const other = keywordScore('vocês aceitam animais de estimação?', 'Check-in a partir das 14h.');
    expect(pets).toBeGreaterThan(other);
  });

  it('similaridade de cosseno', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosine([], [])).toBe(0);
  });
});

describe('Agente de IA', () => {
  it('interpreta saída JSON e cai para texto puro quando necessário', () => {
    const out = parseAssistantOutput('```json\n{"reply":"Olá!","intent":"booking","handoff":false,"extracted":{"name":"Ana"}}\n```');
    expect(out).toMatchObject({ reply: 'Olá!', intent: 'booking', extracted: { name: 'Ana' } });
    expect(parseAssistantOutput('{"reply":"x","intent":"inventado"}').intent).toBe('other');
    expect(parseAssistantOutput('apenas texto')).toMatchObject({ reply: 'apenas texto', intent: 'other', handoff: false });
  });

  it('detecta pedido de humano por palavra-chave e limite de turnos', () => {
    expect(detectHandoff('quero falar com um atendente', { keywords: ['atendente'] }, 0)).toContain('atendente');
    expect(detectHandoff('qual o preço?', { keywords: ['atendente'], maxAiTurns: 5 }, 5)).toContain('Limite');
    expect(detectHandoff('qual o preço?', { keywords: ['atendente'], maxAiTurns: 5 }, 2)).toBeNull();
  });

  it('horário de atendimento no fuso configurado', () => {
    const hours = { enabled: true, timezone: 'America/Sao_Paulo', days: { mon: ['08:00', '18:00'] as [string, string] } };
    expect(isWithinBusinessHours(hours, new Date('2026-10-05T13:00:00Z'))).toBe(true); // seg 10h BRT
    expect(isWithinBusinessHours(hours, new Date('2026-10-05T23:00:00Z'))).toBe(false); // seg 20h BRT
    expect(isWithinBusinessHours(hours, new Date('2026-10-04T13:00:00Z'))).toBe(false); // domingo
    expect(isWithinBusinessHours({ enabled: false }, new Date())).toBe(true);
  });

  it('monta o prompt com regras, FAQ e base de conhecimento da empresa', () => {
    const prompt = buildSystemPrompt({
      orgName: 'Pousada X',
      chatbot: { name: 'Lia', tone: 'cordial', instructions: 'Ofereça café.', collectFields: ['name', 'checkIn'], faq: [{ q: 'Pet?', a: 'Sim' }], businessHours: {} },
      knowledge: [{ title: 'Tarifas', content: 'Diária R$ 300' }],
      contactSummary: 'nome: Ana',
      withinHours: true,
    });
    expect(prompt).toContain('Pousada X');
    expect(prompt).toContain('Diária R$ 300');
    expect(prompt).toContain('P: Pet?');
    expect(prompt).toContain('check-in');
    expect(prompt).toContain('NUNCA invente');
  });

  it('converte histórico para o formato de chat', () => {
    expect(historyToMessages([
      { direction: 'INBOUND', body: 'oi', senderType: 'CONTACT' },
      { direction: 'OUTBOUND', body: 'olá', senderType: 'AI' },
      { direction: 'OUTBOUND', body: 'sistema', senderType: 'SYSTEM' },
    ])).toEqual([{ role: 'user', content: 'oi' }, { role: 'assistant', content: 'olá' }]);
  });
});
