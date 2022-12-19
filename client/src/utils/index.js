export const removeFileFromFileList = (index, input) => {
  const dt = new DataTransfer();
  const { files } = input;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (index !== i) dt.items.add(file);
  }
  input.files = dt.files;
};
