import axios from 'axios';

interface ListItem {
  id: number;
  url: string;
}

export const loadList = async () => {
  const url = `https://drive.google.com/uc?export=download&id=${process.env.GOOGLE_DRIVE_FILE_ID}`;

  const response = await axios.get<ListItem[]>(url);
  console.log(`Úspěšně stažen seznam se ${response.data.length} položkami.`);

  return response.data;
};
