import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'private-images');
mkdirSync(OUT, { recursive: true });

// Seeded PRNG (xorshift32)
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
}

function swirls(r, palette, n = 30) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const cx = Math.round(r() * 500);
    const cy = Math.round(r() * 480);
    const rx = Math.round(18 + r() * 170);
    const ry = Math.round(7 + r() * 55);
    const rot = Math.round(r() * 360);
    const op = (0.05 + r() * 0.16).toFixed(2);
    const sw = (5 + r() * 24).toFixed(1);
    const col = palette[i % palette.length];
    o += `\n  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${col}" stroke-width="${sw}" opacity="${op}"/>`;
  }
  return o;
}

function stars(r, col, n = 18) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(r() * 500);
    const y = Math.round(r() * 420);
    const rad = (1.2 + r() * 4).toFixed(1);
    const glow = Math.round(parseFloat(rad) * (3 + r() * 5));
    const op = (0.45 + r() * 0.55).toFixed(2);
    const gop = (0.04 + r() * 0.1).toFixed(2);
    o += `\n  <circle cx="${x}" cy="${y}" r="${glow}" fill="${col}" opacity="${gop}"/>`;
    o += `\n  <circle cx="${x}" cy="${y}" r="${rad}" fill="${col}" opacity="${op}"/>`;
  }
  return o;
}

// ── Foreground shape library ────────────────────────────────────────────────

