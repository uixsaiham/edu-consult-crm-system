export interface CurrentUser {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export const defaultUser: CurrentUser = {
  name: "Sadman Rahman",
  email: "sadman.rahman@bheuni.com",
  phone: "+880 1711 223344",
  role: "Admissions Lead",
};
