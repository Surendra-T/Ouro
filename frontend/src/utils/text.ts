export const truncate = (value: string, max = 80) => {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}...`;
};

export const titleCase = (value: string) => {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