const shapes = {
  cloud: (c) => `
  <ellipse cx="140" cy="392" rx="82" ry="33" fill="${c}" opacity="0.6"/>
  <ellipse cx="178" cy="372" rx="58" ry="30" fill="${c}" opacity="0.72"/>
  <ellipse cx="110" cy="378" rx="50" ry="27" fill="${c}" opacity="0.65"/>
  <ellipse cx="345" cy="408" rx="75" ry="30" fill="${c}" opacity="0.58"/>
  <ellipse cx="382" cy="388" rx="54" ry="26" fill="${c}" opacity="0.65"/>
  <ellipse cx="360" cy="372" rx="38" ry="22" fill="${c}" opacity="0.55"/>`,

  wheat: (c) => Array.from({ length: 18 }, (_, i) => {
    const x = 25 + i * 26;
    const bend = (i % 3 - 1) * 8;
    return `<line x1="${x}" y1="480" x2="${x + bend}" y2="398" stroke="${c}" stroke-width="2.5" opacity="0.8" stroke-linecap="round"/><ellipse cx="${x + bend}" cy="392" rx="4" ry="13" fill="${c}" opacity="0.85" transform="rotate(${bend * 2} ${x + bend} 392)"/>`;
  }).join('\n  '),

  screen: (c) => `
  <rect x="148" y="348" width="205" height="135" rx="10" fill="#020c1a" opacity="0.96"/>
  <rect x="157" y="357" width="187" height="112" rx="5" fill="${c}" opacity="0.18"/>
  <rect x="157" y="357" width="187" height="112" rx="5" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.55"/>
  <line x1="172" y1="373" x2="328" y2="373" stroke="${c}" stroke-width="1.5" opacity="0.5"/>
  <line x1="172" y1="387" x2="298" y2="387" stroke="${c}" stroke-width="1.5" opacity="0.4"/>
  <line x1="172" y1="401" x2="315" y2="401" stroke="${c}" stroke-width="1.5" opacity="0.38"/>
  <line x1="172" y1="415" x2="278" y2="415" stroke="${c}" stroke-width="1.5" opacity="0.3"/>
  <line x1="172" y1="429" x2="302" y2="429" stroke="${c}" stroke-width="1.5" opacity="0.28"/>
  <rect x="232" y="483" width="38" height="9" rx="3" fill="#030a0f" opacity="0.9"/>
  <rect x="220" y="492" width="62" height="6" rx="3" fill="#030a0f" opacity="0.7"/>`,

  tree: (c) => `
  <path d="M250 480 L250 318" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
  <path d="M250 405 Q178 365 138 302" stroke="${c}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <path d="M250 385 Q322 342 364 278" stroke="${c}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <path d="M250 445 Q185 422 155 382" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M250 438 Q315 415 345 372" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M250 350 Q208 298 188 235" stroke="${c}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M250 345 Q292 295 312 228" stroke="${c}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M250 320 Q235 280 240 245" stroke="${c}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  waves: (c) => Array.from({ length: 7 }, (_, i) => {
    const y = 388 + i * 13;
    const sw = (3.5 - i * 0.3).toFixed(1);
    const op = (0.72 - i * 0.07).toFixed(2);
    return `<path d="M0 ${y} Q62 ${y - 13} 125 ${y} Q188 ${y + 13} 250 ${y} Q313 ${y - 13} 376 ${y} Q438 ${y + 13} 500 ${y}" fill="none" stroke="${c}" stroke-width="${sw}" opacity="${op}"/>`;
  }).join('\n  '),

  flower: (c) => {
    const petals = Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45) * Math.PI / 180;
      const px = Math.round(250 + Math.cos(a) * 50);
      const py = Math.round(420 + Math.sin(a) * 50);
      return `<ellipse cx="${px}" cy="${py}" rx="22" ry="12" fill="${c}" opacity="0.68" transform="rotate(${i * 45} ${px} ${py})"/>`;
    }).join('\n  ');
    return `\n  ${petals}\n  <circle cx="250" cy="420" r="24" fill="${c}" opacity="0.9"/>`;
  },

  building: (c) => `
  <rect x="158" y="335" width="64" height="145" fill="${c}" opacity="0.55"/>
  <rect x="232" y="295" width="82" height="185" fill="${c}" opacity="0.65"/>
  <rect x="325" y="358" width="52" height="122" fill="${c}" opacity="0.5"/>
  <rect x="173" y="356" width="15" height="20" fill="white" opacity="0.28"/>
  <rect x="195" y="356" width="15" height="20" fill="white" opacity="0.38"/>
  <rect x="173" y="386" width="15" height="20" fill="white" opacity="0.22"/>
  <rect x="195" y="386" width="15" height="20" fill="white" opacity="0.32"/>
  <rect x="247" y="322" width="17" height="22" fill="white" opacity="0.28"/>
  <rect x="272" y="322" width="17" height="22" fill="white" opacity="0.45"/>
  <rect x="247" y="355" width="17" height="22" fill="white" opacity="0.22"/>
  <rect x="272" y="355" width="17" height="22" fill="white" opacity="0.38"/>
  <rect x="272" y="388" width="17" height="22" fill="white" opacity="0.3"/>`,

  rings: (c) => Array.from({ length: 6 }, (_, i) => {
    const r = 28 + i * 35;
    const op = (0.55 - i * 0.07).toFixed(2);
    const sw = (4.5 - i * 0.5).toFixed(1);
    return `<circle cx="250" cy="420" r="${r}" fill="none" stroke="${c}" stroke-width="${sw}" opacity="${op}"/>`;
  }).join('\n  '),

  sun: (c) => {
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30) * Math.PI / 180;
      const x1 = Math.round(250 + Math.cos(a) * 52);
      const y1 = Math.round(455 + Math.sin(a) * 52);
      const x2 = Math.round(250 + Math.cos(a) * 82);
      const y2 = Math.round(455 + Math.sin(a) * 82);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="3.5" opacity="0.62" stroke-linecap="round"/>`;
    }).join('\n  ');
    return `
  <circle cx="250" cy="455" r="65" fill="${c}" opacity="0.3"/>
  <circle cx="250" cy="455" r="44" fill="${c}" opacity="0.52"/>
  <circle cx="250" cy="455" r="26" fill="${c}" opacity="0.88"/>
  ${rays}`;
  },

  scroll: (c) => `
  <rect x="128" y="348" width="245" height="162" rx="6" fill="${c}" opacity="0.2"/>
  <rect x="128" y="348" width="245" height="162" rx="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.55"/>
  <line x1="152" y1="378" x2="348" y2="378" stroke="${c}" stroke-width="1.8" opacity="0.48"/>
  <line x1="152" y1="394" x2="348" y2="394" stroke="${c}" stroke-width="1.8" opacity="0.4"/>
  <line x1="152" y1="410" x2="318" y2="410" stroke="${c}" stroke-width="1.8" opacity="0.38"/>
  <line x1="152" y1="426" x2="332" y2="426" stroke="${c}" stroke-width="1.8" opacity="0.32"/>
  <line x1="152" y1="442" x2="298" y2="442" stroke="${c}" stroke-width="1.8" opacity="0.28"/>
  <line x1="152" y1="458" x2="312" y2="458" stroke="${c}" stroke-width="1.8" opacity="0.22"/>
  <ellipse cx="128" cy="429" rx="13" ry="81" fill="${c}" opacity="0.45"/>
  <ellipse cx="373" cy="429" rx="13" ry="81" fill="${c}" opacity="0.45"/>`,

  figure: (c) => `
  <circle cx="250" cy="340" r="28" fill="${c}" opacity="0.75"/>
  <path d="M250 368 L250 440 M250 440 L225 478 M250 440 L275 478 M250 390 L218 420 M250 390 L282 420" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.72"/>`,
};

