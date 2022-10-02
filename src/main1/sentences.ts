// Copyright 2022 negineri.
// SPDX-License-Identifier: Apache-2.0

import * as PIXI from "pixi.js";

export function loadSentences(sentences: SentencesJSON): Sentence[] {
  const result: Sentence[] = [];
  sentences.sentences.forEach((sentence) => {
    result.push(new Sentence());
    sentence.sentence.forEach((line) => {
      let vLine = "";
      [...line].forEach((character) => {
        vLine += character + "\n";
      });
      result[result.length - 1].sentence.push(line);
      result[result.length - 1].vSentence.push(vLine);
    });
  });
  return result;
}

export interface SentenceJSON {
  sentence: string[];
}
export interface SentencesJSON {
  sentences: SentenceJSON[];
}

export class Sentence {
  sentence: string[];
  vSentence: string[];
  style: PIXI.TextStyle;
  constructor() {
    this.style = new PIXI.TextStyle({
      align: "center",
      wordWrap: true,
    });
    this.sentence = [];
    this.vSentence = [];
  }
  text(): PIXI.Container {
    const result = new PIXI.Container();
    this.vSentence
      .slice()
      .reverse()
      .forEach((vLine) => {
        const text = new PIXI.Text(vLine, this.style);
        text.x = result.width;
        result.addChild(text);
      });
    return result;
  }
}
