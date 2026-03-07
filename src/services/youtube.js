const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export const fetchIndianChannels = async () => {
  try {
    // 1. Better query: Focus on 'Entertainment' keywords
    // 2. regionCode: 'IN' targets India specifically
    // 3. relevanceLanguage: 'hi' or 'en' helps filter local content
    const query = "entertainment comedy gaming roast hindi"; 
    
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&regionCode=IN&relevanceLanguage=hi&maxResults=50&key=${API_KEY}`
    );

    const data = await response.json();

    if (!data.items) return [];

    // Extract unique IDs
    const ids = data.items.map(item => item.id.channelId);
    return [...new Set(ids)];

  } catch (error) {
    console.error("Error fetching Indian channels:", error);
    return [];
  }
};

export const fetchChannelDetails = async (id) => {
  try {

    const response = await fetch(
      `${BASE_URL}/channels?part=snippet,statistics&id=${id}&key=${API_KEY}`
    );

    const data = await response.json();

    if (!data.items || data.items.length === 0) return null;

    const channel = data.items[0];

    return {
      id: channel.id,
      name: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails.high.url,
      subs: parseInt(channel.statistics.subscriberCount || 0),
    };

  } catch (error) {
    console.error("Error fetching channel details:", error);
    return null;
  }
};