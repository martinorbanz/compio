// jsdom's File/Blob implementation is minimal (no text()/arrayBuffer()), unlike
// real browsers. Patch it with FileReader, which jsdom does implement, so
// source code can keep using the modern, real-browser-correct file.text() API.
if (typeof File !== "undefined" && typeof File.prototype.text !== "function") {
  File.prototype.text = function (this: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error as DOMException);
      reader.readAsText(this);
    });
  };
}
