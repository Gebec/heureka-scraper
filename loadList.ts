import axios from 'axios';

interface ListItem {
  id: number;
  url: string;
}

export const loadList = async () => {
  const url = `https://drive.google.com/uc?export=download&id=${process.env.GOOGLE_DRIVE_FILE_ID}`;

  try {
    const response = await axios.get<ListItem[]>(url);
    console.log(`List downloaded successfully with ${response.data.length} items.`);

    return response.data;
  } catch (error) {
    console.error('Error downloading the list: ', error);
    throw error;
  }
};
