import { getPreferenceValues, showHUD } from "@raycast/api";
import { play } from "./api/play";
import { setSpotifyClient } from "./helpers/withSpotifyClient";
import { getMe } from "./api/getMe";
import { shuffle } from "./api/shuffle";

export default async function Command() {
  const { shouldShuffleLikedSongs = false } = getPreferenceValues<{ shouldShuffleLikedSongs?: boolean }>();

  await setSpotifyClient();

  try {
    const meData = await getMe();

    // Update the shuffle state based on the user's preference
    await shuffle(shouldShuffleLikedSongs);

    play({ contextUri: `spotify:user:${meData?.id}:collection` });

    await showHUD("Playing Liked Songs");
  } catch (error) {
    await showHUD("Couldn't play Liked Songs playlist.");
  }
}
