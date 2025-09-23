// 动画编辑器项目摄像机系统分析报告

// 第一部分：摄像机系统初始化分析

// 初始化位置：在index.html的Vue组件setup函数中（大约1000-1150行）

// 摄像机系统变量初始化
const cameraSystemInitialization = {
  // 1. 基础控制变量
  controlVariables: {
    showCamera: { desc: '控制是否显示摄像机UI', defaultValue: 'false', type: 'ref' },
    showCameraPreview: { desc: '控制是否显示相机预览', defaultValue: 'false', type: 'ref' },
    showCameraTrack: { desc: '控制是否显示镜头轨道', defaultValue: 'true', type: 'ref' },
    enableCameraEdit: { desc: '控制是否启用摄像机编辑功能', defaultValue: 'false', type: 'ref' }
  },
  
  // 2. 摄像机尺寸和视口变量
  sizeVariables: {
    cameraSizes: { 
      desc: '预设的摄像机尺寸选项数组', 
      defaultValue: '[{"name": "854 × 480", "width": 854, "height": 480},{"name": "1280 × 720", "width": 1280, "height": 720},{"name": "1920 × 1080", "width": 1920, "height": 1080},{"name": "2560 × 1440", "width": 2560, "height": 1440}]', 
      type: 'ref'
    },
    cameraWidth: { desc: '当前摄像机宽度', defaultValue: '1920 (cameraSizes.value[2].width)', type: '普通变量' },
    cameraHeight: { desc: '当前摄像机高度', defaultValue: '1080 (cameraSizes.value[2].height)', type: '普通变量' },
    selectedCameraSize: { desc: '当前选中的摄像机尺寸', defaultValue: 'cameraSizes.value[2] (1920×1080)', type: 'ref' }
  },
  
  // 3. 摄像机变换变量
  transformVariables: {
    cameraZoom: { desc: '摄像机缩放级别', defaultValue: '1', type: 'ref' },
    cameraRotation: { desc: '摄像机旋转角度', defaultValue: '0度', type: 'ref' },
    isMaintainingAspectRatio: { desc: '是否保持宽高比', defaultValue: 'true', type: 'ref' },
    useSmoothTransition: { desc: '是否使用平滑过渡', defaultValue: 'true', type: 'ref' }
  },
  
  // 4. 平滑过渡相关变量
  transitionVariables: {
    isTransitioning: { desc: '是否正在进行平滑过渡', defaultValue: 'false', type: '普通变量' },
    transitionStartTime: { desc: '过渡开始时间戳', defaultValue: '0', type: '普通变量' },
    transitionDuration: { desc: '过渡持续时间', defaultValue: '500毫秒', type: '普通变量' },
    targetCameraX: { desc: '目标摄像机X位置', defaultValue: '0', type: '普通变量' },
    targetCameraY: { desc: '目标摄像机Y位置', defaultValue: '0', type: '普通变量' },
    targetCameraZoom: { desc: '目标摄像机缩放级别', defaultValue: '1', type: '普通变量' },
    targetCameraRotation: { desc: '目标摄像机旋转角度', defaultValue: '0', type: '普通变量' },
    startCameraX: { desc: '过渡开始时的摄像机X位置', defaultValue: '0', type: '普通变量' },
    startCameraY: { desc: '过渡开始时的摄像机Y位置', defaultValue: '0', type: '普通变量' },
    startCameraZoom: { desc: '过渡开始时的摄像机缩放级别', defaultValue: '1', type: '普通变量' },
    startCameraRotation: { desc: '过渡开始时的摄像机旋转角度', defaultValue: '0', type: '普通变量' }
  },
  
  // 5. 镜头预设相关变量
  presetVariables: {
    cameraPresets: { 
      desc: '摄像机预设配置数组', 
      defaultValue: '[{"name": "特写", "width": 854, "height": 480, "rotation": 0},{"name": "近景", "width": 1080, "height": 635, "rotation": 0},{"name": "中景", "width": 1280, "height": 720, "rotation": 0},{"name": "全景", "width": 1920, "height": 1080, "rotation": 0}]',
      type: 'ref'
    },
    selectedCameraPreset: { desc: '当前选择的镜头预设', defaultValue: '', type: 'ref' },
    defaultCameraScenery: { desc: '默认镜别设置', defaultValue: '全景', type: 'ref' },
    defaultDialogCameraScenery: { desc: '默认对话镜别设置', defaultValue: '近景', type: 'ref' }
  }
};

