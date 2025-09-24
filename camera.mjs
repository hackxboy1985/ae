// 摄像机相关功能模块
import {  round, getCacheImage, CUSTOM_CAMERA_TYPE } from './utils.mjs';

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
  const showCameraClick = (value) => {
    //console.log('showCameraClick:',value)
    if(value != undefined){
      showCamera.value = value;
    }else
      showCamera.value = !showCamera.value;

    renderFrame(31);
  };
  
  // 显示/隐藏摄像机预览
  const showCameraPreviewClick = () => {
    showCameraPreview.value = !showCameraPreview.value;
    // console.log('showCameraPreviewClick showCameraPreview.value:', showCameraPreview.value);
    
    // 使用try-catch包装setTimeout回调，确保异常能够被捕获和显示
    setTimeout(() => {
      try {
        setupCameraPreviewDrag();
        if (showCameraPreview.value) {
          // 必须设置，否则会有异常
          previewCtx = null;
        }
        app.renderFrame(31);
        //updateCameraPreview();
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
      
      console.log('cameraMoudle click this:',this)
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
  

  // 字幕相关变量
  let currentSubtitle = '';        // 当前显示的字幕
  let subtitleSegments = [];       // 分段后的台词数组
  let subtitleSegmentsRange = [];   // 分段后的台词时间范围数组
  let currentSubtitleIndex = 0;    // 当前显示的段落索引
  let subtitleTimer = null;        // 字幕切换定时器
  let needsSubtitleUpdate = false; // 是否需要更新字幕
  let currentAudio = null; // 当前正在播放的音频对象
  
  
  // 台词显示管理函数
  // 参数：currentAudio - 当前音频对象，包含text属性的台词
  const manageSubtitleDisplay = (_currentAudio,_currentShotStartTime) => {
    
    if (!_currentAudio || !_currentAudio.text) {
      // 没有台词文本，不显示
      return;
    }

    if(_currentAudio === currentAudio){
      return;
    }

    // 清除现有的字幕显示状态
    if (subtitleTimer) {
      clearTimeout(subtitleTimer);
      subtitleTimer = null;
    }
    currentSubtitleIndex = 0;
    subtitleSegments = [];
    subtitleSegmentsRange = [];
    currentAudio = _currentAudio;

    //console.log('处理台词分段');
    
    const fullText = _currentAudio.text;
    
    // 分段逻辑：根据标点符号分段
    // 匹配中文和英文常见的标点符号
    const punctuationRegex = /([。！？.!?，,；;：:])/g;
    let segments = [];
    let lastIndex = 0;
    
    // 使用exec循环查找所有标点符号

    let match;
    while ((match = punctuationRegex.exec(fullText)) !== null) {
      const segment = fullText.substring(lastIndex, punctuationRegex.lastIndex).trim();
      
      if (segment) {
        // 检查从标点符号往前是否超过10个字符
        const textBeforePunctuation = fullText.substring(lastIndex, match.index);
        //console.log('处理台词分段:',textBeforePunctuation,textBeforePunctuation.length,'segment:',segment)
        // if (textBeforePunctuation.length > 10) {
        //   // 需要在标点符号前分割
        //   segments.push(textBeforePunctuation /*+ match[0]*/);//不要标点
        // } else {
        //   // 可以接受这个片段
        //   segments.push(segment);
        // }
        // console.log('match[0]:', match[0]);
        if('?' === match[0].trim() || '？' === match[0].trim() ){
          segments.push(segment);
        }else
          segments.push(textBeforePunctuation);
      }
      
      lastIndex = punctuationRegex.lastIndex;
    }
    
    // 处理最后一个没有标点符号的部分
    if (lastIndex < fullText.length) {
      const lastSegment = fullText.substring(lastIndex).trim();
      if (lastSegment) {
        segments.push(lastSegment);
      }
    }
    
    // 如果没有通过标点符号分段，按字符长度大致分段
    if (segments.length === 0) {
      // 简单的按固定长度分段
      const maxSegmentLength = 20;
      for (let i = 0; i < fullText.length; i += maxSegmentLength) {
        segments.push(fullText.substring(i, i + maxSegmentLength));
      }
    }
    
    // 保存分段结果
    subtitleSegments = segments;
    // console.log('subtitleSegments:', subtitleSegments);

    // 开始显示第一段
    //displayNextSubtitle(_currentShotStartTime + _currentAudio.startTime);
    const baseStartTime = _currentShotStartTime + _currentAudio.startTime;
    const preWordTime = 220;
    let latestWordTime = baseStartTime;
    for(let i=0;i<subtitleSegments.length;i++){
      const segment = subtitleSegments[i];
      const startTime = latestWordTime;
      const endTime = startTime + segment.length*preWordTime;
      latestWordTime = endTime+2;
      subtitleSegmentsRange.push({
        text: segment,
        startTime,
        endTime,
      })
    }
    console.log('subtitleSegmentsRange:', subtitleSegmentsRange); 
  };
  
  // 显示下一段台词
  // const displayNextSubtitle = (_currentAudioStartTime = -1) => {
  //   if (currentSubtitleIndex <= subtitleSegments.length) {
  //     currentSubtitle = subtitleSegments[currentSubtitleIndex];
  //     currentSubtitleIndex++;
  //     subtitleSegmentsRange.push({
  //       text: currentSubtitle,
  //       startTime: _currentAudioStartTime,
  //       endTime: _currentAudioStartTime + currentSubtitle.length*220,
  //     })
  //     // 标记需要更新字幕
  //     needsSubtitleUpdate = true;
      
  //     // const timeout = currentSubtitle.length*220;
  //     // console.log('displayNextSubtitle:',timeout)
  //     // 设置定时器显示下一段
  //     // subtitleTimer = setTimeout(displayNextSubtitle, timeout); // 每段显示3秒
  //   } else {
  //     // 所有段落显示完毕，清除当前字幕
  //     currentSubtitle = '';
  //     needsSubtitleUpdate = false;
  //   }
  // };
  
  const getCurrentSubtitle = (_currentTimeInt = -1) => {
    if(subtitleSegmentsRange.length === 0){
      return '';
    }
    for(let i=0;i<subtitleSegmentsRange.length;i++){
      const segment = subtitleSegmentsRange[i];
      if(_currentTimeInt >= segment.startTime && _currentTimeInt < segment.endTime){
        return segment.text;
      }
    }
    return '';
  }

  // 在预览Canvas上绘制字幕
  const drawSubtitle = (_currentTimeInt = -1) => {
    if (_currentTimeInt== -1 || /*!needsSubtitleUpdate || !currentSubtitle || */ !previewCtx || !previewCanvas.value) {
      //console.log('drawTitle:',needsSubtitleUpdate,currentSubtitle)
      return;
    }
    currentSubtitle = getCurrentSubtitle(_currentTimeInt)
    const canvasWidth = previewCanvas.value.width;
    const canvasHeight = previewCanvas.value.height;
    
    // 计算字幕区域的高度（约占画布高度的1/5）
    const subtitleAreaHeight = Math.min(canvasHeight * 0.1, 160);
    const subtitleY = canvasHeight - subtitleAreaHeight + 10;
    //console.log('drawTitle:',currentSubtitle,'subtitleY:',subtitleY,'subtitleAreaHeight：',subtitleAreaHeight,'canvasHeight:',canvasHeight)
    // 清除字幕区域
    //previewCtx.clearRect(0, canvasHeight - subtitleAreaHeight, canvasWidth, subtitleAreaHeight);
    
    // 设置文本样式
    previewCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    previewCtx.font = '40px Arial';
    previewCtx.textAlign = 'center';
    previewCtx.textBaseline = 'middle';
    
    // // 绘制半透明背景
    // const textMetrics = previewCtx.measureText(currentSubtitle);
    // const padding = 10;
    // const backgroundX = (canvasWidth - textMetrics.width - padding * 2) / 2;
    // const backgroundY = subtitleY - 10;
    // const backgroundWidth = textMetrics.width + padding * 2;
    // const backgroundHeight = 28;
    
    // previewCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    // previewCtx.beginPath();
    // previewCtx.roundRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight, 4);
    // previewCtx.fill();
    
    // 绘制文本
    previewCtx.fillStyle = 'white';
    previewCtx.fillText(currentSubtitle, canvasWidth / 2, subtitleY);
    
    // 重置更新标志
    // needsSubtitleUpdate = false;
  };
  

  // 更新相机预览
  const updateCameraPreview = (_currentTimeInt = -1) => {
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
      // console.log('updateCameraPreview cameraX', cameraX, 'cameraY', cameraY, 'cameraWidth', cameraWidth, 'cameraHeight', cameraHeight)
      // 从离屏画布复制摄像机区域的内容到预览画布
      // 注意：源坐标系使用左下角为原点，需要转换为左上角为原点的坐标系
      const sourceY = offscreenCanvas.height - cameraY - cameraHeight;
      previewCtx.drawImage(
        offscreenCanvas,
        cameraX, sourceY, cameraWidth, cameraHeight, // 源区域（已转换坐标系）
        0, 0, outputCameraWidth, outputCameraHeight // 目标区域
      );
    } catch (error) {
      console.error('复制预览内容出错:', error);
    }
    if(_currentTimeInt>=0){
      // 绘制字幕
      drawSubtitle(_currentTimeInt);
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
      // console.log('drawCamera > cameraX', cameraX, 'cameraY:',cameraY,'cameraY(左下角坐标系)', bottomLeftY, 'cameraWidth', cameraWidth, 'cameraHeight', cameraHeight);

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
    //console.log('applyCameraPreset:', preset);
    if (preset) {
      cameraPresets.value.forEach((item) => {
        //console.log('tt:', item.name ,preset);
        if (item.name === preset) {
          preset = item;
          //console.log('ee:', item);
        }
      })
      //console.log('cameraPresets:', cameraPresets);
      //console.log('applyCameraPreset:', preset,preset.width,preset.height);

      //改变摄像机预设时，焦点不变
      const cameraCenterX = cameraX + cameraWidth / 2;
      const cameraCenterY = cameraY + cameraHeight / 2;
      cameraWidth = preset.width || cameraWidth;
      cameraHeight = preset.height || cameraHeight;
      cameraX = cameraCenterX - cameraWidth / 2;
      cameraY = cameraCenterY - cameraHeight / 2;
      //cameraRotation.value = preset.rotation || cameraRotation.value;
      console.log('set camera cameraX',cameraX,'cameraY',cameraY,'cameraWidth',cameraWidth,'cameraHeight',cameraHeight);

      // app.cameraX = cameraX;
      // app.cameraY = cameraY;
      // app.cameraWidth = cameraWidth;
      // app.cameraHeight = cameraHeight;
      // console.log('set camera preset:', preset.name, preset.width, preset.height,'cameraWidth:',cameraWidth,'cameraHeight:',cameraHeight,'app.cameraWidth:',app.cameraWidth,'app.cameraHeight:',app.cameraHeight,'app.cameraX:',app.cameraX,'app.cameraY:',app.cameraY);
      console.log('set camera preset:', preset.name, preset.width, preset.height);
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
      updateCameraPreview(-2);
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
      // console.log('isDraggingCamera:',isDraggingCamera);
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
        //console.log('dragCamera pos:', cameraX, cameraY);
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

  const findCurrentSpeakerIdPosition = (_currentTimeInt, speakingRoleId) => {
    let currentExpressionTrack = null;
    let targetCenterX = null;
    let targetCenterY = null;
    if (app.getExpressionTrackByRoleId) {
      currentExpressionTrack = app.getExpressionTrackByRoleId(speakingRoleId, _currentTimeInt, false);
      // console.log('camera focus on trace expression:', currentExpressionTrack);
    } else {
      console.warn('app.getExpressionTrackByRoleId方法未定义');
    }
          
    if (currentExpressionTrack && currentExpressionTrack.x !== undefined && currentExpressionTrack.y !== undefined) {
      // 使用角色位置及当前帧宽高计算出角色中间点作为目标中心点
      const position = app.calculateCurrentExpressPosition(currentExpressionTrack,_currentTimeInt);
      const roleWidth = position.width || currentExpressionTrack.width || 0;
      const roleHeight = position.height || currentExpressionTrack.height || 0;
      const scale = currentExpressionTrack.scale || 1;
      
      //console.log('findCurrentSpeakerIdPosition > currentExpressionTrack:',currentExpressionTrack,'position:',position,'roleWidth:',roleWidth,'roleHeight:',roleHeight);
      targetCenterX = currentExpressionTrack.x + (roleWidth * scale) / 2;
      targetCenterY = currentExpressionTrack.y + (roleHeight * scale) / 2;
      // console.log(`currentTime:${_currentTimeInt}, 找到说话角色 ${speakingRoleId} 的位置: (${currentExpressionTrack.x}, ${currentExpressionTrack.y})`);
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
  let needShiftCamera = false;//是否需要切换镜头
  let shiftCameraStartTime = 0;//当前镜头轨道开始时间
  const FULL_CAMERA_TYPE = '全景';



  
  // 根据当前时间更新摄像机设置
  const updateCameraOnPlayback_old = (_currentTimeInt, timeline) => {
    if (!timeline || !timeline.shots || !canvas || !canvas.width || !canvas.height) {
      return;
    }

     console.log('app.enableCameraEdit:',app.enableCameraEdit.value);
    if(app.enableCameraEdit.value)
      return;    

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
      if(!needShiftCamera){
        needShiftCamera = true;
        shiftCameraStartTime = _currentTimeInt;
      }
      
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
    
    
    console.log('镜头 时间:', _currentTimeInt);

    if (currentCameraTrack) {
      // 有设置镜头轨道，使用对应的预设
      const cameraType = currentCameraTrack.cameraType;
      console.log('1、镜头轨道 type:', cameraType);
      
      const preset = getCameraPreset(cameraType);
      // if (!preset) {
      //   console.error('track cameraType not find in defined cameraPresets:', cameraType);
      // }
      
      if(preset){
        console.log('try find preset camera:', preset.name, preset.width, preset.height);
        previousCameraType = cameraType;
        targetWidth = preset.width;
        targetHeight = preset.height;
      }else if(cameraType === CUSTOM_CAMERA_TYPE) {
        targetWidth = currentCameraTrack.width;
        targetHeight = currentCameraTrack.height;
      }

      console.log('currentCameraTrack:', currentCameraTrack,currentCameraTrack.x,currentCameraTrack.y);
      // 如果有目标中心点设置，则使用，否则尝试找到当前说话角色的位置
      if (currentCameraTrack.x !== undefined && currentCameraTrack.x !== undefined 
        && (currentCameraTrack.x !=0  && currentCameraTrack.x !=0)
      ) {
        //TODO: 此处为复杂运镜逻辑，需要后续补充,需要根据targetX,y,width,height,计算目标中心点
        targetCenterX = currentCameraTrack.x + currentCameraTrack.width / 2;
        targetCenterY = currentCameraTrack.y + currentCameraTrack.height / 2;
        console.log('指定镜头轨道 targetCenterX:', targetCenterX, 'targetCenterY:', targetCenterY);
      } else {

        if(preset && preset.name === FULL_CAMERA_TYPE) {
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
            console.log('currentExpressionPosition:',_currentTimeInt,speakingRoleId,currentExpressionPosition);
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
      console.log('1、无镜头轨道:',currentShotId);
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
      console.log('camera focus on speakingRoleId:', speakingRoleId,',last speaker',previousSpeakingRoleId);
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
  
  // ====== 判断逻辑 ======  
  function updateCameraJudgmentLogic(_currentTimeInt, timeline, app, canvas, cameraModuleState) {
    // 初始化变量
    let { previousCameraType, previousSpeakingRoleId, needShiftCamera, shiftCameraStartTime } = cameraModuleState;
    let currentCameraTrack = null;
    let currentShot = null;
    let targetWidth = cameraModuleState.cameraWidth;
    let targetHeight = cameraModuleState.cameraHeight;
    let targetCenterX = cameraModuleState.cameraX + cameraModuleState.cameraWidth / 2;
    let targetCenterY = cameraModuleState.cameraY + cameraModuleState.cameraHeight / 2;
    
    // 1. 基础条件检查
    if (!timeline || !timeline.shots || !canvas || !canvas.width || !canvas.height) {
      return null;
    }
    
    if (app.enableCameraEdit.value) {
      return null;
    }
    
    
    
    // 2. 查找当前时间点对应的镜头轨道和分镜
    for (const shot of timeline.shots) {
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
    
    // 3. 根据镜头总规则判断当前应使用的景别
    const currentScene = findSceneByShot(currentShot, timeline);
    const currentSceneId = currentScene ? currentScene.id : null;
    const isStartOfAnimation = _currentTimeInt === 0;
    const isSceneChange = currentSceneId !== cameraModuleState.previousSceneId;
    
    // 优化：检查是否正在执行轨道镜头差值计算，如果是则直接返回
    // 先简单查找当前时间点对应的镜头轨道
    // for (const shot of timeline.shots) {
    //   const shotStartTime = shot.startTime || 0;
    //   const shotEndTime = shotStartTime + (shot.duration || 0);
      
    //   if (_currentTimeInt >= shotStartTime && _currentTimeInt <= shotEndTime) {
    //     currentShot = shot;
        
    //     if (shot.cameraTracks && Array.isArray(shot.cameraTracks)) {
    //       for (const cameraTrack of shot.cameraTracks) {
    //         const trackStartTime = shotStartTime + (cameraTrack.startTime || 0);
    //         const transitionDuration = 0.3; // 过渡持续时间（秒）
    //         const transitionEndTime = trackStartTime + transitionDuration * 1000; // 转换为毫秒
            
    //         // 如果当前时间在轨道开始后的过渡时间内，表示正在进行差值计算
    //         if (!isStartOfAnimation && !isSceneChange && _currentTimeInt >= trackStartTime && _currentTimeInt <= transitionEndTime) {
    //           console.log('当前过度中，跳过判断逻辑');
    //           return null; // 跳过判断逻辑，继续使用之前的差值计算结果
    //         }
    //       }
    //     }
    //     break;
    //   }
    // }


    // 规则1: 开场默认镜头或场景切换
    if (isStartOfAnimation || isSceneChange) {
      if (!needShiftCamera) {
        needShiftCamera = true;
        shiftCameraStartTime = _currentTimeInt;
      }
      
      // 更新上一个场景ID和景别
      cameraModuleState.previousSceneId = currentSceneId;
      cameraModuleState.currentDefaultShotScenery = app.defaultCameraScenery ? app.defaultCameraScenery.value : '全景';
      cameraModuleState.previousCameraType = cameraModuleState.currentDefaultShotScenery;
      
      // 获取默认镜头预设
      let defaultPreset = getCameraPreset(cameraModuleState.currentDefaultShotScenery);
      if (!defaultPreset) {
        defaultPreset = getCameraPreset('全景');
      }
      
      if (defaultPreset) {
        targetWidth = defaultPreset.width;
        targetHeight = defaultPreset.height;
        targetCenterX = canvas.width / 2;
        targetCenterY = canvas.height / 2;
      }
      
      return {
        currentCameraTrack,
        currentShot,
        targetWidth,
        targetHeight,
        targetCenterX,
        targetCenterY,
        isSceneChange: true
      };
    }
    
    // 规则2: 有设置镜头轨道的镜头
    if (currentCameraTrack) {
      const cameraType = currentCameraTrack.cameraType;
      cameraModuleState.previousCameraType = cameraType;
      
      const preset = getCameraPreset(cameraType);
      if (preset) {
        targetWidth = preset.width;
        targetHeight = preset.height;
      } else if (cameraType === CUSTOM_CAMERA_TYPE) {
        targetWidth = currentCameraTrack.width;
        targetHeight = currentCameraTrack.height;
      }
      
      // 判断焦点位置
      if (currentCameraTrack.x !== undefined && currentCameraTrack.y !== undefined && 
          (currentCameraTrack.x != 0 || currentCameraTrack.y != 0)) {
        // 有指定目标位置
        targetCenterX = currentCameraTrack.x + currentCameraTrack.width / 2;
        targetCenterY = currentCameraTrack.y + currentCameraTrack.height / 2;
      } else if (preset && preset.name === '全景') {
        // 全景镜头，默认居中
        targetCenterX = canvas.width / 2;
        targetCenterY = canvas.height / 2;
      }
      //console.log('规则2: 有设置镜头轨道的镜头', 'currentTime:',_currentTimeInt,'',cameraType, '焦点:',targetCenterX, targetCenterY);
    } else if(findCurrentSpeakerId(_currentTimeInt, currentShot) != null){
      // 规则3: 无设置镜头但当前有对话的规则
      let speakingRoleId = findCurrentSpeakerId(_currentTimeInt, currentShot);
      let dialogCameraType = app.defaultDialogCameraScenery ? app.defaultDialogCameraScenery.value : '近景';//使用默认对话镜头配置，默认近景
      //console.log('使用对话镜头:', app.defaultDialogCameraScenery,dialogCameraType)
      // if (speakingRoleId != previousSpeakingRoleId) 
      {
        
        cameraModuleState.previousSpeakingRoleId = speakingRoleId;
        
        let currentExpressionPosition = findCurrentSpeakerIdPosition(_currentTimeInt, speakingRoleId);
        if (currentExpressionPosition.targetCenterX !== undefined && currentExpressionPosition.targetCenterY !== undefined) {
          targetCenterX = currentExpressionPosition.targetCenterX;
          targetCenterY = currentExpressionPosition.targetCenterY;
          //console.log('说话人物：',speakingRoleId,'targetCenterX',targetCenterX,'targetCenterY',targetCenterY)
        } else {
          // 未找到当前对话焦点，切换到默认焦点及中景
          targetCenterX = canvas.width / 2;
          targetCenterY = canvas.height / 2;
          dialogCameraType = '中景';
        }
      } 
      // else {
      //   // 对话未切换，仍然是刚才男主
      //   targetCenterX = canvas.width / 2;
      //   targetCenterY = canvas.height / 2;
      // }
      //TODO:缺少读取配置项：对话的默认景别
      const preset = getCameraPreset(dialogCameraType) || getCameraPreset('中');
      if (preset) {
        targetWidth = preset.width;
        targetHeight = preset.height;
      }else{
        console.error('dialog camera set err')
      }
      //console.log('规则3: 无设置镜头但当前有对话', 'currentTime:',_currentTimeInt,speakingRoleId, preset.name,'焦点:',targetCenterX, targetCenterY);
    } else {
      // 规则4: 无设置镜头轨道的情况
      const currentShotId = currentShot ? currentShot.id : null;
      cameraModuleState.currentActiveShotId = currentShotId;
      
      // 使用上一个景别或默认景别
      if (previousCameraType != null) {
        cameraModuleState.currentDefaultShotScenery = previousCameraType;
      } else {
        cameraModuleState.currentDefaultShotScenery = app.defaultCameraScenery ? app.defaultCameraScenery.value : '全景';
      }
      //console.log('cameraModuleState.currentDefaultShotScenery:',_currentTimeInt,cameraModuleState.currentDefaultShotScenery, 'getCameraPreset-全景',getCameraPreset('全景'))
      const preset = getCameraPreset(cameraModuleState.currentDefaultShotScenery) || getCameraPreset('全景');
      // console.log('preset:',preset)
      targetWidth = preset.width;
      targetHeight = preset.height;
      
      // 判断焦点位置
      let speakingRoleId = findCurrentSpeakerId(_currentTimeInt, currentShot);
      if (speakingRoleId == null) {
        // 无说话人，不改变焦点
      } else if (speakingRoleId !== previousSpeakingRoleId) {
        // 说话人物切换，使用当前说话人物的位置
        cameraModuleState.previousSpeakingRoleId = speakingRoleId;
        
        let currentExpressionPosition = findCurrentSpeakerIdPosition(_currentTimeInt, speakingRoleId);
        if (currentExpressionPosition.targetCenterX !== undefined && currentExpressionPosition.targetCenterY !== undefined) {
          targetCenterX = currentExpressionPosition.targetCenterX;
          targetCenterY = currentExpressionPosition.targetCenterY;
        } else {
          // 未找到新的说话人，保持上次位置
        }
      } else {
        // 说话人物未切换，保持上次位置
      }
      //console.log('规则4: 无设置镜头轨道的情况', 'currentTime:',_currentTimeInt, cameraModuleState.currentDefaultShotScenery, targetCenterX, targetCenterY);
    }
    
    return {
      currentCameraTrack,
      currentShot,
      targetWidth,
      targetHeight,
      targetCenterX,
      targetCenterY,
      isSceneChange: false
    };
  }

  // ====== 执行逻辑 ======
  function updateCameraExecutionLogic(_currentTimeInt, judgmentResult, cameraModuleState, canvas) {
    if (!judgmentResult) {
      return;
    }
    
    const { currentCameraTrack, currentShot, targetWidth, targetHeight, targetCenterX, targetCenterY, isSceneChange } = judgmentResult;
    
    // 1. 计算目标位置
    let targetX = targetCenterX - targetWidth / 2;
    let targetY = targetCenterY - targetHeight / 2;
    
    // 2. 根据当前时间与镜头轨道开始时间对比，进行线性过渡
    if (_currentTimeInt === 0 || isSceneChange) {
      // 如果当前是0s或场景切换，直接设置目标镜头的宽高
      cameraModuleState.cameraX = targetX;
      cameraModuleState.cameraY = targetY;
      cameraModuleState.cameraWidth = targetWidth;
      cameraModuleState.cameraHeight = targetHeight;
    } else {
      // 否则，根据当前时间与镜头轨道开始时间对比，进行0.3秒内线性过渡
      const transitionDuration = 0.3; // 过渡持续时间
      const cameraTrackStartTime = currentCameraTrack ? (currentCameraTrack.startTime || 0) + (currentShot.startTime || 0) : 0;
      const timeSinceStart = (_currentTimeInt - cameraTrackStartTime) / 1000; // 转换为秒
      
      if (timeSinceStart <= transitionDuration && timeSinceStart >= 0) {
        // 在过渡时间内，使用线性插值
        const progress = timeSinceStart / transitionDuration;
        cameraModuleState.cameraX = cameraModuleState.cameraX + (targetX - cameraModuleState.cameraX) * progress;
        cameraModuleState.cameraY = cameraModuleState.cameraY + (targetY - cameraModuleState.cameraY) * progress;
        cameraModuleState.cameraWidth = cameraModuleState.cameraWidth + (targetWidth - cameraModuleState.cameraWidth) * progress;
        cameraModuleState.cameraHeight = cameraModuleState.cameraHeight + (targetHeight - cameraModuleState.cameraHeight) * progress;
      } else if (timeSinceStart > transitionDuration) {
        // 过渡完成，直接设置目标值
        cameraModuleState.cameraX = targetX;
        cameraModuleState.cameraY = targetY;
        cameraModuleState.cameraWidth = targetWidth;
        cameraModuleState.cameraHeight = targetHeight;
      }
    }
    
    // 3. 确保镜头不超出画布范围
    if (canvas.width && canvas.height) {
      // 限制宽度和高度不超过画布
      if (cameraModuleState.cameraWidth > canvas.width) {
        cameraModuleState.cameraWidth = canvas.width;
      }
      if (cameraModuleState.cameraHeight > canvas.height) {
        cameraModuleState.cameraHeight = canvas.height;
      }
      
      // 限制位置
      if (cameraModuleState.cameraX < 0) {
        cameraModuleState.cameraX = 0;
      }
      if (cameraModuleState.cameraY < 0) {
        cameraModuleState.cameraY = 0;
      }
      if (cameraModuleState.cameraX + cameraModuleState.cameraWidth > canvas.width) {
        cameraModuleState.cameraX = canvas.width - cameraModuleState.cameraWidth;
      }
      if (cameraModuleState.cameraY + cameraModuleState.cameraHeight > canvas.height) {
        cameraModuleState.cameraY = canvas.height - cameraModuleState.cameraHeight;
      }
    }
  }

  // ====== 更新后的摄像机更新函数 ======
  // 创建状态对象来存储需要在判断和执行逻辑之间共享的状态
  const cameraModuleState = {
    cameraX: 0,
    cameraY: 0,
    cameraWidth: cameraWidth,
    cameraHeight: cameraHeight,
    previousSceneId: null,
    previousCameraType: null,
    previousSpeakingRoleId: null,
    needShiftCamera: false,
    shiftCameraStartTime: 0,
    currentActiveShotId: null,
    currentDefaultShotScenery: currentDefaultShotScenery
  };

  // 更新原有的updateCameraOnPlayback函数，使其使用拆解后的逻辑
  function updateCameraOnPlayback(_currentTimeInt, timeline) {
    // 同步当前状态到状态对象
    cameraModuleState.cameraX = cameraX;
    cameraModuleState.cameraY = cameraY;
    cameraModuleState.cameraWidth = cameraWidth;
    cameraModuleState.cameraHeight = cameraHeight;
    
    // 1. 判断逻辑：确定目标景别和参数
    const judgmentResult = updateCameraJudgmentLogic(_currentTimeInt, timeline, app, canvas, cameraModuleState);
 
    if(judgmentResult != null){
      // console.log('judgmentResult', judgmentResult);
    }
    // 2. 执行逻辑：根据判断结果更新摄像机位置和参数
    updateCameraExecutionLogic(_currentTimeInt, judgmentResult, cameraModuleState, canvas);
    
    // 同步更新后的状态回原始变量
    cameraX = cameraModuleState.cameraX;
    cameraY = cameraModuleState.cameraY;
    cameraWidth = cameraModuleState.cameraWidth;
    cameraHeight = cameraModuleState.cameraHeight;
    currentDefaultShotScenery = cameraModuleState.currentDefaultShotScenery;
    currentActiveShotId = cameraModuleState.currentActiveShotId;
    // console.log('cameraX', cameraX,'cameraY',cameraY,cameraWidth,cameraHeight)
  }


  // 返回摄像机模块的公共接口
  return {
    // 将原始值包装在getter中，确保每次访问都能获取最新值
    get cameraWidth() { return cameraWidth; },
    get cameraHeight() { return cameraHeight; },
    get cameraX() { return cameraX; },
    get cameraY() { return cameraY; },
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
    updateCameraOnPlayback,
    manageSubtitleDisplay,
  };
}