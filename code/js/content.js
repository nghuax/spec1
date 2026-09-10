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
        'An interactive industrial energy landscape where burning coal constructs buildings while increasing emissions, debris, synchronized damage and local air pollution.',
      instructions:
        'Click a coal piece to burn it, or drag it into the hopper. Hover over a formed house or factory to create demand. Move the pointer to influence the air field. Open MIX for individual sound levels; M mutes, R resets and S saves a PNG.',
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
        'Guided fossil-energy particles progressively strike, fracture and remove floating natural forms from the environment.',
      instructions:
        'Press the central FOSSIL ENERGY control to launch pollutant particles. Select ! or press I for project information, use MUTE for the generative ambience, and press R to regenerate the artwork.',
      credit: ''
    },
    {
      id: 'adapt',
      number: '03',
      letter: 'A',
      title: 'ADAPT',
      statement: 'Balance clean energy to clear pollution and restore life',
      mood: 'SDG 7 / CLEAN ENERGY TRANSITION',
      artworkPath: 'artworks/adapt/index.html',
      artworkTitle: 'ADAPT interactive artwork',
      artworkDescription:
        'A regeneration field where balanced solar and wind energy reconnect damaged habitats into a shared clean-energy network. Follow a guided regeneration or restore the field yourself.',
      instructions:
        'Select START REGENERATION for a guided sequence, or choose SUN / WIND and drag over the field yourself. Watch the recovery indicator and use both energy sources to reach 100%. Use SOUND to mute or unmute. Press 1 / 2 to switch, R to reset and S to save.',
      goal: {
        title: 'Connect the field with a balanced clean-energy mix.',
        steps: ['Start the guide or choose SUN / WIND', 'Supply both sources to every habitat', 'Reach 100% and continue to LIVEN']
      },
      context: {
        eyebrow: 'SDG 7 / WHY THIS MATTERS',
        title: 'A clean-energy transition works as a connected system.',
        body:
          'Solar and wind do different jobs in this field, but recovery only happens when they work together. Stage 3 connects that balance to SDG 7: expanding access to affordable, reliable and cleaner energy.',
        action:
          'Choose cleaner energy where it is available, and support the systems that make renewable power accessible and reliable.'
      },
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
