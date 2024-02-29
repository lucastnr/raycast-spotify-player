import { getPreferenceValues, showHUD } from "@raycast/api";
import { getMe } from "./api/getMe";
import { play } from "./api/play";
import { setSpotifyClient } from "./helpers/withSpotifyClient";

export default async function Command() {
  const { shouldShuffleLikedSongs } = getPreferenceValues<{ shouldShuffleLikedSongs?: boolean }>();

  await setSpotifyClient();

  try {
    const meData = await getMe();
    await play({ contextUri: `spotify:user:${meData?.id}:collection`, shuffle: shouldShuffleLikedSongs });

    await showHUD("Playing Liked Songs");
  } catch (error) {
    await showHUD("Couldn't play Liked Songs playlist.");
  }
}
