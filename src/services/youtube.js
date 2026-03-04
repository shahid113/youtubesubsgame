const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchIndianChannels = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet&chart=mostPopular&regionCode=IN&maxResults=50&key=${API_KEY}`
    );
    const data = await response.json();
    const ids = data.items.map(item => item.snippet.channelId);
    return [...new Set(ids)]; // Unique IDs only
  } catch (error) {
    console.error("Error fetching trending channels:", error);
    return [];
  }
};

export const fetchChannelDetails = async (id) => {
  const response = await fetch(
    `${BASE_URL}/channels?part=snippet,statistics&id=${id}&key=${API_KEY}`
  );
  const data = await response.json();
  const channel = data.items[0];
  return {
    id: channel.id,
    name: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails.high.url,
    subs: parseInt(channel.statistics.subscriberCount),
  };
};