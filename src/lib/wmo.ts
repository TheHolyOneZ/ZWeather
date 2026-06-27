export function wmoLabelKey(code: number): string {
  switch (code) {
    case 0: return "wmo.clear";
    case 1: return "wmo.mostlyClear";
    case 2: return "wmo.partlyCloudy";
    case 3: return "wmo.overcast";
    case 45:
    case 48: return "wmo.fog";
    case 51:
    case 53:
    case 55: return "wmo.drizzle";
    case 56:
    case 57: return "wmo.freezingDrizzle";
    case 61:
    case 63:
    case 65: return "wmo.rain";
    case 66:
    case 67: return "wmo.freezingRain";
    case 71:
    case 73:
    case 75: return "wmo.snow";
    case 77: return "wmo.snowGrains";
    case 80:
    case 81:
    case 82: return "wmo.showers";
    case 85:
    case 86: return "wmo.snowShowers";
    case 95: return "wmo.thunderstorm";
    case 96:
    case 99: return "wmo.thunderstormHail";
    default: return "wmo.unknown";
  }
}
