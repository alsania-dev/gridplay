import { atom } from "recoil";

export const scoreState = atom<string[][]>({
  key: "scoreState",
  default: [Array(10).fill("?"), Array(10).fill("?")],
});
