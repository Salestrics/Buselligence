import { Audio, Sequence, staticFile } from "remotion";
import { DURATION_FRAMES, FPS, HEIGHT, SCENES, WIDTH } from "./styles/brand";
import { Scene1Opening } from "./scenes/Scene1Opening";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Platform } from "./scenes/Scene3Platform";
import { Scene4WowMoment } from "./scenes/Scene4WowMoment";
import { Scene5Ecosystem } from "./scenes/Scene5Ecosystem";
import { Scene6OpenSource } from "./scenes/Scene6OpenSource";
import { Scene7CTA } from "./scenes/Scene7CTA";

const sec = (s: number) => Math.round(s * FPS);

export const LaunchTrailer = () => {
  return (
    <>
      <Audio src={staticFile("audio/voiceover.wav")} />
      <Audio src={staticFile("audio/music.wav")} volume={0.18} />

      <Sequence from={sec(SCENES.scene1.start)} durationInFrames={sec(SCENES.scene1.end - SCENES.scene1.start)}>
        <Scene1Opening />
      </Sequence>
      <Sequence from={sec(SCENES.scene2.start)} durationInFrames={sec(SCENES.scene2.end - SCENES.scene2.start)}>
        <Scene2Problem />
      </Sequence>
      <Sequence from={sec(SCENES.scene3.start)} durationInFrames={sec(SCENES.scene3.end - SCENES.scene3.start)}>
        <Scene3Platform />
      </Sequence>
      <Sequence from={sec(SCENES.scene4.start)} durationInFrames={sec(SCENES.scene4.end - SCENES.scene4.start)}>
        <Scene4WowMoment />
      </Sequence>
      <Sequence from={sec(SCENES.scene5.start)} durationInFrames={sec(SCENES.scene5.end - SCENES.scene5.start)}>
        <Scene5Ecosystem />
      </Sequence>
      <Sequence from={sec(SCENES.scene6.start)} durationInFrames={sec(SCENES.scene6.end - SCENES.scene6.start)}>
        <Scene6OpenSource />
      </Sequence>
      <Sequence from={sec(SCENES.scene7.start)} durationInFrames={sec(SCENES.scene7.end - SCENES.scene7.start)}>
        <Scene7CTA />
      </Sequence>
    </>
  );
};

export const launchTrailerConfig = {
  id: "LaunchTrailer",
  component: LaunchTrailer,
  durationInFrames: DURATION_FRAMES,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
};
