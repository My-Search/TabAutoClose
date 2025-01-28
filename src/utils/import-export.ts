import $store from "@/store";

function importRules(files: File[] | null) {
  return new Promise((resolve, reject) => {
    console.log("导入规则文件");

    if (!files || files.length === 0) {
      return false;
    }

    const fileReader = new FileReader();

    fileReader.onload = async function (e: ProgressEvent<FileReader>) {
      let rawExportResult: any[] = [];
      try {
        if (typeof e.target?.result === "string") {
          rawExportResult = JSON.parse(e.target.result);
          if (!Array.isArray(rawExportResult)) {
            throw new Error("Invalid format");
          }
        } else {
          throw new Error("No file content");
        }
      } catch (error) {
        alert("导入失败！内容格式错误");
        return;
      }
      const rulesOfStore = await $store.common.rules();
      const validRules = rawExportResult.filter(
        (item) => typeof item === "string" && !rulesOfStore.includes(item)
      );
      validRules.forEach((validRule) => rulesOfStore.unshift(validRule));

      try {
        alert(`导入成功，共导入${validRules.length}条数据！`);
        resolve(await $store.common.saveRules(rulesOfStore));
      } catch (error) {
        console.log(error);
        alert("导入过程中发生错误！");
        resolve(false);
      }
    };

    // 直接读取第一个文件，已通过长度检查确保 files[0] 存在
    fileReader.readAsText(files[0]);
  });
}

async function exportAsFile(text: string, fileName: string) {
  console.log("导出为文件");
  if (URL) {
    console.log("导出为文件");
    // 将文本转换为 Blob
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    // 使用 chrome.downloads API
    await chrome.downloads.download({
      url: url,
      filename: fileName,
      saveAs: false, // 是否弹出保存对话框
    });
    // 释放内存
    URL.revokeObjectURL(url);
  } else {
    // 使用document.createElement("a")下载文件
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(text);

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", fileName);
    document.body.appendChild(linkElement); // 兼容 Firefox
    linkElement.click();
    document.body.removeChild(linkElement);
  }
}

export { importRules, exportAsFile };