// 第二部分：摄像机模块导入与初始化流程

/**
 * 摄像机模块初始化流程
 * 
 * 1. 通过ES模块动态导入camera.mjs
 * 2. 调用module.initCamera()方法初始化摄像机模块，传入必要的应用对象
 * 3. 获取摄像机模块导出的属性和方法引用
 * 4. 调用cameraModule.resetCamera()重置摄像机位置和尺寸
 * 5. 设置摄像机事件监听（setupCameraEvents）
 */
const cameraModuleInitFlow = `
// 初始化摄像机模块
let cameraModule;

// 使用ES模块导入摄像机模块
import('./camera.mjs').then(module => {
  try {
    // 传入必要的应用对象给摄像机模块
    cameraModule = module.initCamera({
      showCameraPreview,
      previewCanvas,
      cameraSizes,
      cameraZoom,
      cameraRotation,
      isMaintainingAspectRatio,
      enableCameraRotation,
      showCameraInfo,
      useSmoothTransition,
      cameraPresets,
      defaultCameraScenery,
      canvas,
      ctx,
      offscreenCanvas,
      offscreenCtx,
      renderFrame,
      selectedCameraSize,
      timeline,
      expressionManager,
      getExpressionTrackByRoleId,
      calculateCurrentExpressPosition,
      enableCameraEdit
    });
    
    // 更新引用
    cameraWidth = cameraModule.cameraWidth;
    cameraHeight = cameraModule.cameraHeight;
    let size = {
      'width':cameraWidth,
      'height':cameraHeight
    }
    cameraModule.resetCamera(size);
    
    // 在摄像机模块初始化后设置setupCameraEvents
    setupCameraEvents = cameraModule.setupCameraEvents;
    
    // 确保设置摄像机事件监听
    if (canvas.value && setupCameraEvents && typeof setupCameraEvents === 'function') {
      setupCameraEvents();
    }
  } catch (error) {
    console.error('init camera module err:', error);
  }
});`;

// 第三部分：localStorage数据持久化

/**
 * localStorage数据持久化
 * 
 * 存储的设置：
 * - defaultCameraScenery: 默认镜别设置
 * - defaultDialogCameraScenery: 默认对话镜别设置
 * 
 * 加载时机：组件挂载后（onMounted生命周期钩子）
 * 更新机制：当设置值改变时，自动同步到localStorage
 * 同步机制：使用Vue.nextTick确保DOM更新后，同步更新select元素值并触发change事件
 */
const localStoragePersistence = `
// 在组件挂载后
onMounted(() => {
  // 从localStorage加载保存的值
  // 加载默认镜头设置
  const savedValue = localStorage.getItem('defaultCameraScenery');
  if (savedValue) {
    defaultCameraScenery.value = savedValue;
  }
  
  // 加载默认对话镜头设置
  const savedDialogValue = localStorage.getItem('defaultDialogCameraScenery');
  if (savedDialogValue) {
    defaultDialogCameraScenery.value = savedDialogValue;
  }
  
  Vue.nextTick(() => {
    // 更新默认镜头select值
    const selectElement = document.querySelector('select[v-model="defaultCameraScenery"]');
    if (selectElement) {
      // 确保select值与defaultCameraScenery保持一致
      selectElement.value = defaultCameraScenery.value || '全景';
      // 触发change事件，确保Vue实例能够感知到这个变化
      const event = new Event('change', { bubbles: true });
      selectElement.dispatchEvent(event);
    }
    
    // 更新默认对话镜头select值
    const dialogSelectElement = document.querySelector('select[v-model="defaultDialogCameraScenery"]');
    if (dialogSelectElement) {
      // 确保select值与defaultDialogCameraScenery保持一致
      dialogSelectElement.value = defaultDialogCameraScenery.value || '近景';
      // 触发change事件，确保Vue实例能够感知到这个变化
      const dialogEvent = new Event('change', { bubbles: true });
      dialogSelectElement.dispatchEvent(dialogEvent);
    }
  });
});

// 当默认镜别改变时，将其存储到localStorage
watch(defaultCameraScenery, (newValue) => {
  localStorage.setItem('defaultCameraScenery', newValue);
});

// 当默认对话镜别改变时，将其存储到localStorage
watch(defaultDialogCameraScenery, (newValue) => {
  localStorage.setItem('defaultDialogCameraScenery', newValue);
});`;

