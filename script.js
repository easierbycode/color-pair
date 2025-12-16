// http://tympanus.net/codrops/2021/12/07/coloring-with-code-a-programmatic-approach-to-design/

console.clear();

import {
  nearest,
  converter,
  differenceEuclidean,
  formatHex
} from "https://cdn.skypack.dev/culori@2.0.0";

const hexInput = document.getElementById("hexColor");
const toLCH = converter("lch");
let userBaseLCH = null;

function adjustHue(val) {
  if (val < 0) val += Math.ceil(-val / 360) * 360;

  return val % 360;
}

function createScientificPalettes(baseColor) {
  let color = formatHex(baseColor);
  console.log({ color });
  const targetHueSteps = {
    analogous: [0, 30, 60],
    triadic: [0, 120, 240],
    tetradic: [0, 90, 180, 270],
    complementary: [0, 180],
    splitComplementary: [0, 150, 210]
  };

  const palettes = {};

  for (const type of Object.keys(targetHueSteps)) {
    palettes[type] = targetHueSteps[type].map((step) => ({
      mode: "lch",
      l: baseColor.l,
      c: baseColor.c,
      h: adjustHue(baseColor.h + step)
    }));
  }

  return palettes;
}

function generate(baseColorOverride) {
  // choose a random base color unless overridden by user input
  const base =
    baseColorOverride ??
    {
      l: 50 + Math.random() * 10,
      c: 60 + Math.random() * 10,
      h: Math.random() * 360,
      mode: "lch"
    };

  // keep the input placeholder in sync with the active base color
  if (hexInput) {
    hexInput.placeholder = formatHex(base);
  }

  // generate "classic" color palettes
  const palettes = createScientificPalettes(base);

  // choose a random palette
  const choice = Object.entries(palettes)[Math.floor(Math.random() * 5)][1];

  // convert palette to HEX
  const paletteHex = choice.map((color) => formatHex(color));

  // take the "base" color, and make a light, desaturated version of it. This will be perfect for background colors, etc.
  const lightest = formatHex({
    ...choice[0],
    l: 98,
    c: 10
  });

  // take the "base" color, and make a dark, desaturated version of it. This will be perfect for text!
  const darkest = formatHex({
    ...choice[0],
    l: 10,
    c: 20
  });

  // set the light / dark custom properties
  document.body.style.setProperty(`--color-light`, lightest);
  document.body.style.setProperty(`--color-dark`, darkest);

  // for each color in the palette, add a custom property with its value
  paletteHex.forEach((color, index) => {
    document.body.style.setProperty(`--color-${index}`, color);
  });
}

generate();

setInterval(() => {
  generate(userBaseLCH);
}, 5000);

if (hexInput) {
  hexInput.addEventListener("input", (event) => {
    const rawValue = event.target.value.trim();
    const match = rawValue.match(/^#?([0-9a-fA-F]{6})$/);

    if (match) {
      const normalized = `#${match[1].toUpperCase()}`;
      const lchColor = toLCH(normalized);

      if (!lchColor) return;

      userBaseLCH = { ...lchColor, mode: "lch" };
      hexInput.value = normalized;
      generate(userBaseLCH);
    } else if (rawValue === "") {
      userBaseLCH = null;
      generate();
    }
  });
}

function isColorEqual(c1, c2) {
  return c1.h === c2.h && c1.l === c2.l && c1.c === c2.c;
}

function discoverPalettes(colors) {
  const palettes = {};

  for (const color of colors) {
    const targetPalettes = createScientificPalettes(color);

    for (const paletteType of Object.keys(targetPalettes)) {
      const palette = [];
      let variance = 0;

      for (const targetColor of targetPalettes[paletteType]) {
        // filter out colors already in the palette
        const availableColors = colors.filter(
          (color1) => !palette.some((color2) => isColorEqual(color1, color2))
        );

        const match = nearest(
          availableColors,
          differenceEuclidean("lch")
        )(targetColor)[0];

        variance += differenceEuclidean("lch")(targetColor, match);

        palette.push(match);
      }

      if (!palettes[paletteType] || variance < palettes[paletteType].variance) {
        palettes[paletteType] = {
          colors: palette,
          variance
        };
      }
    }
  }

  return palettes;
}

function doWork() {
  const baseColors = [
    "#FFB97A",
    "#FF957C",
    "#FF727F",
    "#FF5083",
    "#F02F87",
    "#C70084",
    "#9A007F",
    "#6A0076",
    "#33006B"
  ];

  const baseColorsLCH = baseColors.map((color) => toLCH(color));

  const palettes = discoverPalettes(baseColorsLCH);

  console.log(
    formatHex(palettes["complementary"].colors[0]),
    " -> ",
    formatHex(palettes["complementary"].colors[1])
  );
}

doWork();
