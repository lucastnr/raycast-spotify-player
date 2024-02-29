import { runAppleScript } from "@raycast/utils";
import { buildScriptEnsuringSpotifyIsRunning } from "../helpers/applescript";
import { getErrorMessage } from "../helpers/getError";
import { checkSpotifyApp } from "../helpers/isSpotifyInstalled";
import { getSpotifyClient } from "../helpers/withSpotifyClient";
import { getMyDevices } from "./getMyDevices";

type ContextTypes = "album" | "artist" | "playlist" | "track" | "show" | "episode";

type PlayProps = {
  id?: string | undefined;
  type?: ContextTypes | undefined;
  contextUri?: string;
  shuffle?: boolean;
};

const uriForType: Record<ContextTypes, string> = {
  album: "spotify:album:",
  artist: "spotify:artist:",
  playlist: "spotify:playlist:",
  track: "spotify:track:",
  show: "spotify:show:",
  episode: "spotify:episode:",
};

export async function play(props: PlayProps = {}) {
  const { id, type, contextUri, shuffle } = props;
  const { spotifyClient } = getSpotifyClient();
  const { devices } = await getMyDevices();
  const isSpotifyInstalled = await checkSpotifyApp();

  try {
    // If there is an active device, we can just play the track.
    // If there is no active device, we need to open Spotify and play the track.
    // If there is no active device and Spotify is not installed, we need to throw an error.
    const activeDevice = devices?.find((device) => device.is_active);

    if (!activeDevice && isSpotifyInstalled) {
      await launchSpotifyAndPlay(props);
      return;
    }

    const deviceId = activeDevice?.id ?? devices?.[0]?.id ?? undefined;

    if (typeof shuffle === "boolean") await spotifyClient.putMePlayerShuffle(shuffle);

    if (!type || !id) {
      await spotifyClient.putMePlayerPlay(
        { context_uri: contextUri },
        {
          deviceId,
        },
      );
    } else if (type === "track") {
      if (contextUri) {
        await spotifyClient.putMePlayerPlay(
          {
            context_uri: contextUri,
            offset: { uri: `${uriForType.track}${id}` },
          },
          {
            deviceId,
          },
        );
      } else {
        await spotifyClient.putMePlayerPlay(
          { uris: [`${uriForType.track}${id}`] },
          {
            deviceId,
          },
        );
      }
    } else if (type === "episode") {
      await spotifyClient.putMePlayerPlay(
        { uris: [`${uriForType.episode}${id}`] },
        {
          deviceId,
        },
      );
    } else {
      await spotifyClient.putMePlayerPlay(
        { context_uri: `${uriForType[type]}${id}` },
        {
          deviceId,
        },
      );
    }
  } catch (err) {
    const error = getErrorMessage(err);

    if (
      isSpotifyInstalled &&
      (error?.toLocaleLowerCase().includes("no device found") ||
        error?.toLocaleLowerCase().includes("no active device") ||
        error?.toLocaleLowerCase().includes("restricted device"))
    ) {
      // If one of the above errors is thrown, we need to open Spotify and play the track.
      await launchSpotifyAndPlay({ id, type });
      return;
    }

    throw new Error(error);
  }
}

const getShuffleScript = (state: boolean | undefined | null) => {
  if (typeof state !== "boolean") {
    return "";
  }
  return `set shuffling to ${state}`;
};

async function launchSpotifyAndPlay({ id, type, contextUri, shuffle }: PlayProps) {
  try {
    const shuffleScript = getShuffleScript(shuffle);

    if (contextUri) {
      console.log("on context uri thing");
      const script = buildScriptEnsuringSpotifyIsRunning(`
        play track "${contextUri}"
        ${shuffleScript}
      `);
      await runAppleScript(script);
    } else if (!type || !id) {
      const script = buildScriptEnsuringSpotifyIsRunning(`
        play
        ${shuffleScript}
      `);
      await runAppleScript(script);
    } else if (type === "track") {
      const script = buildScriptEnsuringSpotifyIsRunning(`
        play track "${uriForType[type]}${id}"
        ${shuffleScript}  
      `);
      await runAppleScript(script);
    } else {
      // For albums/artists/etc we seem to need a delay. Trying 1 second.
      const script = buildScriptEnsuringSpotifyIsRunning(`
        delay 1
        play track "${uriForType[type]}${id}"
        ${shuffleScript}
      `);
      await runAppleScript(script);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
