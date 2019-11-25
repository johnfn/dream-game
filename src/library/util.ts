
let lastUsedId = 0;

export const GetUniqueID = () => {
  return lastUsedId++;
};