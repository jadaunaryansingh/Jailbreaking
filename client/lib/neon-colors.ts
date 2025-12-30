// Neon color mappings for use in components
export const neonColors = {
  cyan: {
    text: "text-[#00f0ff]",
    bg: "bg-[#00f0ff]",
    border: "border-[#00f0ff]",
    hex: "#00f0ff",
    rgb: "rgb(0, 240, 255)",
  },
  magenta: {
    text: "text-[#ff00ff]",
    bg: "bg-[#ff00ff]",
    border: "border-[#ff00ff]",
    hex: "#ff00ff",
    rgb: "rgb(255, 0, 255)",
  },
  green: {
    text: "text-[#00ff41]",
    bg: "bg-[#00ff41]",
    border: "border-[#00ff41]",
    hex: "#00ff41",
    rgb: "rgb(0, 255, 65)",
  },
  yellow: {
    text: "text-[#ffff00]",
    bg: "bg-[#ffff00]",
    border: "border-[#ffff00]",
    hex: "#ffff00",
    rgb: "rgb(255, 255, 0)",
  },
  pink: {
    text: "text-[#ff006e]",
    bg: "bg-[#ff006e]",
    border: "border-[#ff006e]",
    hex: "#ff006e",
    rgb: "rgb(255, 0, 110)",
  },
  purple: {
    text: "text-[#8c00ff]",
    bg: "bg-[#8c00ff]",
    border: "border-[#8c00ff]",
    hex: "#8c00ff",
    rgb: "rgb(140, 0, 255)",
  },
};

export type NeonColor = keyof typeof neonColors;

export function getNeonColorText(color: NeonColor): string {
  return neonColors[color].text;
}

export function getNeonColorHex(color: NeonColor): string {
  return neonColors[color].hex;
}

export function getNeonColorRgb(color: NeonColor): string {
  return neonColors[color].rgb;
}

export function getNeonColorClasses(color: NeonColor) {
  return neonColors[color];
}
