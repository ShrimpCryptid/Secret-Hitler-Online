import p1 from "./player-portraits/player-portrait-1.svg";
import p2 from "./player-portraits/player-portrait-2.svg";
import p3 from "./player-portraits/player-portrait-3.svg";
import p4 from "./player-portraits/player-portrait-4.svg";
import p5 from "./player-portraits/player-portrait-5.svg";
import p6 from "./player-portraits/player-portrait-6.svg";
import p7 from "./player-portraits/player-portrait-7.svg";
import p8 from "./player-portraits/player-portrait-8.svg";
import p9 from "./player-portraits/player-portrait-9.svg";
import p10 from "./player-portraits/player-portrait-10.svg";
import p11 from "./player-portraits/player-portrait-11.svg";
import p12 from "./player-portraits/player-portrait-12.svg";
import p13 from "./player-portraits/player-portrait-13.svg";
import p14 from "./player-portraits/player-portrait-14.svg";
import p15 from "./player-portraits/player-portrait-15.svg";
import p16 from "./player-portraits/player-portrait-16.svg";
import p17 from "./player-portraits/player-portrait-17.svg";
import p18 from "./player-portraits/player-portrait-18.svg";
import p19 from "./player-portraits/player-portrait-19.svg";
import p20 from "./player-portraits/player-portrait-20.svg";
import p_default from "./player-portraits/player-portrait-default.svg";
import twitter_icon from "./twitter-icon.svg";
import badge_img from "./badge.svg";

const portraits: Record<string, string> = {
  p_default,
  p1,
  p2,
  p3,
  p4,
  p5,
  p6,
  p7,
  p8,
  p9,
  p10,
  p11,
  p12,
  p13,
  p14,
  p15,
  p16,
  p17,
  p18,
  p19,
  p20,
};
export default portraits;

export const defaultPortrait = "p_default";

export const unlockedPortraits: string[] = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
];
export const lockedPortraits: string[] = [
  "p11",
  "p12",
  "p13",
  "p14",
  "p15",
  "p16",
  "p17",
  "p18",
  "p19",
  "p20",
];

export const portraitsAltText: Record<string, string> = {
  p_default: "No icon selected.",
  p1: "A stranger in neat office attire with a dark tie.",
  p2: "A stranger with an elegant bun hiding behind a large fan.",
  p3: "A stranger with stylish white hair in a trendy sweater.",
  p4: "A stranger with light, curly hair in a dark overcoat.",
  p5: "A stranger with a bob and apron with large, hooped earrings.",
  p6: "A stranger with an afro, wearing a sweater and a vest.",
  p7: "A dark-haired stranger in a tidy blouse.",
  p8: "A stranger with thick spectacles wrapped in a scarf.",
  p9: "A stranger sporting a letterman's jacket and unkempt hair.",
  p10: "A stranger with parted hair wearing a pair of large headphones.",
  p11: "A stranger with a leather jacket and thick moustache.",
  p12: "A stranger with curly dark hair in a bright trench coat.",
  p13: "A stranger with reading glasses and a fancy sun hat.",
  p14: "A stranger peeking out from behind a newspaper.",
  p15: "A bald, bearded stranger in a neat cardigan.",
  p16: "A stranger with thick white hair in distinguished military garb.",
  p17: "A stranger who is not two toddlers stacked on top of each other.",
  p18: "A stranger with long bangs hiding half of their face.",
  p19: "A cat.",
  p20: "An unsettling stranger shadowed in darkness.",
};

export const badge = badge_img;
export const twitterIcon = twitter_icon;
