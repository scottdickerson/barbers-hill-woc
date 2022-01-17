"use strict";
let uploadForm;
document.addEventListener("DOMContentLoaded", () => {
    uploadForm = document.getElementById("uploadForm");
});
const submitForm = () => {
    uploadForm.submit();
};
const addChampion = () => {
    window.location = "/ui/uploadChampion.html";
};
const listChampions = () => {
    window.location = "/ui/listChampions.html";
};
const editChampion = (id) => {
    window.location = `/ui/editChampion.html?id=${id}`;
};
const deleteChampion = (id) => {
    fetch(`/api/${id}`, { method: "DELETE" }).then(() => {
        location.reload();
    });
};
