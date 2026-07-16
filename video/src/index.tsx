import { registerRoot } from "remotion";
import { Composition } from "remotion";
import { LaunchTrailer, launchTrailerConfig } from "./LaunchTrailer";

registerRoot(() => {
  return (
    <>
      <Composition
        id={launchTrailerConfig.id}
        component={launchTrailerConfig.component}
        durationInFrames={launchTrailerConfig.durationInFrames}
        fps={launchTrailerConfig.fps}
        width={launchTrailerConfig.width}
        height={launchTrailerConfig.height}
      />
    </>
  );
});
