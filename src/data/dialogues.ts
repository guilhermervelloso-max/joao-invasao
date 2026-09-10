export type Speaker = "joao" | "zarok";

export type Line = {
  speaker: Speaker;
  text: string;
};

export const SPEAKER_LABEL: Record<Speaker, string> = {
  joao: "JOÃO",
  zarok: "ZAROK",
};

export const INTRO_LINES: Line[] = [
  {
    speaker: "joao",
    text: "Outra manhã no Rio… café, chinelo, e a calçada de sempre.",
  },
  {
    speaker: "joao",
    text: "Espera. O céu tá com uma luz estranha…",
  },
  {
    speaker: "joao",
    text: "Isso não é névoa. Tem alguma coisa caindo perto do bairro.",
  },
  {
    speaker: "zarok",
    text: "(transmissão) Humanos do Brasil… seu planeta agora responde ao Império de Zarok.",
  },
  {
    speaker: "joao",
    text: "Que voz é essa? Império de quem?!",
  },
  {
    speaker: "zarok",
    text: "(transmissão) Resista, João. Vai ser divertido esmagar sua teimosia carioca.",
  },
  {
    speaker: "joao",
    text: "Beleza. Então eu saio e vejo isso com meus próprios olhos.",
  },
];

export const FIRST_CONTACT_LINES: Line[] = [
  {
    speaker: "joao",
    text: "Aliens na Lapa? Hoje não. Hoje eu limpo essa rua.",
  },
];

export const MID_LINES: Line[] = [
  {
    speaker: "zarok",
    text: "Bom soco… para um macaco de praia.",
  },
  {
    speaker: "joao",
    text: "Continua falando. Eu chego até você.",
  },
];

export const BOSS_INTRO_LINES: Line[] = [
  {
    speaker: "zarok",
    text: "Chega. Se quer o Rio, vai ter que passar por mim.",
  },
  {
    speaker: "joao",
    text: "Então para de mandar minion e desce logo, Zarok.",
  },
];

export const ENDING_LINES: Line[] = [
  {
    speaker: "zarok",
    text: "Há… você aguenta mais do que eu esperava. Mas isso foi só o começo.",
  },
  {
    speaker: "joao",
    text: "Foge agora. Da próxima, eu termino o serviço.",
  },
  {
    speaker: "zarok",
    text: "O Rio ainda vai se ajoelhar, João. Até breve.",
  },
];
