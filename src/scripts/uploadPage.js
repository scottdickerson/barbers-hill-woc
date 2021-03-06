let uploadForm;

const MAX_FILE_SIZE_IN_MB = 3;

document.addEventListener("DOMContentLoaded", () => {
  uploadForm = document.getElementById("uploadForm");
});

const submitForm = (edit) => {
  const errorMessageSpan = document.getElementById("errorMessage");
  const sportValue = uploadForm.elements.sport.value;
  const awardValue = uploadForm.elements.award.value;
  const yearValue = uploadForm.elements.year.value;
  const descriptionValue = uploadForm.elements.description.value;
  const imageFileCount = uploadForm.elements.imageFile?.files?.length;
  let errorMessage;
  if (
    sportValue === "" ||
    awardValue === "" ||
    yearValue === "" ||
    descriptionValue === "" ||
    (!edit && imageFileCount === 0)
  ) {
    errorMessage = "All form elements are required";
  }
  const fileSize = fileUploader.files[0]?.size;
  console.log("File size", fileSize);
  if (fileSize > MAX_FILE_SIZE_IN_MB * 1024 * 1024) {
    errorMessage = `File cannot be larger than ${MAX_FILE_SIZE_IN_MB}MB`;
  }
  console.log(sportValue);
  console.log(awardValue);
  console.log(yearValue);
  console.log(descriptionValue);
  console.log(imageFileCount);
  if (!errorMessage) {
    uploadForm.submit();
  } else {
    errorMessageSpan.innerHTML = errorMessage;
  }
};

const addChampion = () => {
  window.location = "/ui/uploadChampion.html";
};

const listChampions = () => {
  window.location = "/ui/listChampions.html";
};

const editChampion = (id) => {
  window.location = `/ui/editChampion.html/${id}`;
};

const deleteChampion = (id) => {
  fetch(`/api/${id}`, { method: "DELETE" }).then(() => {
    location.reload();
  });
};
