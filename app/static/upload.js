// 文件数据
const imgFile = {};
const imgFormData = new FormData();

function handleInputChange (event) {
  const file = event.target.files[0];  // 获取当前选中的文件
  const imgMasSize = 1024 * 1024 * 10; // 限制大小10MB
  // 检查文件类型
  if(['jpeg', 'png', 'gif', 'jpg'].indexOf(file.type.split("/")[1]) < 0){
    throw new Error('不支持该文件类型');
  }

  // 文件大小限制
  if(file.size > imgMasSize ) {
    // 文件大小自定义限制
    throw new Error('文件大小超过限制');
  }

  // 图片压缩之旅
  transformFileToDataUrl(file);
}

// 将file转成dataUrl
function transformFileToDataUrl (file) {
  const imgCompassMaxSize = 200 * 1024; // 超过 200k 就压缩

  // 存储文件相关信息
  imgFile.type = file.type || 'image/jpeg';
  imgFile.size = file.size;
  imgFile.name = file.name;
  imgFile.lastModifiedDate = file.lastModifiedDate;

  // 封装好的函数
  const reader = new FileReader();

  // file转dataUrl是个异步函数，要将代码写在回调里
  reader.onload = function(e) {
    const result = e.target.result;

    if(result.length < imgCompassMaxSize) {
      compress(result, processData, false );    // 图片不压缩
    } else {
      compress(result, processData);            // 图片压缩
    }
  };

  reader.readAsDataURL(file);
}
// 使用canvas绘制图片并压缩
function compress (dataURL, callback, shouldCompress = true) {
  const img = new window.Image();

  img.src = dataURL;

  img.onload = function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let compressedDataUrl;

    if(shouldCompress){
      compressedDataUrl = canvas.toDataURL(imgFile.type, 0.2);
    } else {
      compressedDataUrl = canvas.toDataURL(imgFile.type, 1);
    }

    $("#uploaderFiles").append(`
        <li class="weui-uploader__file weui-uploader__file_status" style="background-image:url(${dataURL})"></li>
    `)

    callback(compressedDataUrl);
  }
}

// 这里使用二进制方式处理dataUrl
function processData (dataURL) {

  const binaryString = window.atob(dataURL.split(',')[1]);
  const arrayBuffer = new ArrayBuffer(binaryString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0, j = binaryString.length; i < j; i++) {
    intArray[i] = binaryString.charCodeAt(i);
  }

  const data = [intArray];

  let blob;

  try {
    blob = new Blob(data, { type: imgFile.type });
  } catch (error) {
    window.BlobBuilder = window.BlobBuilder ||
      window.WebKitBlobBuilder ||
      window.MozBlobBuilder ||
      window.MSBlobBuilder;
    if (error.name === 'TypeError' && window.BlobBuilder){
      const builder = new BlobBuilder();
      builder.append(arrayBuffer);
      blob = builder.getBlob(imgFile.type);
    } else {
      throw new Error('版本过低，不支持上传图片');
    }
  }

  // blob 转 file
  const fileOfBlob = new File([blob], imgFile.name,{
    type:imgFile.type
  });
  imgFormData.append('file', fileOfBlob);
}
