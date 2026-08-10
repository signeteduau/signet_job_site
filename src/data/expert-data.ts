import { StaticImageData } from 'next/image';

// expert data type
type IExpertType = {
  id: number;
  img: StaticImageData;
  name: string;
  designation: string;
}

// Demo experts cleared — listings will be populated from the Firebase backend.
const expert_data: IExpertType[] = [];

export default expert_data;
