// 公共工具类
const CUSTOM_CAMERA_TYPE = '指定';
// 图片加载状态管理对象
const loadingImages = {};
// 图像缓存，提高播放时的渲染性能
const imageCache = {};

/**
 * 带CORS支持的图片加载工具方法
 * 支持重试机制和回调管理
 * @param {string} url - 图片URL
 * @param {Function} callback - 加载成功回调函数
 * @param {Function} errorCallback - 加载失败回调函数
 * @returns {Image} - Image对象
 */
export function loadImageWithCORS(url, callback, errorCallback) {
  if (!url) {
    console.error('无效的图片URL');
    if (errorCallback) errorCallback();
    return null;
  }
  
  // 检查URL是否正在请求中
  if (loadingImages[url]) {
    // 如果已经有回调函数，将新的回调函数也添加进去
    if (callback) {
      loadingImages[url].callbacks.push(callback);
    }
    if (errorCallback) {
      loadingImages[url].errorCallbacks.push(errorCallback);
    }
    return null; // 不返回新的Image对象
  }
  
  const img = new Image();
  img.crossOrigin = "anonymous"; // 解决跨域问题
  
  // 记录请求状态
  loadingImages[url] = {
    callbacks: callback ? [callback] : [],
    errorCallbacks: errorCallback ? [errorCallback] : []
  };
  
  // 添加备用加载策略
  let attempts = 0;
  const maxAttempts = 3;
  
  function attemptLoad() {
    attempts++;
    
    try {
      img.src = url;
    } catch (error) {
      console.error(`图片加载异常 (${attempts}/${maxAttempts}):`, error);
      handleError();
    }
  }
  
  function handleError() {
    if (attempts < maxAttempts) {
      // 指数退避重试
      setTimeout(() => {
        console.log(`尝试重新加载图片 (${attempts+1}/${maxAttempts}):`, url);
        attemptLoad();
      }, 500 * Math.pow(2, attempts));
    } else {
      console.error(`图片加载最终失败 (${maxAttempts}次尝试):`, url);
      // 通知所有错误回调
      const currentErrorCallbacks = loadingImages[url]?.errorCallbacks || [];
      currentErrorCallbacks.forEach(cb => cb());
      // 移除请求状态
      delete loadingImages[url];
    }
  }
  
  img.onload = function() {
    // 通知所有成功回调
    const currentCallbacks = loadingImages[url]?.callbacks || [];
    currentCallbacks.forEach(cb => cb(img));
    imageCache[url] = img; // 缓存已加载的图片
    // 移除请求状态
    delete loadingImages[url];
  };
  
  img.onerror = function() {
    handleError();
  };
  
  // 开始第一次尝试
  attemptLoad();
  
  return img;
}

export function getCacheImage(url) {
  return imageCache[url];
}
export function round(num) {
  if(num === undefined) {
    return 0;
  }
  return Math.round(num * 100) / 100;
}


// 导出loadingImages对象和round函数，以便在其他地方使用
export { loadingImages, imageCache, CUSTOM_CAMERA_TYPE };