// ── Painting definitions ─────────────────────────────────────────────────────

const PAINTINGS = [
  {
    id: 'cloud-shepherd',
    title: 'The Cloud Shepherd',
    year: 2026,
    description: 'A lone shepherd tends to data clouds drifting through a midnight blue sky — every cloud a floating archive of the infinite.',
    vibe: ['pastoral', 'boundless', 'serene'],
    price: 0.01,
    seed: 1101,
    skyStops: ['#06122a', '#0e2858', '#1e508c', '#3a7abf'],
    ground: '#0c1c0a', groundDetail: '#142012',
    swirls: ['#2a5aa0', '#3878c0', '#50a0e8', '#88c8f8', '#c0e0ff'],
    starCol: '#b8d8ff',
    shape: 'cloud', shapeCol: '#a8ccee',
  },
  {
    id: 'digital-harvest',
    title: 'Digital Harvest',
    year: 2026,
    description: 'Golden data ripens under an emerald sky. Van Gogh paints the season of abundance — the harvest of ten thousand datasets.',
    vibe: ['golden', 'abundant', 'warm'],
    price: 0.01,
    seed: 2202,
    skyStops: ['#081800', '#1e5005', '#3a8810', '#70bc28'],
    ground: '#8a5808', groundDetail: '#c08010',
    swirls: ['#60a010', '#90c820', '#c8e830', '#f0f040', '#e8c820'],
    starCol: '#f8e840',
    shape: 'wheat', shapeCol: '#e8c028',
  },
  {
    id: 'lone-developer',
    title: 'The Lone Developer',
    year: 2026,
    description: 'At 3am, a solitary figure bathed in the cold blue glow of a monitor. Van Gogh captures the sacred loneliness of creation — the most expensive piece in the collection.',
    vibe: ['intense', 'solitary', 'electric'],
    price: 0.02,
    seed: 3303,
    skyStops: ['#010206', '#030818', '#05102e', '#081840'],
    ground: '#020604', groundDetail: '#030a06',
    swirls: ['#0820a0', '#1038c8', '#0858d8', '#1080e8', '#20a8f8'],
    starCol: '#00c8ff',
    shape: 'screen', shapeCol: '#00c8ff',
  },
  {
    id: 'open-source-fields',
    title: 'Open Source Fields',
    year: 2026,
    description: 'Rolling fields of freely shared code bloom beneath a collaborative sky — Van Gogh\'s brushstrokes celebrate the gift of open knowledge.',
    vibe: ['vibrant', 'communal', 'joyful'],
    price: 0.01,
    seed: 4404,
    skyStops: ['#0a2038', '#1848a0', '#2870c8', '#50a0e0'],
    ground: '#185010', groundDetail: '#286818',
    swirls: ['#208040', '#38a850', '#60c860', '#88e070', '#b0f890'],
    starCol: '#c8fca0',
    shape: 'flower', shapeCol: '#70d060',
  },
  {
    id: 'data-stream',
    title: 'Data Stream',
    year: 2026,
    description: 'Packets of meaning surge through fiber and air — Van Gogh\'s swirling hand traces the invisible rivers of data that bind the world.',
    vibe: ['flowing', 'electric', 'mysterious'],
    price: 0.01,
    seed: 5505,
    skyStops: ['#080318', '#100830', '#1a0848', '#280c60'],
    ground: '#080c1a', groundDetail: '#0c1028',
    swirls: ['#3808a0', '#5020c8', '#2868d0', '#30a0d8', '#38c8e8'],
    starCol: '#50d8f0',
    shape: 'waves', shapeCol: '#38c0e8',
  },
  {
    id: 'encrypted-garden',
    title: 'The Encrypted Garden',
    year: 2026,
    description: 'Behind every firewall blooms a secret garden — keys and ciphers rendered as flowers, each petal a promise of private meaning.',
    vibe: ['secretive', 'lush', 'protective'],
    price: 0.01,
    seed: 6606,
    skyStops: ['#020808', '#080f10', '#0e181a', '#162428'],
    ground: '#040a06', groundDetail: '#081208',
    swirls: ['#104828', '#186038', '#207848', '#289858', '#30b868'],
    starCol: '#48d878',
    shape: 'flower', shapeCol: '#38b860',
  },
  {
    id: 'the-repository',
    title: 'The Repository',
    year: 2026,
    description: 'An amber library of every commit ever made — Van Gogh illuminates the cathedral of version history, ancient scrolls of code preserved in amber.',
    vibe: ['ancient', 'warm', 'archival'],
    price: 0.01,
    seed: 7707,
    skyStops: ['#180c04', '#302010', '#503018', '#784828'],
    ground: '#281204', groundDetail: '#401a08',
    swirls: ['#703818', '#986030', '#c08840', '#d8a850', '#f0c868'],
    starCol: '#f8d878',
    shape: 'scroll', shapeCol: '#d0a038',
  },
  {
    id: 'bandwidth-dusk',
    title: 'Bandwidth at Dusk',
    year: 2026,
    description: 'The final packets stream home as the sun sets over the server farm — warm orange waves carry the last transmissions of the day.',
    vibe: ['nostalgic', 'warm', 'fading'],
    price: 0.01,
    seed: 8808,
    skyStops: ['#0c0308', '#280808', '#501010', '#803020'],
    ground: '#1a0804', groundDetail: '#280c06',
    swirls: ['#801808', '#b03010', '#d84818', '#f07028', '#f8a040'],
    starCol: '#f8c058',
    shape: 'waves', shapeCol: '#f09030',
  },
  {
    id: 'debug-hour',
    title: 'The Debug Hour',
    year: 2026,
    description: 'The golden moment of clarity — a magnifying glass reveals the hidden flaw in a vast night of logic. Van Gogh captures the triumph of the found bug.',
    vibe: ['focused', 'triumphant', 'nocturnal'],
    price: 0.01,
    seed: 9909,
    skyStops: ['#020408', '#040818', '#060e28', '#0a1638'],
    ground: '#040806', groundDetail: '#060c08',
    swirls: ['#0c2870', '#1840a8', '#1060c8', '#1880d8', '#20a0e0'],
    starCol: '#f0c020',
    shape: 'rings', shapeCol: '#f0c020',
  },
  {
    id: 'version-tree',
    title: 'The Version Tree',
    year: 2026,
    description: 'Every branch a feature, every leaf a commit — the version tree spreads against a forest sky, its roots deep in the first commit.',
    vibe: ['organic', 'branching', 'deep'],
    price: 0.01,
    seed: 1010,
    skyStops: ['#081402', '#102204', '#183208', '#224010'],
    ground: '#281402', groundDetail: '#381e06',
    swirls: ['#204020', '#30602e', '#408038', '#58a048', '#78c058'],
    starCol: '#c0f080',
    shape: 'tree', shapeCol: '#68a838',
  },
  {
    id: 'the-sprint',
    title: 'The Sprint',
    year: 2026,
    description: 'Two weeks of furious motion — Van Gogh\'s burning strokes capture the velocity of a sprint: deadline looming, features flying, fire in every line.',
    vibe: ['urgent', 'fierce', 'blazing'],
    price: 0.01,
    seed: 1111,
    skyStops: ['#160402', '#300606', '#520808', '#781010'],
    ground: '#1a0602', groundDetail: '#280a04',
    swirls: ['#802008', '#a83010', '#d04808', '#e87018', '#f89028'],
    starCol: '#f8e040',
    shape: 'waves', shapeCol: '#f89028',
  },
  {
    id: 'infinite-loop',
    title: 'Infinite Loop',
    year: 2026,
    description: 'The program that forgot to stop — concentric ripples spreading into eternity, Van Gogh finds the strange peace inside the endless cycle.',
    vibe: ['meditative', 'endless', 'cool'],
    price: 0.01,
    seed: 1212,
    skyStops: ['#020510', '#040a20', '#060f30', '#0a1848'],
    ground: '#030608', groundDetail: '#040a0c',
    swirls: ['#0828a8', '#1040c8', '#1860d8', '#2080e0', '#30a0e8'],
    starCol: '#90c8f8',
    shape: 'rings', shapeCol: '#60b8f0',
  },
  {
    id: 'the-merge',
    title: 'The Merge',
    year: 2026,
    description: 'Two branches converge in a sunset of resolution — Van Gogh witnesses the sacred moment when parallel work becomes one.',
    vibe: ['convergent', 'warm', 'resolved'],
    price: 0.01,
    seed: 1313,
    skyStops: ['#140604', '#2a1008', '#501a10', '#803020'],
    ground: '#1a1006', groundDetail: '#28180a',
    swirls: ['#803010', '#a04818', '#c06820', '#d88830', '#f0a840'],
    starCol: '#f8e060',
    shape: 'sun', shapeCol: '#f8b030',
  },
  {
    id: 'zero-day-dawn',
    title: 'Zero Day Dawn',
    year: 2026,
    description: 'The rarest find — a vulnerability at first light, before anyone else knows. A crimson dawn breaks over the unknowing world.',
    vibe: ['rare', 'dawn', 'dangerous'],
    price: 0.01,
    seed: 1414,
    skyStops: ['#010101', '#060202', '#140404', '#280808'],
    ground: '#040202', groundDetail: '#060303',
    swirls: ['#500408', '#781010', '#a01820', '#c82030', '#e83040'],
    starCol: '#ff5060',
    shape: 'sun', shapeCol: '#e82838',
  },
  {
    id: 'the-stack',
    title: 'The Stack',
    year: 2026,
    description: 'Layer upon layer: OS, runtime, framework, application — Van Gogh paints the modern city of software rising against a slate sky.',
    vibe: ['architectural', 'layered', 'urban'],
    price: 0.01,
    seed: 1515,
    skyStops: ['#080c14', '#101828', '#183040', '#204858'],
    ground: '#0c1018', groundDetail: '#101820',
    swirls: ['#183860', '#285888', '#387aa8', '#4890c0', '#58a8d0'],
    starCol: '#88c8e8',
    shape: 'building', shapeCol: '#4888b8',
  },
  {
    id: 'async-night',
    title: 'Async/Await',
    year: 2026,
    description: 'The patient suspension — a promise floats in the cool dark, awaiting resolution. Van Gogh paints the beauty of disciplined waiting.',
    vibe: ['patient', 'cool', 'suspended'],
    price: 0.01,
    seed: 1616,
    skyStops: ['#050a12', '#0a1428', '#0f1e3e', '#142850'],
    ground: '#060c10', groundDetail: '#0a1018',
    swirls: ['#182858', '#203878', '#285090', '#3068a8', '#3880b8'],
    starCol: '#a0c8e8',
    shape: 'rings', shapeCol: '#78b0d8',
  },
  {
    id: 'pull-request',
    title: 'Pull Request',
    year: 2026,
    description: 'A hand extended across the codebase — the pull request is an act of trust, a flower offered between collaborators.',
    vibe: ['collaborative', 'hopeful', 'gentle'],
    price: 0.01,
    seed: 1717,
    skyStops: ['#100818', '#201030', '#302048', '#403868'],
    ground: '#100a18', groundDetail: '#180f20',
    swirls: ['#402880', '#5838a0', '#7050c0', '#9068d0', '#b088e0'],
    starCol: '#d0b0f8',
    shape: 'flower', shapeCol: '#9868d0',
  },
  {
    id: 'runtime-glow',
    title: 'Runtime Glow',
    year: 2026,
    description: 'The moment the process starts — electric light floods outward as computation begins, Van Gogh\'s sun born again in silicon.',
    vibe: ['electric', 'energetic', 'born'],
    price: 0.01,
    seed: 1818,
    skyStops: ['#0c0800', '#201400', '#382000', '#582e00'],
    ground: '#100800', groundDetail: '#180c00',
    swirls: ['#604800', '#908000', '#c0a800', '#e8c000', '#f8d820'],
    starCol: '#fff068',
    shape: 'sun', shapeCol: '#f8c000',
  },
  {
    id: 'the-pipeline',
    title: 'The Pipeline',
    year: 2026,
    description: 'Code flows from commit to deploy through the blue arteries of automation — Van Gogh paints the industrial river of continuous delivery.',
    vibe: ['industrial', 'flowing', 'reliable'],
    price: 0.01,
    seed: 1919,
    skyStops: ['#060c14', '#0c1828', '#121e38', '#182848'],
    ground: '#080e14', groundDetail: '#0e1620',
    swirls: ['#183058', '#204878', '#286090', '#3078a8', '#3890b8'],
    starCol: '#70a8d0',
    shape: 'waves', shapeCol: '#3888b0',
  },
  {
    id: 'legacy-code',
    title: 'Legacy Code',
    year: 2026,
    description: 'Ancient incantations written before memory — the amber light of old code still runs, still matters. Van Gogh honors what should not be touched.',
    vibe: ['ancient', 'amber', 'enduring'],
    price: 0.01,
    seed: 2020,
    skyStops: ['#140c04', '#281808', '#402810', '#603818'],
    ground: '#1a1006', groundDetail: '#281808',
    swirls: ['#705020', '#906830', '#b08840', '#c8a050', '#e0b860'],
    starCol: '#f8d880',
    shape: 'scroll', shapeCol: '#c89838',
  },
];

