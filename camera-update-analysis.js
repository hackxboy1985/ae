// updateCameraOnPlayback函数逻辑拆解

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