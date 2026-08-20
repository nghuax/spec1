export const siteContent = {
  project: {
    title: 'HEAL',
    eyebrow: 'ONE CONNECTED JOURNEY',
    tagline: 'One connected journey from damage to recovery.',
    taglineLines: ['FROM DAMAGE', 'TO RECOVERY'],
    concept:
      'HEAL is one connected journey from damage to recovery. Four interactive artworks trace a shared transformation: damage, pollution, transition and renewal.',
    sequence: 'damage → pollution → transition → recovery',
    quote: '',
    callToAction: '',
    members: [],
    credits: []
  },

  chapters: [
    {
      id: 'harm',
      number: '01',
      letter: 'H',
      title: 'HARM',
      statement: 'Traditional energy damages the planet',
      mood: 'DAMAGE / TRADITIONAL ENERGY',
      artworkPath: 'artworks/harm/index.html',
      artworkTitle: 'HARM interactive artwork',
      artworkDescription:
        'An interactive industrial energy landscape where burning coal constructs buildings while increasing emissions, debris and local air pollution.',
      instructions:
        'Click a coal piece to burn it, or drag it into the hopper. Hover over a formed house or factory to create demand. Move the pointer to influence the air field. R resets; S saves a PNG.',
      credit: ''
    },
    {
      id: 'exhaust',
      number: '02',
      letter: 'E',
      title: 'EXHAUST',
      statement: 'Pollution weakens nature and wellbeing',
      mood: 'POLLUTION / ENVIRONMENTAL EXHAUSTION',
      artworkPath: 'artworks/exhaust/index.html',
      artworkTitle: 'EXHAUST interactive artwork',
      artworkDescription:
        'Floating natural forms are progressively damaged as the user raises a dense pollution line through the environment.',
      instructions:
        'Press the central POLLUTANT control to raise the pollution line and damage the floating natural forms. R regenerates the artwork.',
      credit: ''
    },
    {
      id: 'adapt',
      number: '03',
      letter: 'A',
      title: 'ADAPT',
      statement: 'Renewable energy offers a cleaner direction',
      mood: 'TRANSITION / RENEWABLE SYSTEMS',
      artworkPath: 'artworks/adapt/index.html',
      artworkTitle: 'ADAPT interactive artwork',
      artworkDescription:
        'An abstract regeneration field where sun and wind interactions gradually clear pollution and restore an environmental system.',
      instructions:
        'Choose SUN or WIND on the artwork, or press 1 / 2. Drag across the field to apply energy. R resets; S saves a PNG.',
      credit: ''
    },
    {
      id: 'liven',
      number: '04',
      letter: 'L',
      title: 'LIVEN',
      statement: 'Clean energy brings life back to Earth',
      mood: 'RECOVERY / CLEAN ENERGY',
      artworkPath: 'artworks/liven/index.html',
      artworkTitle: 'LIVEN interactive artwork',
      artworkDescription:
        'A renewable-energy puzzle where correctly placed clean-energy pieces restore colour, growth and activity to Earth.',
      instructions:
        'Drag renewable-energy pieces into the matching Earth slots. Trash can be moved but cannot restore the planet. R regenerates; S saves a PNG.',
      credit: ''
    }
  ]
};

export function getChapter(chapterId) {
  return siteContent.chapters.find((chapter) => chapter.id === chapterId);
}

export function getChapterIndex(chapterId) {
  return siteContent.chapters.findIndex((chapter) => chapter.id === chapterId);
}