// ── SVG builder ───────────────────────────────────────────────────────────────

function buildSVG(p) {
  const r = rng(p.seed);
  const [s0, s1, s2, s3 = s2] = p.skyStops;

  const swirlSVG = swirls(r, p.swirls);
  const starsSVG = stars(r, p.starCol);
  const shapeFn = shapes[p.shape];
  const shapeSVG = shapeFn ? shapeFn(p.shapeCol) : '';

  const priceLabel = p.price === 0.02 ? '$0.02 USDC' : '$0.01 USDC';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${s0}"/>
      <stop offset="35%"  stop-color="${s1}"/>
      <stop offset="70%"  stop-color="${s2}"/>
      <stop offset="100%" stop-color="${s3}"/>
    </linearGradient>
    <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${p.ground}"/>
      <stop offset="100%" stop-color="${p.groundDetail}"/>
    </linearGradient>
    <filter id="tex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="${p.seed % 50}" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="g"/>
      <feBlend in="SourceGraphic" in2="g" mode="overlay"/>
    </filter>
  </defs>

  <!-- Sky -->
  <rect width="500" height="490" fill="url(#sky)"/>
  <!-- Swirling brushstrokes -->${swirlSVG}
  <!-- Stars / light sources -->${starsSVG}
  <!-- Ground -->
  <rect y="488" width="500" height="212" fill="url(#gnd)"/>
  <!-- Foreground element -->${shapeSVG}
  <!-- Canvas texture overlay -->
  <rect width="500" height="700" fill="transparent" filter="url(#tex)" opacity="0.07"/>
  <!-- Title bar -->
  <rect y="598" width="500" height="102" fill="rgba(0,0,0,0.68)"/>
  <text x="250" y="638" text-anchor="middle" dominant-baseline="middle"
    fill="#f5e6c8" font-family="Georgia, 'Times New Roman', serif"
    font-size="21" font-style="italic">${p.title}</text>
  <text x="250" y="668" text-anchor="middle" dominant-baseline="middle"
    fill="#a08060" font-family="Georgia, 'Times New Roman', serif"
    font-size="13">${p.year} · Van Gogh Vibes · ${priceLabel}</text>
</svg>`;
}

// ── Generate & write ──────────────────────────────────────────────────────────

let count = 0;
for (const p of PAINTINGS) {
  const svg = buildSVG(p);
  writeFileSync(join(OUT, `${p.id}.svg`), svg, 'utf8');
  console.log(`✓ ${p.id}.svg`);
  count++;
}
console.log(`\n${count} paintings generated in ${OUT}`);
