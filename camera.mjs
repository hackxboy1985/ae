// 摄像机相关功能模块

// 导出函数，供主应用调用
export function initCamera(app) {
  // 摄像机尺寸选项
  const cameraSizes = app.cameraSizes;
  
  // 摄像机相关状态
  let showCamera = ref(false);//app.showCamera;
  let showCameraPreview = app.showCameraPreview;
  let cameraX = 0; // 摄像机X位置
  let cameraY = 0; // 摄像机Y位置
  let cameraWidth = cameraSizes.value[1].width; // cavas上的虚拟摄像机宽度，不代表输出宽
  let cameraHeight = cameraSizes.value[1].height; // cavas上的虚拟摄像机高度，不代表输出高
  let isDraggingCamera = false; // 摄像机拖拽状态
  let dragStartX = 0; // 拖拽开始时的鼠标X
  let dragStartY = 0;
  let outputCameraWidth = cameraWidth; // 输出的摄像机宽度
  let outputCameraHeight = cameraHeight; // 输出的摄像机高度

  // let expressionManager = app.expressionManager;

  // 从app对象获取canvas引用
  let canvas = null;
  if (app.canvas && app.canvas.value) {
    canvas = app.canvas.value;
    // console.log('Camera module: Canvas initialized successfully');
  } else {
    console.error('Camera module: Canvas reference not available');
  }
  
  // 用于存储当前分镜选择的默认景别类型
  let currentDefaultShotScenery = '全景'; // 默认设置为全景
  // 如果传入了默认镜别设置，则使用它
  if (app.defaultCameraScenery && app.defaultCameraScenery.value) {
    currentDefaultShotScenery = app.defaultCameraScenery.value;
  }
  let currentActiveShotId = null;
  
  // 摄像机调整大小相关变量
  let isResizingCamera = false; // 摄像机调整大小状态
  let resizeHandle = ''; // 正在调整的手柄
  let dragStartWidth = 0; // 调整大小开始时的宽度
  let dragStartHeight = 0; // 调整大小开始时的高度
  let dragStartCameraX = 0; // 调整大小开始时的摄像机X位置
  let dragStartCameraY = 0; // 调整大小开始时的摄像机Y位置
  let aspectRatio = cameraWidth / cameraHeight; // 宽高比
  
  // 预览窗口相关
  let previewCanvas = app.previewCanvas;
  let previewCtx = null;
  if (app && app.previewCanvas) {
    previewCanvas = app.previewCanvas;
  } else {
    console.warn('Camera module: Preview canvas reference not available yet');
  }
  let previewWindow = null;
  let dragHandle = null;
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  
  // 虚拟镜头系统扩展功能
  let cameraZoom = app.cameraZoom;
  let cameraRotation = app.cameraRotation;
  let enableCameraRotation = app.enableCameraRotation;
  let showCameraInfo = app.showCameraInfo;
  let useSmoothTransition = app.useSmoothTransition;
  let cameraPresets = app.cameraPresets;
  
  // 引用主应用的变量和函数
  const ctx = app.ctx;
  const offscreenCanvas = app.offscreenCanvas;
  const offscreenCtx = app.offscreenCtx;
  const renderFrame = app.renderFrame;
  const selectedCameraSize = app.selectedCameraSize;
  const timeline = app.timeline;
  const isMaintainingAspectRatio = app.isMaintainingAspectRatio;
  const enableCameraEdit = app.enableCameraEdit;
  

  const isShowCamera = computed(() => {
    return showCamera.value;
  });

  // 显示/隐藏摄像机
  const showCameraClick = () => {
    showCamera.value = !showCamera.value;
    renderFrame(31);
  };
  
  // 显示/隐藏摄像机预览
  const showCameraPreviewClick = () => {
    console.log('showCameraPreviewClick showCameraPreview.value:', showCameraPreview.value);
    showCameraPreview.value = !showCameraPreview.value;
    
    // 使用try-catch包装setTimeout回调，确保异常能够被捕获和显示
    setTimeout(() => {
      try {
        setupCameraPreviewDrag();
        if (showCameraPreview.value) {
          // 必须设置，否则会有异常
          previewCtx = null;
        }
        updateCameraPreview();
      } catch (error) {
        console.error('setupCameraPreviewDrag error:', error);
        throw error; // 重新抛出异常，确保它能在控制台中显示
      }
    }, 200);
    
    // if (showCameraPreview.value) {
    //   // 必须设置，否则会有异常
    //   previewCtx = null;
    // }
    // setTimeout(updateCameraPreview, 350)
  };
  
  // 关闭相机预览
  const closeCameraPreview = () => {
    showCameraPreview.value = false;
  };
  
  // 为预览窗口添加拖拽功能
  const setupCameraPreviewDrag = () => {
    // if(showCameraPreview.value)
    //   throw "setupCameraPreviewDrag";

    // 先检查元素是否存在
    previewWindow = document.getElementById('cameraPreview');
    dragHandle = previewWindow ? previewWindow.querySelector('.cursor-move') : null;
    
    if (!dragHandle || !previewWindow) {
      console.log('can not find camera preview window or drag handle:', previewWindow, dragHandle);
      return;
    }
    
    //console.log('打开预览:previewWindow', previewWindow);
    // if(previewCanvas !=null){
    //     console.log('open camera preview set size:', outputCameraWidth,outputCameraHeight);
    //     previewCanvas.value.width = outputCameraWidth;
    //     previewCanvas.value.height = outputCameraHeight;
    // }

    // 先移除可能存在的旧监听器，避免重复绑定
    const handleMouseDown = (e) => {
      // 确保点击的是标题栏本身，而不是关闭按钮
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      //console.log('drag move preview');
      
      // 获取鼠标相对于窗口左上角的偏移量
      const rect = previewWindow.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      // 提高z-index防止被遮挡
      previewWindow.style.zIndex = '1000';
      
      // 添加拖拽中的样式
      document.body.style.cursor = 'grabbing';
      previewWindow.style.userSelect = 'none';
      previewWindow.style.transition = 'none';
      
      // 创建临时的移动和释放处理函数
      const handleMouseMove = (moveEvent) => {
        if (!isDragging || !previewWindow) return;
        
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        
        // 计算新位置（考虑窗口边界）
        let newLeft = moveEvent.clientX - offsetX;
        let newTop = moveEvent.clientY - offsetY;
        
        // 限制在可视区域内
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const windowWidth = previewWindow.offsetWidth;
        const windowHeight = previewWindow.offsetHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - windowWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - windowHeight));
        
        // 设置新位置
        previewWindow.style.left = `${newLeft}px`;
        previewWindow.style.top = `${newTop}px`;
      };
      
      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          console.log('结束拖拽预览窗口');
          
          document.body.style.cursor = 'default';
          if (previewWindow) {
            previewWindow.style.zIndex = '50';
            previewWindow.style.userSelect = 'auto';
            previewWindow.style.transition = '';
          }
          
          // 移除临时事件监听器
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('mouseleave', handleMouseUp);
        }
      };
      
      // 添加临时事件监听器
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    };
    
    // 移除旧的事件监听器，使用新的方式
    dragHandle.onmousedown = handleMouseDown;
    console.log('拖拽功能设置完成');
  };
  
  // 更新相机预览
  const updateCameraPreview = () => {
    // 检查是否启用了相机预览
    if (!showCameraPreview.value) {
      //console.log('updateCameraPreview showCameraPreview.value:', showCameraPreview.value);
      return;
    }
    
    // 检查并确保预览画布和上下文有效
    if (!previewCanvas.value || !previewCtx || document.getElementById('previewCanvas') !== previewCanvas.value) {
      previewCanvas.value = document.getElementById('previewCanvas');
      if (previewCanvas.value) {
        previewCtx = previewCanvas.value.getContext('2d');
      } else {
        console.warn('can not find previewCanvas element');
        return;
      }
    }
    
    // 检查并确保离屏画布和上下文有效
    if (!offscreenCanvas || !offscreenCtx) {
      console.log('updateCameraPreview offscreenCanvas', offscreenCanvas, 'offscreenCtx', offscreenCtx);
      return;
    }
    
    // 确保预览画布保持与摄像机相同的宽高比
    const cameraAspectRatio = cameraWidth / cameraHeight;
    
    // 获取预览画布容器的尺寸限制
    let maxPreviewWidth = 320; // 默认最大宽度
    let maxPreviewHeight = 240; // 默认最大高度
    
    const canvasContainer = previewCanvas.value.parentElement;
    if (canvasContainer) {
      const containerRect = canvasContainer.getBoundingClientRect();
      maxPreviewWidth = containerRect.width - 16; // 减去一些内边距
      maxPreviewHeight = containerRect.height - 16;
    }
    if (maxPreviewWidth < 0 || maxPreviewHeight < 0) {
      maxPreviewWidth = 320;
      maxPreviewHeight = 240;
    }
    //console.log('updateCameraPreview maxPreviewWidth', maxPreviewWidth, 'maxPreviewHeight', maxPreviewHeight);
    
    // 计算适合容器的预览尺寸，保持宽高比
    let previewWidth, previewHeight;
    if (maxPreviewWidth / maxPreviewHeight > cameraAspectRatio) {
      // 以高度为基准
      previewHeight = maxPreviewHeight;
      previewWidth = previewHeight * cameraAspectRatio;
    } else {
      // 以宽度为基准
      previewWidth = maxPreviewWidth;
      previewHeight = previewWidth / cameraAspectRatio;
    }
    
    // 设置预览画布尺寸为虚拟镜头还是实际尺寸
    // previewCanvas.value.width = cameraWidth;   //为虚拟尺寸
    // previewCanvas.value.height = cameraHeight;
    previewCanvas.value.width = outputCameraWidth;  //为输出尺寸
    previewCanvas.value.height = outputCameraHeight;
    
    // 设置CSS样式使预览画布适应容器
    // previewCanvas.value.style.width = `${previewWidth}px`;
    // previewCanvas.value.style.height = `${previewHeight}px`;
    
    // 清除预览画布
    previewCtx.clearRect(0, 0, outputCameraWidth, outputCameraHeight);
    
    try {
      // 从离屏画布复制摄像机区域的内容到预览画布
      previewCtx.drawImage(
        offscreenCanvas,
        cameraX, cameraY, cameraWidth, cameraHeight, // 源区域
        0, 0, outputCameraWidth, outputCameraHeight // 目标区域
      );
    } catch (error) {
      console.error('复制预览内容出错:', error);
    }
  };
  
  // 绘制摄像机边框
  const drawCamera = () => {
    if (!showCamera.value || !ctx.value) return;
    
    ctx.value.save();
    
    // 绘制摄像机边框
    ctx.value.strokeStyle = '#FF0000';
    ctx.value.lineWidth = 2;
    
    // 应用旋转（如果启用）
    if (cameraRotation.value !== 0 && enableCameraRotation.value) {
      const centerX = cameraX + cameraWidth / 2;
      const centerY = cameraY + cameraHeight / 2;
      ctx.value.translate(centerX, centerY);
      ctx.value.rotate((cameraRotation.value * Math.PI) / 180);
      
      // 绘制旋转后的矩形
      ctx.value.strokeRect(-cameraWidth / 2, -cameraHeight / 2, cameraWidth, cameraHeight);
      
      // 绘制边框内部的半透明区域
      ctx.value.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.value.fillRect(-cameraWidth / 2, -cameraHeight / 2, cameraWidth, cameraHeight);
      
      // 绘制摄像机角标记
      const cornerSize = 10;
      ctx.value.strokeStyle = '#FF0000';
      ctx.value.lineWidth = 3;
      
      // 左上角
      ctx.value.beginPath();
      ctx.value.moveTo(-cameraWidth / 2, -cameraHeight / 2);
      ctx.value.lineTo(-cameraWidth / 2 + cornerSize, -cameraHeight / 2);
      ctx.value.moveTo(-cameraWidth / 2, -cameraHeight / 2);
      ctx.value.lineTo(-cameraWidth / 2, -cameraHeight / 2 + cornerSize);
      ctx.value.stroke();
      
      // 右上角
      ctx.value.beginPath();
      ctx.value.moveTo(cameraWidth / 2, -cameraHeight / 2);
      ctx.value.lineTo(cameraWidth / 2 - cornerSize, -cameraHeight / 2);
      ctx.value.moveTo(cameraWidth / 2, -cameraHeight / 2);
      ctx.value.lineTo(cameraWidth / 2, -cameraHeight / 2 + cornerSize);
      ctx.value.stroke();
      
      // 右下角
      ctx.value.beginPath();
      ctx.value.moveTo(cameraWidth / 2, cameraHeight / 2);
      ctx.value.lineTo(cameraWidth / 2 - cornerSize, cameraHeight / 2);
      ctx.value.moveTo(cameraWidth / 2, cameraHeight / 2);
      ctx.value.lineTo(cameraWidth / 2, cameraHeight / 2 - cornerSize);
      ctx.value.stroke();
      
      // 左下角
      ctx.value.beginPath();
      ctx.value.moveTo(-cameraWidth / 2, cameraHeight / 2);
      ctx.value.lineTo(-cameraWidth / 2 + cornerSize, cameraHeight / 2);
      ctx.value.moveTo(-cameraWidth / 2, cameraHeight / 2);
      ctx.value.lineTo(-cameraWidth / 2, cameraHeight / 2 - cornerSize);
      ctx.value.stroke();
    } else {
      // 应用左下角坐标系转换 - AE坐标系统Y轴向下为正，Canvas坐标系统Y轴向上为正
      const bottomLeftY = offscreenCanvas.height - cameraY - cameraHeight;
      
      // 不旋转时直接绘制矩形边框
      ctx.value.strokeRect(cameraX, bottomLeftY, cameraWidth, cameraHeight);
      // console.log('drawCamera cameraX', cameraX, 'cameraY(左下角坐标系)', bottomLeftY, 'cameraWidth', cameraWidth, 'cameraHeight', cameraHeight);

      // 绘制边框内部的半透明区域
      ctx.value.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.value.fillRect(cameraX, bottomLeftY, cameraWidth, cameraHeight);
      
      // 绘制摄像机角标记
      const cornerSize = 40;
      ctx.value.strokeStyle = '#FF0000';
      ctx.value.lineWidth = 12;
      
      // 左上角（左下角坐标系）
      ctx.value.beginPath();
      ctx.value.moveTo(cameraX, bottomLeftY);
      ctx.value.lineTo(cameraX + cornerSize, bottomLeftY);
      ctx.value.moveTo(cameraX, bottomLeftY);
      ctx.value.lineTo(cameraX, bottomLeftY + cornerSize);
      ctx.value.stroke();
      
      // 右上角（左下角坐标系）
      ctx.value.beginPath();
      ctx.value.moveTo(cameraX + cameraWidth, bottomLeftY);
      ctx.value.lineTo(cameraX + cameraWidth - cornerSize, bottomLeftY);
      ctx.value.moveTo(cameraX + cameraWidth, bottomLeftY);
      ctx.value.lineTo(cameraX + cameraWidth, bottomLeftY + cornerSize);
      ctx.value.stroke();
      
      // 右下角（左下角坐标系）
      ctx.value.beginPath();
      ctx.value.moveTo(cameraX + cameraWidth, bottomLeftY + cameraHeight);
      ctx.value.lineTo(cameraX + cameraWidth - cornerSize, bottomLeftY + cameraHeight);
      ctx.value.moveTo(cameraX + cameraWidth, bottomLeftY + cameraHeight);
      ctx.value.lineTo(cameraX + cameraWidth, bottomLeftY + cameraHeight - cornerSize);
      ctx.value.stroke();
      
      // 左下角（左下角坐标系）
      ctx.value.beginPath();
      ctx.value.moveTo(cameraX, bottomLeftY + cameraHeight);
      ctx.value.lineTo(cameraX + cornerSize, bottomLeftY + cameraHeight);
      ctx.value.moveTo(cameraX, bottomLeftY + cameraHeight);
      ctx.value.lineTo(cameraX, bottomLeftY + cameraHeight - cornerSize);
      ctx.value.stroke();
    }
    
    // 恢复上下文状态
    ctx.value.restore();
  };
  
  // 重置摄像机位置到画布中心
  const resetCamera = (selectedCameraSize) => {
    
    cameraX = (offscreenCanvas.width - cameraWidth) / 2;
    cameraY = (offscreenCanvas.height - cameraHeight) / 2;
    console.log('resetCamera pos:', cameraX, cameraY);
    
    if(selectedCameraSize != null) {
      outputCameraWidth = selectedCameraSize.width;
      outputCameraHeight = selectedCameraSize.height;
      outputCameraWidth = 532;//写死固定
      outputCameraHeight = 300;//写死固定
      //console.log('resetCamera size:', selectedCameraSize,outputCameraWidth,outputCameraHeight);
      if(previewCanvas !=null && previewCanvas.value != null){
        //console.log('resetCamera previewCanvas:', previewCanvas);
        previewCanvas.value.width = outputCameraWidth;
        previewCanvas.value.height = outputCameraHeight;
        
      }
    }

    
    renderFrame(32);
  };
  
  // 虚拟镜头控制方法
  const toggleAspectRatio = () => {
    if (isMaintainingAspectRatio && isMaintainingAspectRatio.value !== undefined) {
      isMaintainingAspectRatio.value = !isMaintainingAspectRatio.value;
    }
  };
  
  const toggleCameraRotation = () => {
    enableCameraRotation.value = !enableCameraRotation.value;
    if (!enableCameraRotation.value) {
      cameraRotation.value = 0;
    }
    renderFrame(33);
  };
  
  const toggleCameraInfo = () => {
    showCameraInfo.value = !showCameraInfo.value;
  };
  
  const zoomCamera = (factor) => {
    // const newWidth = cameraWidth * factor;
    // const newHeight = isMaintainingAspectRatio && isMaintainingAspectRatio.value !== undefined ? 
    //                   (isMaintainingAspectRatio.value ? cameraHeight * factor : cameraHeight) : 
    //                   cameraHeight;
    
    // // 确保摄像机尺寸不会太小
    // if (newWidth >= 100 && newHeight >= 100) {
    //   // 计算中心位置
    //   const centerX = cameraX + cameraWidth / 2;
    //   const centerY = cameraY + cameraHeight / 2;
      
    //   // 更新尺寸
    //   cameraWidth = newWidth;
    //   cameraHeight = newHeight;
      
    //   // 重新定位摄像机，保持中心点不变
    //   cameraX = centerX - cameraWidth / 2;
    //   cameraY = centerY - cameraHeight / 2;
      
    //   renderFrame();
    // }
  };
  
  const rotateCamera = (degrees) => {
    if (!enableCameraRotation.value) return;
    
    cameraRotation.value = (cameraRotation.value + degrees + 360) % 360;
    renderFrame(34);
  };
  
  const applyCameraPreset = (preset) => {
    console.log('applyCameraPreset:', preset);
    if (preset) {
      cameraPresets.value.forEach((item) => {
        //console.log('tt:', item.name ,preset);
        if (item.name === preset) {
          preset = item;
          //console.log('ee:', item);
        }
      })
      console.log('cameraPresets:', cameraPresets);
      console.log('applyCameraPreset:', preset,preset.width,preset.height);

      cameraX = preset.x || cameraX;
      cameraY = preset.y || cameraY;
      cameraWidth = preset.width || cameraWidth;
      cameraHeight = preset.height || cameraHeight;
      cameraRotation.value = preset.rotation || cameraRotation.value;
      renderFrame(35);
    }
  };
  
  const saveCameraPreset = (name) => {
    const newPreset = {
      name,
      x: cameraX,
      y: cameraY,
      width: cameraWidth,
      height: cameraHeight,
      rotation: cameraRotation.value
    };
    
    cameraPresets.value.push(newPreset);
  };
  
  const deleteCameraPreset = (index) => {
    if (index >= 0 && index < cameraPresets.value.length) {
      cameraPresets.value.splice(index, 1);
    }
  };
  
  // 强制刷新相机预览
  const forceUpdateCameraPreview = () => {
    if (showCameraPreview.value) {
      updateCameraPreview();
    }
  };
  
  // 监听摄像机尺寸变化
  const watchCameraSize = () => {
    return (newValue) => {
      if (newValue) {
        cameraWidth = newValue.width;
        cameraHeight = newValue.height;
        resetCamera(); // 重置摄像机位置到画布中心
        renderFrame(36); // 重新渲染
      }
    };
  };

  // 设置摄像机拖拽和调整大小事件
  const setupCameraEvents = () => {
    if (!canvas) return;
    
    // 拖拽摄像机
    canvas.addEventListener('mousedown', (e) => {
      if (!showCamera.value || !enableCameraEdit.value) return;
      
      // 阻止默认行为，确保拖拽流畅
      e.preventDefault();
      e.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = canvas.height - (e.clientY - rect.top) * scaleY;
      
      // 检查是否点击了调整大小的手柄
      const resizeRegionSize = 10; // 调整区域大小
      
      // 检查角落
      if (mouseX >= cameraX - resizeRegionSize && mouseX <= cameraX + resizeRegionSize && 
          mouseY >= cameraY - resizeRegionSize && mouseY <= cameraY + resizeRegionSize) {
        isResizingCamera = true;
        resizeHandle = 'nw';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'nwse-resize';
        return;
      } else if (mouseX >= cameraX + cameraWidth - resizeRegionSize && mouseX <= cameraX + cameraWidth + resizeRegionSize && 
                 mouseY >= cameraY - resizeRegionSize && mouseY <= cameraY + resizeRegionSize) {
        isResizingCamera = true;
        resizeHandle = 'ne';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'nesw-resize';
        return;
      } else if (mouseX >= cameraX - resizeRegionSize && mouseX <= cameraX + resizeRegionSize && 
                 mouseY >= cameraY + cameraHeight - resizeRegionSize && mouseY <= cameraY + cameraHeight + resizeRegionSize) {
        isResizingCamera = true;
        resizeHandle = 'sw';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'nesw-resize';
        return;
      } else if (mouseX >= cameraX + cameraWidth - resizeRegionSize && mouseX <= cameraX + cameraWidth + resizeRegionSize && 
                 mouseY >= cameraY + cameraHeight - resizeRegionSize && mouseY <= cameraY + cameraHeight + resizeRegionSize) {
        isResizingCamera = true;
        resizeHandle = 'se';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'nwse-resize';
        return;
      }
      
      // 检查边
      else if (mouseX >= cameraX - resizeRegionSize && mouseX <= cameraX + resizeRegionSize && 
               mouseY >= cameraY && mouseY <= cameraY + cameraHeight) {
        isResizingCamera = true;
        resizeHandle = 'w';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'ew-resize';
        return;
      } else if (mouseX >= cameraX + cameraWidth - resizeRegionSize && mouseX <= cameraX + cameraWidth + resizeRegionSize && 
                 mouseY >= cameraY && mouseY <= cameraY + cameraHeight) {
        isResizingCamera = true;
        resizeHandle = 'e';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'ew-resize';
        return;
      } else if (mouseY >= cameraY - resizeRegionSize && mouseY <= cameraY + resizeRegionSize && 
                 mouseX >= cameraX && mouseX <= cameraX + cameraWidth) {
        isResizingCamera = true;
        resizeHandle = 'n';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'ns-resize';
        return;
      } else if (mouseY >= cameraY + cameraHeight - resizeRegionSize && mouseY <= cameraY + cameraHeight + resizeRegionSize && 
                 mouseX >= cameraX && mouseX <= cameraX + cameraWidth) {
        isResizingCamera = true;
        resizeHandle = 's';
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartWidth = cameraWidth;
        dragStartHeight = cameraHeight;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'ns-resize';
        return;
      }
      
      console.log('click camera:', cameraX, cameraY, cameraWidth, cameraHeight);

      // 检查是否点击了摄像机区域用于拖拽
      if (mouseX >= cameraX && mouseX <= cameraX + cameraWidth && 
          mouseY >= cameraY && mouseY <= cameraY + cameraHeight) {
        console.log('click camera:', cameraX, cameraY, cameraWidth, cameraHeight);
        isDraggingCamera = true;
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartCameraX = cameraX;
        dragStartCameraY = cameraY;
        canvas.style.cursor = 'grabbing';
      }
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      if (!rect || !canvas.width || !canvas.height) return; // 添加额外的空值检查
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = canvas.height- (e.clientY - rect.top) * scaleY;
      //console.log('mousemove:', e.clientX, e.clientY, mouseX, mouseY,rect.top,rect);
      console.log('isDraggingCamera:',isDraggingCamera);
      // 处理摄像机拖拽
      if (isDraggingCamera && enableCameraEdit.value) {
        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();
        
        // 计算新的摄像机位置
        const deltaX = mouseX - dragStartX;
        const deltaY = mouseY - dragStartY;
        cameraX = dragStartCameraX + deltaX;
        cameraY = dragStartCameraY + deltaY;
        
        // 限制摄像机在画布范围内 - 添加额外的空值检查
        if (cameraX < 0) cameraX = 0;
        if (cameraY < 0) cameraY = 0;
        if (canvas.width && cameraX + cameraWidth > canvas.width) cameraX = canvas.width - cameraWidth;
        if (canvas.height && cameraY + cameraHeight > canvas.height) cameraY = canvas.height - cameraHeight;
        console.log('dragCamera pos:', cameraX, cameraY);
        // 立即渲染更新后的位置
        renderFrame(37);
      }
      // 处理摄像机调整大小
      else if (isResizingCamera && enableCameraEdit.value) {
        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();
        let newWidth = dragStartWidth;
        let newHeight = dragStartHeight;
        let newX = dragStartCameraX;
        let newY = dragStartCameraY;
        
        // 计算新的尺寸和位置
        switch (resizeHandle) {
          case 'n':
            newHeight = dragStartHeight - (mouseY - dragStartY);
            newY = dragStartCameraY + (mouseY - dragStartY);
            break;
          case 's':
            newHeight = dragStartHeight + (mouseY - dragStartY);
            break;
          case 'w':
            newWidth = dragStartWidth - (mouseX - dragStartX);
            newX = dragStartCameraX + (mouseX - dragStartX);
            break;
          case 'e':
            newWidth = dragStartWidth + (mouseX - dragStartX);
            break;
          case 'nw':
            newWidth = dragStartWidth - (mouseX - dragStartX);
            newHeight = dragStartHeight - (mouseY - dragStartY);
            newX = dragStartCameraX + (mouseX - dragStartX);
            newY = dragStartCameraY + (mouseY - dragStartY);
            break;
          case 'ne':
            newWidth = dragStartWidth + (mouseX - dragStartX);
            newHeight = dragStartHeight - (mouseY - dragStartY);
            newY = dragStartCameraY + (mouseY - dragStartY);
            break;
          case 'sw':
            newWidth = dragStartWidth - (mouseX - dragStartX);
            newHeight = dragStartHeight + (mouseY - dragStartY);
            newX = dragStartCameraX + (mouseX - dragStartX);
            break;
          case 'se':
            newWidth = dragStartWidth + (mouseX - dragStartX);
            newHeight = dragStartHeight + (mouseY - dragStartY);
            break;
        }
        
        // 应用宽高比约束
        if (isMaintainingAspectRatio && isMaintainingAspectRatio.value !== undefined && (resizeHandle.includes('n') || resizeHandle.includes('s') || 
                                        resizeHandle.includes('e') || resizeHandle.includes('w'))) {
          // 根据调整的方向决定使用哪个维度作为基准
          if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
            // 基于高度调整宽度
            newWidth = newHeight * aspectRatio;
          } else if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
            // 基于宽度调整高度
            newHeight = newWidth / aspectRatio;
          }
        }
        
        // 限制最小尺寸
        const minSize = 100;
        if (newWidth < minSize) newWidth = minSize;
        if (newHeight < minSize) newHeight = minSize;
        
        // 限制摄像机在画布范围内
        if (newX < 0) {
          newWidth += newX;
          newX = 0;
        }
        if (newY < 0) {
          newHeight += newY;
          newY = 0;
        }
        // 添加额外的空值检查
        if (canvas.width && newX + newWidth > canvas.width) {
          newWidth = canvas.width - newX;
        }
        if (canvas.height && newY + newHeight > canvas.height) {
          newHeight = canvas.height - newY;
        }
        
        // 更新摄像机属性
        cameraX = newX;
        cameraY = newY;
        cameraWidth = newWidth;
        cameraHeight = newHeight;
        // 立即渲染更新后的位置
        renderFrame(40);
      }
      // 更新鼠标样式
      else if (showCamera.value && enableCameraEdit.value) {
        const resizeRegionSize = 10;
        
        // 检查角落
        if ((mouseX >= cameraX - resizeRegionSize && mouseX <= cameraX + resizeRegionSize && 
             mouseY >= cameraY - resizeRegionSize && mouseY <= cameraY + resizeRegionSize) ||
            (mouseX >= cameraX + cameraWidth - resizeRegionSize && mouseX <= cameraX + cameraWidth + resizeRegionSize && 
             mouseY >= cameraY + cameraHeight - resizeRegionSize && mouseY <= cameraY + cameraHeight + resizeRegionSize)) {
          canvas.style.cursor = 'nwse-resize';
        } else if ((mouseX >= cameraX + cameraWidth - resizeRegionSize && mouseX <= cameraX + cameraWidth + resizeRegionSize && 
                   mouseY >= cameraY - resizeRegionSize && mouseY <= cameraY + resizeRegionSize) ||
                  (mouseX >= cameraX - resizeRegionSize && mouseX <= cameraX + resizeRegionSize && 
                   mouseY >= cameraY + cameraHeight - resizeRegionSize && mouseY <= cameraY + cameraHeight + resizeRegionSize)) {
          canvas.style.cursor = 'nesw-resize';
        } 
        // 检查边
        else if ((mouseX >= cameraX - resizeRegionSize && mouseX <= cameraX + resizeRegionSize && 
                  mouseY >= cameraY && mouseY <= cameraY + cameraHeight) ||
                 (mouseX >= cameraX + cameraWidth - resizeRegionSize && mouseX <= cameraX + cameraWidth + resizeRegionSize && 
                  mouseY >= cameraY && mouseY <= cameraY + cameraHeight)) {
          canvas.style.cursor = 'ew-resize';
        } else if ((mouseY >= cameraY - resizeRegionSize && mouseY <= cameraY + resizeRegionSize && 
                    mouseX >= cameraX && mouseX <= cameraX + cameraWidth) ||
                   (mouseY >= cameraY + cameraHeight - resizeRegionSize && mouseY <= cameraY + cameraHeight + resizeRegionSize && 
                    mouseX >= cameraX && mouseX <= cameraX + cameraWidth)) {
          canvas.style.cursor = 'ns-resize';
        } 
        // 检查内部
        else if (mouseX >= cameraX && mouseX <= cameraX + cameraWidth && 
                 mouseY >= cameraY && mouseY <= cameraY + cameraHeight) {
          canvas.style.cursor = 'grab';
        } 
        // 默认
        else {
          canvas.style.cursor = 'default';
        }
      }

      
    });
    
    canvas.addEventListener('mouseup', (e) => {
      if (isDraggingCamera && canvas) {
        isDraggingCamera = false;
        canvas.style.cursor = 'default';
        // 确保释放后立即更新视图
        renderFrame(39);
      }
      if (isResizingCamera && canvas) {
        isResizingCamera = false;
        canvas.style.cursor = 'default';
        // 确保释放后立即更新视图
        renderFrame(40);
      }
    });
  };
  
  const getCameraPreset = (cameraType) => {
    for (const preset of cameraPresets.value) {
      if (preset.name.includes(cameraType) ) {
        return preset;
      }
    }
    return null;
  }

  const findCurrentSpeakerId = (currentTime, currentShot) => {
    let speakingRoleId = null;
    if (currentShot && currentShot.audios && Array.isArray(currentShot.audios)) {
      // 在当前分镜的音频轨道中查找当前时间点正在播放的音频
      const currentAudio = currentShot.audios.find(audio => {
        const audioStartTime = currentShot.startTime + (audio.startTime || 0);
        const audioEndTime = audioStartTime + (audio.audioDuration || 0);
        return currentTime >= audioStartTime && currentTime <= audioEndTime;
      });
      
      if (currentAudio && currentAudio.roleId) {
        speakingRoleId = currentAudio.roleId;
      }
    }
    return speakingRoleId;
  }

  const findCurrentSpeakerIdPosition = (currentTime, speakingRoleId) => {
    let currentExpressionTrack = null;
    let targetCenterX = null;
    let targetCenterY = null;
    if (app.getExpressionTrackByRoleId) {
      currentExpressionTrack = app.getExpressionTrackByRoleId(speakingRoleId, currentTime, false);
      console.log('camera focus on trace expression:', currentExpressionTrack);
    } else {
      console.warn('app.getExpressionTrackByRoleId方法未定义');
    }
          
    if (currentExpressionTrack && currentExpressionTrack.x !== undefined && currentExpressionTrack.y !== undefined) {
      // 使用角色位置及当前帧宽高计算出角色中间点作为目标中心点
      const roleWidth = currentExpressionTrack.width || 0;
      const roleHeight = currentExpressionTrack.height || 0;
      const scale = currentExpressionTrack.scale || 1;
      
      targetCenterX = currentExpressionTrack.x + (roleWidth * scale) / 2;
      targetCenterY = currentExpressionTrack.y + (roleHeight * scale) / 2;
      console.log(`找到说话角色 ${speakingRoleId} 的位置: (${currentExpressionTrack.x}, ${currentExpressionTrack.y})`);
    }
    return {targetCenterX,targetCenterY};
  }
      

  // 根据当前分镜找到对应的场景
  const findSceneByShot = (shot, timeline) => {
    if (!shot || !timeline || !timeline.scenes) return null;
    return timeline.scenes.find(scene => scene.shots && scene.shots.includes(shot.id));
  };

  // 上一个场景ID
  let previousSceneId = null;
  let previousCameraType = null;
  let previousSpeakingRoleId = null;
  const FULL_CAMERA_TYPE = '全景';
  // 根据当前时间更新摄像机设置
  const updateCameraOnPlayback = (_currentTimeInt, timeline) => {
    if (!timeline || !timeline.shots || !canvas || !canvas.width || !canvas.height) {
      return;
    }
    
    if(app.enableCameraEdit)
      return;
    
    console.log('app.enableCameraEdit:',app.enableCameraEdit);

    // 查找当前时间点对应的镜头轨道和分镜
    let currentCameraTrack = null;
    let currentShot = null;
    
    for (const shot of timeline.shots) {
      // 检查是否在当前分镜时间范围内
      const shotStartTime = shot.startTime || 0;
      const shotEndTime = shotStartTime + (shot.duration || 0);
      
      if (_currentTimeInt >= shotStartTime && _currentTimeInt <= shotEndTime) {
        currentShot = shot;
        
        // 在当前分镜中查找对应的镜头轨道
        if (shot.cameraTracks && Array.isArray(shot.cameraTracks)) {
          for (const cameraTrack of shot.cameraTracks) {
            const trackStartTime = shotStartTime + (cameraTrack.startTime || 0);
            const trackDuration = cameraTrack.duration || shot.duration || 0;
            const trackEndTime = trackStartTime + trackDuration;
            
            if (_currentTimeInt >= trackStartTime && _currentTimeInt <= trackEndTime) {
              currentCameraTrack = cameraTrack;
              break;
            }
          }
        }
        break;
      }
    }

    // 计算目标镜头设置
    let targetWidth = cameraWidth;
    let targetHeight = cameraHeight;
    let targetCenterX = cameraX + cameraWidth / 2;
    let targetCenterY = cameraY + cameraHeight / 2;
    
    //开场或切场景时，直接设置默认镜头
    // const currentShotId = currentShot ? currentShot.id : null;
    
    // 找到当前分镜对应的场景
    const currentScene = findSceneByShot(currentShot, timeline);
    const currentSceneId = currentScene ? currentScene.id : null;
    
    // 检测是否是开场或切场景
    const isStartOfAnimation = _currentTimeInt === 0;
    const isSceneChange = currentSceneId !== previousSceneId;
    //console.info('scene change:', isSceneChange, currentSceneId, previousSceneId);
    if (isStartOfAnimation || isSceneChange) {
      // 更新当前活动分镜ID
      // currentActiveShotId = currentShotId;
      // 更新上一个场景ID
      previousSceneId = currentSceneId;
      
      // 获取默认镜头设置
      currentDefaultShotScenery = app.defaultCameraScenery ? app.defaultCameraScenery.value : '全景';
      //更新上一个景别
      previousCameraType = currentDefaultShotScenery;

      // 获取默认镜头预设
      let defaultPreset = getCameraPreset(currentDefaultShotScenery);
      if (!defaultPreset) {
        defaultPreset = getCameraPreset(FULL_CAMERA_TYPE);
      }
      if (defaultPreset) {
        // 直接设置目标镜头宽高
        targetWidth = defaultPreset.width;
        targetHeight = defaultPreset.height;
        // 焦点设置为画布的中间点
        targetCenterX = canvas.width / 2;
        targetCenterY = canvas.height / 2;
        let targetX = targetCenterX - targetWidth / 2;
        let targetY = targetCenterY - targetHeight / 2;
        cameraX = targetX;
        cameraY = targetY;
        cameraWidth = targetWidth;
        cameraHeight = targetHeight;
        console.log('start or shift scene,set df camera type, focus to center:', currentDefaultShotScenery, targetWidth, targetHeight, cameraX, cameraY);
      }else{
        // 没有设置镜头轨道，使用默认镜头
        console.error(`can't set default camera type ${currentDefaultShotScenery}`);
      }
      return;
    }
    
    
    
    if (currentCameraTrack) {
      // 有设置镜头轨道，使用对应的预设
      const cameraType = currentCameraTrack.cameraType;
      console.log('镜头轨道 type:', cameraType);
      
      const preset = getCameraPreset(cameraType);
      if (!preset) {
        console.error('track cameraType not find in defined cameraPresets:', cameraType);
        return;
      }
      
      console.log('try find preset camera:', preset.name, preset.width, preset.height);
      previousCameraType = cameraType;
      targetWidth = preset.width;
      targetHeight = preset.height;

      // 如果有目标中心点设置，则使用，否则尝试找到当前说话角色的位置
      if (currentCameraTrack.targetX !== undefined && currentCameraTrack.targetY !== undefined 
        && (currentCameraTrack.targetX !=0  && currentCameraTrack.targetY !=0)
      ) {
        //TODO: 此处为复杂运镜逻辑，需要后续补充,需要根据targetX,y,width,height,计算目标中心点
        targetCenterX = currentCameraTrack.targetX;
        targetCenterY = currentCameraTrack.targetY;
        console.log('updateCameraOnPlayback targetCenterX:', targetCenterX, 'targetCenterY:', targetCenterY);
      } else {

        if(preset.name === FULL_CAMERA_TYPE) {
          // 全景镜头，默认居中
          targetCenterX = canvas.width / 2;
          targetCenterY = canvas.height / 2;
          console.log('全景镜头,默认居中,焦点:', targetCenterX, targetCenterY);
        }else{

          // 尝试找到当前时间点正在说话的角色
          let speakingRoleId = findCurrentSpeakerId(_currentTimeInt, currentShot);
          console.log('camera focus on speakingRoleId:', speakingRoleId);
          if (speakingRoleId != previousSpeakingRoleId) {
            previousSpeakingRoleId = speakingRoleId;
            // 查找该角色在当前时间点的表情轨道
            // 使用app传入的方法从轨道中查找当前时刻该角色ID对应的表情
            let currentExpressionPosition = findCurrentSpeakerIdPosition(_currentTimeInt, speakingRoleId);
            if (currentExpressionPosition.targetCenterX !== undefined && currentExpressionPosition.targetCenterY !== undefined) {
              // 角色位置信息存在，更新目标中心点
              targetCenterX = currentExpressionPosition.targetCenterX;
              targetCenterY = currentExpressionPosition.targetCenterY;
              console.log(`find ${speakingRoleId}  center: (${targetCenterX}, ${targetCenterY})`);
            }
            else {
              // 如果找不到角色位置信息，默认居中到画布
              targetCenterX = canvas.width / 2;
              targetCenterY = canvas.height / 2;
              console.error(`audio,current time ${_currentTimeInt} can't find role ${speakingRoleId} pos info!!!!!! use default centor (${targetCenterX}, ${targetCenterY})`);
            }
          } else {
            // 如果没有正在说话的角色，默认居中到画布
            targetCenterX = canvas.width / 2;
            targetCenterY = canvas.height / 2;
            console.log('当前时间点没有正在说话的角色，默认居中');
          }
        }
      }
      console.log('find track cameraType:', cameraType,targetWidth,targetHeight);

    } else {
      // 没有设置镜头轨道
      // 检查当前分镜是否发生变化
      const currentShotId = currentShot ? currentShot.id : null;
      console.log('no track camera type',currentShotId);
      // if (currentShotId !== currentActiveShotId) 
      {
        // 不是开始，也不是切场景，分镜切换不用改变景别，除非连续N次，可以尝试拉远一级别，先使用上一个景别
        currentActiveShotId = currentShotId;
        // 使用上一个景别，或默认
        if(previousCameraType != null){
          console.log('使用上一个景别:', previousCameraType);
          currentDefaultShotScenery = previousCameraType;
        }else{
          currentDefaultShotScenery = app.defaultCameraScenery ? app.defaultCameraScenery.value : '全景';
          console.log('使用默认景别:', currentDefaultShotScenery);
        }
      }
      const preset = getCameraPreset(currentDefaultShotScenery);
      // 使用存储的随机景别类型
      if (!preset) {
        console.error('currentDefaultShotScenery not find in defined cameraPresets:', currentDefaultShotScenery);
        preset = cameraPresets['全景'];
      }

      targetWidth = preset.width;
      targetHeight = preset.height;
      // if (currentShotId !== currentActiveShotId) {
      //   //分镜发生变化，要切换焦点, 人物变化，切换吧，分镜先不切换
      // }
      // 尝试找到当前时间点正在说话的角色
      let speakingRoleId = findCurrentSpeakerId(_currentTimeInt, currentShot);
      console.log('camera focus on speakingRoleId:', speakingRoleId,previousSpeakingRoleId);
      // 如果当前说话人物与上个说话人物不同，则切换，否则使用相同，如果没有说话人物，保持上次相同坐标
      if (speakingRoleId == null){
          //无说话人，不改变焦点
      }
      else if (speakingRoleId !== previousSpeakingRoleId) {
        // 说话人物切换，使用当前说话人物的位置
        previousSpeakingRoleId = speakingRoleId;
        let currentExpressionPosition = findCurrentSpeakerIdPosition(_currentTimeInt, speakingRoleId);
        if (currentExpressionPosition.targetCenterX !== undefined && currentExpressionPosition.targetCenterY !== undefined) {
          // 角色位置信息存在，更新目标中心点
          targetCenterX = currentExpressionPosition.targetCenterX;
          targetCenterY = currentExpressionPosition.targetCenterY;
          console.log(`find ${speakingRoleId}  center: (${targetCenterX}, ${targetCenterY})`);
        }else{
          //未找到新的说话人，保持上次位置
          console.log('未找到新的说话人，保持上次位置:', previousSpeakingRoleId,targetCenterX,targetCenterY);
        }
        
        // 居中到画布
        // targetCenterX = canvas.width / 2;
        // targetCenterY = canvas.height / 2;
      } else {
        // 说话人物未切换，保持上次位置
        // targetCenterX = previousTargetCenterX;
        // targetCenterY = previousTargetCenterY;
      }

      // 居中到画布
      // targetCenterX = canvas.width / 2;
      // targetCenterY = canvas.height / 2;

      //没有设置镜头轨道 处理完
    }

    console.log('未处理前镜头 cameraX:', cameraX, 'cameraY:', cameraY, 'cameraWidth:', cameraWidth, 'cameraHeight:', cameraHeight);
    console.log('未处理前镜头 targetCenterX:', targetCenterX, 'targetCenterY:', targetCenterY,'targetWidth:', targetWidth, 'targetHeight:', targetHeight);
    // 计算目标位置
    let targetX = targetCenterX - targetWidth / 2;
    let targetY = targetCenterY - targetHeight / 2;
    //targetY = screen.height - targetY;// 坐标转换，AE坐标系统Y轴向下为正，而Canvas坐标系统Y轴向上为正
    console.log('目标位置 targetX:', targetX, 'targetY:', targetY, 'targetWidth:', targetWidth, 'targetHeight:', targetHeight);
    // 根据时间进行不同的过渡处理
    if (_currentTimeInt === 0) {
      // 如果当前是0s，直接设置目标镜头的宽高
      cameraX = targetX;
      cameraY = targetY;
      cameraWidth = targetWidth;
      cameraHeight = targetHeight;
      console.log('直接设置镜头 cameraX:', cameraX, 'cameraY:', cameraY, 'cameraWidth:', cameraWidth, 'cameraHeight:', cameraHeight);
    } else {
      // 否则，根据当前时间与镜头轨道开始时间对比，进行0.3秒内线性过渡
      const transitionDuration = 0.3; // 过渡持续时间
      const cameraTrackStartTime = currentCameraTrack ? currentCameraTrack.startTime + currentShot.startTime : 0;
      const timeSinceStart = (_currentTimeInt - cameraTrackStartTime)/1000;
      console.log('currentCameraTrack',currentCameraTrack);
      console.log('插值计算镜头 timeSinceStart:', timeSinceStart, 'cameraTrackStartTime:',cameraTrackStartTime,'transitionDuration:', transitionDuration);
      
      if (timeSinceStart <= transitionDuration && timeSinceStart >= 0) {
        // 在过渡时间内，使用线性插值
        const progress = timeSinceStart / transitionDuration;
        cameraX = cameraX + (targetX - cameraX) * progress;
        cameraY = cameraY + (targetY - cameraY) * progress;
        cameraWidth = cameraWidth + (targetWidth - cameraWidth) * progress;
        cameraHeight = cameraHeight + (targetHeight - cameraHeight) * progress;
      } else if (timeSinceStart > transitionDuration) {
        // 过渡完成，直接设置目标值
        cameraX = targetX;
        cameraY = targetY;
        cameraWidth = targetWidth;
        cameraHeight = targetHeight;
      } else {
        // 如果当前时间小于轨道开始时间，保持当前值不变
        // 这种情况可能发生在时间回退时
      }

    }
    
    // 确保镜头不超出画布范围
    if (canvas.width && canvas.height) {
      // 限制宽度和高度不超过画布
      if (cameraWidth > canvas.width) cameraWidth = canvas.width;
      if (cameraHeight > canvas.height) cameraHeight = canvas.height;
      
      // 限制位置
      if (cameraX < 0) cameraX = 0;
      if (cameraY < 0) cameraY = 0;
      if (cameraX + cameraWidth > canvas.width) cameraX = canvas.width - cameraWidth;
      if (cameraY + cameraHeight > canvas.height) cameraY = canvas.height - cameraHeight;
    }
    console.log('处理后镜头 cameraX:', cameraX, 'cameraY:', cameraY, 'cameraWidth:', cameraWidth, 'cameraHeight:', cameraHeight);

    //console.log('updateCamera pos:', cameraX, cameraY);
    // 更新预览画布（如果存在）
    // if (previewCanvas && previewCanvas.value) {
    //   previewCanvas.value.width = targetWidth;
    //   previewCanvas.value.height = targetHeight;
    // }
  };
  
  // 返回摄像机模块的公共接口
  return {
    cameraWidth,
    cameraHeight,
    cameraX,
    cameraY,
    showCameraClick,
    showCameraPreviewClick,
    closeCameraPreview,
    resetCamera,
    drawCamera,
    setupCameraPreviewDrag,
    setupCameraEvents,
    updateCameraPreview,
    forceUpdateCameraPreview,
    toggleAspectRatio,
    toggleCameraRotation,
    toggleCameraInfo,
    zoomCamera,
    rotateCamera,
    applyCameraPreset,
    saveCameraPreset,
    deleteCameraPreset,
    watchCameraSize,
    updateCameraOnPlayback
  };
}