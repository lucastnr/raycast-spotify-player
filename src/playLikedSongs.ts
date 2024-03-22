import { Toast, getPreferenceValues, showHUD, showToast } from "@raycast/api";
import { getMe } from "./api/getMe";
import { play } from "./api/play";
import { setSpotifyClient } from "./helpers/withSpotifyClient";

export default async function Command() {
  const { shouldShuffleLikedSongs } = getPreferenceValues<{ shouldShuffleLikedSongs?: boolean }>();

  await setSpotifyClient();

  const toast = await showToast({
    title: "Playing Liked Songs",
    style: Toast.Style.Animated,
  });

  try {
    const meData = await getMe();
    play({ contextUri: `spotify:user:${meData?.id}:collection`, shuffle: shouldShuffleLikedSongs });

    await showHUD("Playing Liked Songs");
  } catch (error) {
    await showHUD("Couldn't play Liked Songs playlist.");
  } finally {
    toast.hide();
  }
}
