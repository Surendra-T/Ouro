export const getSelectionText = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return "";
  }
  return selection.toString().trim();
};
