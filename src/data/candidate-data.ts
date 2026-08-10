import { StaticImageData } from 'next/image';

// data type
export type ICandidate = {
  id: number;
  img: StaticImageData;
  name: string;
  post: string;
  skills: string[];
  salary: string;
  location: string;
  salary_duration: string;
  experience: string;
  favorite?: boolean;
  qualification: string;
}

// Demo candidates cleared — listings will be populated from the Firebase backend.
const candidate_data: ICandidate[] = [];

export default candidate_data;
