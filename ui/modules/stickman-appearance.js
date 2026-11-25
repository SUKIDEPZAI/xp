(() => {
  const VERSION = 1;
  const HAIR = ['short', 'spiky', 'fringe', 'long', 'cap'];
  const OUTFITS = ['tee', 'hoodie', 'jacket', 'sweater'];
  const ACCESSORIES = ['none', 'glasses', 'scarf', 'headphones', 'badge'];
  const EXPRESSIONS = ['smile', 'neutral', 'focused'];
  const HEAD_SHAPES = ['round', 'soft', 'square'];
  const SKIN_TONES = ['#f4d1b4', '#e7b995', '#c98f68', '#996747', '#70452f'];
  const PALETTES = {
    Curious: ['#2877c7', '#2f9d91', '#8054b8'],
    Playful: ['#e45b72', '#e39a2d', '#536ed4'],
    Shy: ['#6f86a8', '#8b78a8', '#5b9a9a'],
    Energetic: ['#e15d32', '#2878c9', '#3e9c61'],
    Calm: ['#5d8498', '#668c70', '#7c7c9d'],
    Competitive: ['#bd4c3d', '#355d9b', '#626d7a'],
    Creative: ['#8954b7', '#d16c9a', '#318eaa'],
    Friendly: ['#d27c36', '#3c9a83', '#647ec1'],
    Mischievous: ['#454b78', '#9760a8', '#337d78']
  };
  const HEX = /^#[0-9a-f]{6}$/i;
  const hash = value => {
    let h = 2166136261;
    for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const random = seed => {
    let state = seed >>> 0;
    return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
  };
  const pick = (values, r) => values[Math.floor(r() * values.length) % values.length];
  const color = (value, fallback) => HEX.test(String(value || '')) ? String(value) : fallback;
  function normalize(value = {}, primaryColor = '#202020') {
    const v = value && typeof value === 'object' ? value : {};
    return {
      version: VERSION,
      headShape: HEAD_SHAPES.includes(v.headShape) ? v.headShape : 'round',
      skinTone: color(v.skinTone, '#f1c7a5'),
      hairStyle: HAIR.includes(v.hairStyle) ? v.hairStyle : 'short',
      hairColor: color(v.hairColor, '#302b2a'),
      outfitStyle: OUTFITS.includes(v.outfitStyle) ? v.outfitStyle : 'hoodie',
      outfitColor: color(v.outfitColor, '#2877c7'),
      accessory: ACCESSORIES.includes(v.accessory) ? v.accessory : 'none',
      accentColor: color(v.accentColor, '#f2c14e'),
      expression: EXPRESSIONS.includes(v.expression) ? v.expression : 'smile',
      outlineColor: color(v.outlineColor, color(primaryColor, '#202020'))
    };
  }
  function create(seed, primaryColor = '#202020', personality = 'Curious') {
    const r = random(hash(`${seed}|appearance|${personality}`));
    const palette = PALETTES[personality] || PALETTES.Curious;
    return normalize({
      headShape: pick(HEAD_SHAPES, r), skinTone: SKIN_TONES[Math.floor(r() * SKIN_TONES.length)],
      hairStyle: pick(HAIR, r), hairColor: pick(['#302b2a', '#3d2a20', '#5b3828', '#343c4d', '#b86e3c'], r),
      outfitStyle: pick(OUTFITS, r), outfitColor: pick(palette, r),
      accessory: pick(ACCESSORIES, r), accentColor: pick(['#f2c14e', '#e9f0f7', '#d86b6b', '#62c6af'], r),
      expression: personality === 'Shy' ? 'neutral' : 'smile', outlineColor: primaryColor
    }, primaryColor);
  }
  function refine(value, { seed = 'style', personality = 'Curious', primaryColor = '#202020' } = {}) {
    const current = normalize(value, primaryColor), r = random(hash(`${seed}|refine|${personality}`));
    const palette = PALETTES[personality] || PALETTES.Curious;
    const preferredAccessory = {
      Curious: 'glasses', Playful: 'badge', Shy: 'headphones', Energetic: 'headphones',
      Calm: 'scarf', Competitive: 'badge', Creative: 'glasses', Friendly: 'scarf', Mischievous: 'cap'
    }[personality] || 'none';
    return normalize({
      ...current,
      outfitStyle: current.outfitStyle === 'tee' ? 'hoodie' : current.outfitStyle,
      outfitColor: palette[Math.floor(r() * palette.length)],
      accessory: current.accessory === 'none' ? preferredAccessory : current.accessory,
      accentColor: current.accentColor === current.outfitColor ? '#f2c14e' : current.accentColor,
      expression: personality === 'Shy' || personality === 'Calm' ? 'neutral' : 'smile',
      outlineColor: primaryColor
    }, primaryColor);
  }
  window.XPStickmanAppearance = Object.freeze({ VERSION, HAIR, OUTFITS, ACCESSORIES, EXPRESSIONS, HEAD_SHAPES, SKIN_TONES, PALETTES, normalize, create, refine });
})();
