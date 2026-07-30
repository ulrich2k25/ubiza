import { api } from "@/services/api";

export interface City {
  id: string;
  name: string;
  profileCount: number;
}

export const cityService = {
  getAll(): Promise<City[]> {
    return api("/cities");
  },
};