// 第四部分：updateCameraOnPlayback函数逻辑拆解

// 原始函数定义位置: camera.mjs:958

// ====== 判断逻辑 ======
function updateCameraJudgmentLogic(_currentTimeInt, timeline, app, canvas, cameraModuleState) {
  // 初始化变量
  const { previousCameraType, previousSpeakingRoleId, needShiftCamera, shiftCameraStartTime } = cameraModuleState;
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
        (currentCameraTrack.x != 0 && currentCameraTrack.y != 0)) {
      // 有指定目标位置
      targetCenterX = currentCameraTrack.x + currentCameraTrack.width / 2;
      targetCenterY = currentCameraTrack.y + currentCameraTrack.height / 2;
    } else if (preset && preset.name === '全景') {
      // 全景镜头，默认居中
      targetCenterX = canvas.width / 2;
      targetCenterY = canvas.height / 2;
    } else {
      // 规则3: 无设置镜头轨道但当前有对话的规则
      let speakingRoleId = findCurrentSpeakerId(_currentTimeInt, currentShot);
      if (speakingRoleId != previousSpeakingRoleId) {
        cameraModuleState.previousSpeakingRoleId = speakingRoleId;
        
        let currentExpressionPosition = findCurrentSpeakerIdPosition(_currentTimeInt, speakingRoleId);
        if (currentExpressionPosition.targetCenterX !== undefined && currentExpressionPosition.targetCenterY !== undefined) {
          targetCenterX = currentExpressionPosition.targetCenterX;
          targetCenterY = currentExpressionPosition.targetCenterY;
        } else {
          // 规则4: 无设置镜头轨道且当前无对话规则
          targetCenterX = canvas.width / 2;
          targetCenterY = canvas.height / 2;
        }
      } else {
        // 规则4: 无设置镜头轨道且当前无对话规则
        targetCenterX = canvas.width / 2;
        targetCenterY = canvas.height / 2;
      }
    }
  } else {
    // 规则2: 无设置镜头轨道的情况
    const currentShotId = currentShot ? currentShot.id : null;
    cameraModuleState.currentActiveShotId = currentShotId;
    
    // 使用上一个景别或默认景别
    if (previousCameraType != null) {
      cameraModuleState.currentDefaultShotScenery = previousCameraType;
    } else {
      cameraModuleState.currentDefaultShotScenery = app.defaultCameraScenery ? app.defaultCameraScenery.value : '全景';
    }
    
    const preset = getCameraPreset(cameraModuleState.currentDefaultShotScenery) || cameraPresets['全景'];
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
    } else {
      // 如果当前时间小于轨道开始时间，保持当前值不变
      // 这种情况可能发生在时间回退时
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

// ====== 整合的更新函数 ======
function updatedUpdateCameraOnPlayback(_currentTimeInt, timeline, app, canvas, cameraModuleState) {
  // 1. 判断逻辑：确定目标景别和参数
  const judgmentResult = updateCameraJudgmentLogic(_currentTimeInt, timeline, app, canvas, cameraModuleState);
  
  // 2. 执行逻辑：根据判断结果更新摄像机位置和参数
  updateCameraExecutionLogic(_currentTimeInt, judgmentResult, cameraModuleState, canvas);
}

// ====== 调用方法说明 ======

/**
 * 如何在实际项目中调用拆解后的摄像机更新函数
 * 
 * 在原始代码中，updateCameraOnPlayback是通过cameraModule调用的：
 * if (cameraModule && cameraModule.updateCameraOnPlayback) {
 *   cameraModule.updateCameraOnPlayback(currentTime.value, timeline.value);
 * }
 * 
 * 要使用拆解后的函数，需要进行以下修改：
 */

// 方法1: 直接替换cameraModule中的updateCameraOnPlayback函数
function replaceCameraModuleUpdateFunction(cameraModule, app, canvas) {
  // 创建一个包含所有需要的状态变量的对象
  const cameraModuleState = {
    cameraX: cameraModule.cameraX,
    cameraY: cameraModule.cameraY,
    cameraWidth: cameraModule.cameraWidth,
    cameraHeight: cameraModule.cameraHeight,
    previousSceneId: null,
    previousCameraType: null,
    previousSpeakingRoleId: null,
    needShiftCamera: false,
    shiftCameraStartTime: 0,
    currentActiveShotId: null,
    currentDefaultShotScenery: null
  };
  
  // 替换原有的updateCameraOnPlayback函数
  cameraModule.updateCameraOnPlayback = function(_currentTimeInt, timeline) {
    updatedUpdateCameraOnPlayback(_currentTimeInt, timeline, app, canvas, cameraModuleState);
  };
  
  return cameraModuleState;
}

// 方法2: 在渲染循环中直接使用拆解后的函数
function integrateIntoRenderLoop(currentTime, timeline, app, canvas, cameraModule) {
  // 首先需要初始化状态对象
  const cameraModuleState = {
    cameraX: cameraModule.cameraX,
    cameraY: cameraModule.cameraY,
    cameraWidth: cameraModule.cameraWidth,
    cameraHeight: cameraModule.cameraHeight,
    previousSceneId: null,
    previousCameraType: null,
    previousSpeakingRoleId: null,
    needShiftCamera: false,
    shiftCameraStartTime: 0,
    currentActiveShotId: null,
    currentDefaultShotScenery: null
  };
  
  // 然后在渲染循环中调用
  if (cameraModule) {
    // 将cameraModule的当前状态同步到状态对象
    cameraModuleState.cameraX = cameraModule.cameraX;
    cameraModuleState.cameraY = cameraModule.cameraY;
    cameraModuleState.cameraWidth = cameraModule.cameraWidth;
    cameraModuleState.cameraHeight = cameraModule.cameraHeight;
    
    // 调用拆解后的函数
    updatedUpdateCameraOnPlayback(currentTime, timeline, app, canvas, cameraModuleState);
    
    // 将更新后的状态同步回cameraModule（如果需要）
    // 注意：原cameraModule中的属性是getter，可能需要特殊处理
  }
}

// ====== 完整替换示例 ======

/**
 * 在index.html中完整替换原有的摄像机更新逻辑
 * 1. 首先导入拆解后的函数
 * 2. 初始化状态对象
 * 3. 替换原有的调用方式
 */

// 1. 在index.html中添加导入语句（需要放在适当位置）
// import('./camera-update-analysis.js').then(analysisModule => {
//   // 2. 初始化状态对象
//   const cameraModuleState = {
//     cameraX: cameraModule.cameraX,
//     cameraY: cameraModule.cameraY,
//     cameraWidth: cameraModule.cameraWidth,
//     cameraHeight: cameraModule.cameraHeight,
//     previousSceneId: null,
//     previousCameraType: null,
//     previousSpeakingRoleId: null,
//     needShiftCamera: false,
//     shiftCameraStartTime: 0,
//     currentActiveShotId: null,
//     currentDefaultShotScenery: null
//   };
//   
//   // 3. 修改原有的调用方式
//   // 原代码:
//   // if (cameraModule && cameraModule.updateCameraOnPlayback) {
//   //   cameraModule.updateCameraOnPlayback(currentTime.value, timeline.value);
//   // }
//   
//   // 替换为:
//   if (cameraModule) {
//     analysisModule.updatedUpdateCameraOnPlayback(
//       currentTime.value, 
//       timeline.value, 
//       app, 
//       canvas.value, 
//       cameraModuleState
//     );
//   }
// });

// 第五部分：摄像机系统架构总结与优化建议

/**
 * 摄像机系统架构总结
 * 
 * 该项目的摄像机系统采用了模块化设计，结合Vue响应式系统和Canvas API实现了
 * 灵活的镜头控制功能。系统主要由以下几个部分组成：
 * 
 * 1. 状态管理：使用Vue的响应式引用(ref)管理摄像机的各种状态
 * 2. 模块导入：使用ES模块动态导入摄像机相关模块
 * 3. 数据持久化：使用localStorage保存用户的默认镜头设置
 * 4. 更新逻辑：在播放时根据时间和规则动态更新摄像机位置和参数
 */

// 代码优化建议
const cameraSystemOptimization = {
  // 1. 变量初始化优化
  variableInitialization: {
    issue: '摄像机相关变量分散定义，缺乏组织性',
    suggestion: '将摄像机相关变量统一组织在一个cameraConfig对象中，提高代码组织性和可维护性',
    example: `const cameraConfig = ref({
  show: false,
  preview: false,
  track: true,
  edit: false,
  width: cameraSizes.value[2].width,
  height: cameraSizes.value[2].height,
  zoom: 1,
  rotation: 0,
  // ...其他摄像机配置
});`
  },
  
  // 2. 错误处理优化
  errorHandling: {
    issue: '摄像机模块加载失败的错误处理机制不够完善',
    suggestion: '增强摄像机模块加载失败的错误处理机制，添加最大重试次数限制',
    example: `
    let importAttempts = 0;
    const maxAttempts = 3;
    const importCameraModule = () => {
      importAttempts++;
      import('./camera.mjs').then(module => {
        // 初始化代码...
      }).catch(error => {
        console.error(\`加载摄像机模块失败 (尝试 ${importAttempts}/${maxAttempts})\`, error);
        if (importAttempts < maxAttempts) {
          setTimeout(importCameraModule, 1000 * importAttempts); // 递增等待时间
        } else {
          console.error('达到最大重试次数，摄像机模块加载失败');
          // 提供降级方案...
        }
      });
    };`
  },
  
  // 3. 类型定义优化
  typeDefinition: {
    issue: '缺乏明确的类型定义，不利于代码维护',
    suggestion: '为摄像机相关数据结构添加TypeScript类型定义，提高代码健壮性',
    example: `// 在单独的types.js文件中定义
    export interface CameraSize {
      name: string;
      width: number;
      height: number;
    }
    export interface CameraPreset extends CameraSize {
      rotation: number;
    }`
  },
  
  // 4. 性能优化建议
  performanceOptimization: {
    suggestions: [
      '在摄像机预览更新时使用防抖或节流技术，避免高频更新导致性能问题',
      '考虑使用requestAnimationFrame来同步摄像机状态更新，与浏览器渲染周期保持一致',
      '当不需要摄像机预览时，暂停相关的监听和更新逻辑，减少不必要的计算'
    ]
  },
  
  // 5. 架构优化建议
  architectureOptimization: {
    suggestions: [
      '考虑将摄像机系统完全抽离为独立的类或模块，减少与主应用的耦合',
      '使用事件驱动的方式处理摄像机状态变化，提高代码的可扩展性',
      '添加单元测试，确保摄像机系统的稳定性和可靠性'
    ]
  }
};

// 导出所有分析结果，以便其他模块使用
export {
  cameraSystemInitialization,
  cameraModuleInitFlow,
  localStoragePersistence,
  updateCameraJudgmentLogic,
  updateCameraExecutionLogic,
  updatedUpdateCameraOnPlayback,
  replaceCameraModuleUpdateFunction,
  integrateIntoRenderLoop,
  cameraSystemOptimization
};