import { getPreferenceValues, showHUD } from "@raycast/api";
import { play } from "./api/play";
import { setSpotifyClient } from "./helpers/withSpotifyClient";
import { getMe } from "./api/getMe";
import { shuffle } from "./api/shuffle";

export default async function Command() {
  const { shouldShuffleLikedSongs } = getPreferenceValues<{ shouldShuffleLikedSongs?: boolean }>();

  await setSpotifyClient();

  try {
    const meData = await getMe();

    console.log(meData?.id);
    if (shouldShuffleLikedSongs) await shuffle(true);

    play({ contextUri: `spotify:user:${meData?.id}:collection` });

    await showHUD("Playing Liked Songs");
  } catch (error) {
    await showHUD("Couldn't play Liked Songs playlist.");
  }
}
