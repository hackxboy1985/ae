//无效位置，如果x1,y1为此值，表明表情属于固定位置表情
// 导入公共工具类
import { loadImageWithCORS, round, getCacheImage } from './utils.mjs';

const invalidPos = -999;


// 角色表情管理器
export class RoleExpressionManager {
  constructor() {
    // 存储表情数据缓存
    this.expressionCache = {};
    // 存储每个角色的播放状态
    this.roleStates = {};
    // 存储最后一帧的时间戳
    this.lastFrameTime = {};
    // 配置项
    this.config = {
      roleWidth: 50,
      roleHeight: 50,
      roleColors: {
        'role1': '#3B82F6', // 蓝色
        'role2': '#10B981', // 绿色
        'role3': '#8B5CF6'  // 紫色
      },
      defaultColor: '#6B7280' // 默认灰色
    };
    this.canvasCurrentExpTrack = null;
    this.scenes = null;
    this.shots = null;
    this.roles = null;
    this.expressionTracks = null;

    // this.totalDuration = ref(0);
    
  }
  
  // 初始化表情数据
  init(scenes, shots, roles, expressionTracks) {
    this.scenes = scenes;
    this.shots = shots;
    this.roles = roles;
    this.expressionTracks = expressionTracks;
    // 构建表情缓存
    this.roles.forEach(role => {
      if (role.expressions) {
        role.expressions.forEach(expr => {
          if (expr && expr.id) {
            this.expressionCache[expr.id] = expr;
          }
        });
      }
    });

    // 计算总时长
    // this.totalDuration.value = computed(() => {
    //   if (this.shots.length === 0) return 0;
    //   return Math.max(...this.shots.map(shot => shot.startTime + shot.duration));
    // });
  
  }
  

  // 计算总时长
  get totalDuration() {
    if (this.shots.length === 0) return 0;
    return Math.max(...this.shots.map(shot => shot.startTime + shot.duration));
  }


  // 获取表情数据
  getExpression(expressionId) {
    return this.expressionCache[expressionId];
  }
  
  // 更新角色表情状态
  updateRoleState(roleId, currentExpression, frameInterval, startTime,_currentTimeInt) {
    // console.log('updatRoleState currentExpression:',currentExpression);
    if (!this.roleStates[roleId]) {
      this.roleStates[roleId] = {
        expressionId: null,
        currentFrameIndex: 0,
        startTime: startTime // 使用当前时间轴时间作为起始时间
      };
    }
    
    const state = this.roleStates[roleId];
    
    // 如果表情发生变化，重置状态
    if (state.expressionId !== currentExpression.id) {
      state.expressionId = currentExpression.id;
      state.currentFrameIndex = 0;
      state.startTime = startTime ;// 使用当前时间轴时间作为起始时间
    }
    
    // 基于时间轴时间计算经过的时间，而不是系统时间
    const elapsed = _currentTimeInt - state.startTime;
    // console.log(`currentTime:${currentTime},state.startTime:${state.startTime},elapsed:${elapsed}`)

    // 计算应该显示的帧索引，确保与时间轴指针同步
    // 使用 Math.floor 确保整数帧索引
    const expectedFrameIndex = Math.floor(elapsed / frameInterval) % currentExpression.frames.length;

    state.currentFrameIndex = expectedFrameIndex;
    
    return state.currentFrameIndex;
  }
  
  // 获取指定角色的当前帧索引
  getCurrentFrameIndex(roleId) {
    if (!this.roleStates[roleId]) {
      return 0;
    }
    
    return this.roleStates[roleId].currentFrameIndex;
  }
  
  // 获取指定角色的当前帧图片
  getCurrentFrameUrl(roleId, currentExpression) {
    if (!this.roleStates[roleId] || !currentExpression || !currentExpression.frames || currentExpression.frames.length === 0) {
      return null;
    }
    
    const state = this.roleStates[roleId];
    return currentExpression.frames[state.currentFrameIndex];
  }
  
  getRoleExpression(roleId,expressionId) {
    const role = this.roles.find(r => r.id === roleId);
    const expression = role.expressions.find(exp => exp && exp.id === expressionId) ||
            role.expressions  .find(exp => exp && exp.id === role.defaultExpressionId);
    return expression;
  }

  // 根据当前时间获取所属场景中的角色信息
  getSceneRolesByTime (time)  {
    // 找到当前时间所在的分镜
    const currentShot = this.shots.find(shot => 
      time >= shot.startTime && time < shot.startTime + shot.duration
    );
    
    if (!currentShot) {
      // 如果没有找到当前分镜，返回空数组
      return [];
    }
    
    // 找到包含当前分镜的场景
    const currentScene = this.scenes.find(scene => 
      scene.shots.includes(currentShot.id)
    );
    
    // 返回场景中的角色信息，如果场景不存在或没有角色信息，则返回空数组
    return currentScene && currentScene.roles ? [...currentScene.roles] : [];
  };
  
  // 计算角色当前实际位置（基于时间的线性插值）
  calculateCurrentExpressPosition(currentExpressionTrack, _currentTimeInt) {
    let  currentX = 0;
    let  currentY = 0;
    // 获取当前时间点的场景级角色配置
    const sceneRoles = this.getSceneRolesByTime(_currentTimeInt);
    const roleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === currentExpressionTrack.roleId) : null;

    // 检查是否存在临时位置（拖拽过程中使用）
    if (currentExpressionTrack._tempX !== undefined && currentExpressionTrack._tempY !== undefined) {
      
      // 返回临时位置时，确保Y坐标在渲染坐标系中是正确的
      // 注意：这里不进行额外转换，因为拖拽时已经计算好了正确的坐标
      console.log('calculateCurrentPosition 1:',currentExpressionTrack);

      currentX = currentExpressionTrack._tempX;
      currentY = currentExpressionTrack._tempY;
    }else{
      // 计算当前表情位置（基于当前时间的线性插值）
      const duration = currentExpressionTrack.endTime - currentExpressionTrack.startTime;
      const elapsed = _currentTimeInt - currentExpressionTrack.startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      // console.log('calculateCurrentPosition :',duration,elapsed,progress);
      // 获取结束位置，如果没有则使用开始位置
      let endX = currentExpressionTrack.x1;
      let endY = currentExpressionTrack.y1;
      if (endX === undefined || endX === invalidPos) {
        endX = currentExpressionTrack.x;
      }
      if (endY === undefined || endY === invalidPos) {
        endY = currentExpressionTrack.y;
      }
      // console.log('calculateCurrentPosition 2:',currentExpressionTrack,progress);
      // 线性插值计算当前位置
      currentX = currentExpressionTrack.x + (endX - currentExpressionTrack.x) * progress;
      currentY = currentExpressionTrack.y + (endY - currentExpressionTrack.y) * progress;
      // console.log('calculateCurrentPosition currentX:',currentX,',currentY:',currentY);
    }
    
    // 获取当前帧图片的实际宽高
    let frameWidth = 50;
    let frameHeight = 50;
    
    try {
      // 获取当前帧图片URL
      const currentExpression = this.getRoleExpression(currentExpressionTrack.roleId,currentExpressionTrack.expressionId);
      const currentFrameUrl = this.getCurrentFrameUrl(currentExpressionTrack.roleId,currentExpression);
      const imageUrl = currentFrameUrl;  
      // console.log('currentExpression:',currentExpression,',imageUrl:',imageUrl);
      // 尝试从图片缓存中获取图片的实际宽高
      // 注意：这里假设imageCache是全局可访问的

      const cachedImg = getCacheImage(imageUrl);
      if (cachedImg && cachedImg.width && cachedImg.height) {
        //console.log('cachedImg.width:',cachedImg.width);
        frameWidth = cachedImg.width;
        frameHeight = cachedImg.height;
      }

      } catch (error) {
      console.error('获取当前帧图片宽高时出错:', error);
      // 出错时使用默认宽高
    }
    


    //console.log('222>>>>',currentX,currentY,frameWidth,frameHeight,currentExpressionTrack.scale);
    // 返回位置和场景配置中的尺寸和角度，优先使用当前帧图片的实际宽高
    const position = { 
      x: currentX, 
      y: currentY, 
      width: frameWidth || roleConfig?.width ,
      height: frameHeight ||roleConfig?.height,
      angle: currentExpressionTrack.angle || roleConfig?.angle || 0,
      scale: round(currentExpressionTrack.scale) || 1,
      isValid: true 
    }
    //console.log('333>>>>',position);
    return position;
  }
  
  // 计算角色当前实际位置（基于时间的线性插值） 调试使用 哪个方法有问题调用
  calculateCurrentExpressPosition_debug(currentExpressionTrack, _currentTimeInt) {
    let  currentX = 0;
    let  currentY = 0;
    // 获取当前时间点的场景级角色配置
    const sceneRoles = this.getSceneRolesByTime(_currentTimeInt);
    const roleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === currentExpressionTrack.roleId) : null;

    // 检查是否存在临时位置（拖拽过程中使用）
    if (currentExpressionTrack._tempX !== undefined && currentExpressionTrack._tempY !== undefined) {
      
      // 返回临时位置时，确保Y坐标在渲染坐标系中是正确的
      // 注意：这里不进行额外转换，因为拖拽时已经计算好了正确的坐标
      console.log('calculateCurrentPosition 2-1:',currentExpressionTrack);

      currentX = currentExpressionTrack._tempX;
      currentY = currentExpressionTrack._tempY;
    }else{
      console.log('calculateCurrentPosition 2-2:',currentExpressionTrack);

      // 计算当前表情位置（基于当前时间的线性插值）
      const duration = currentExpressionTrack.endTime - currentExpressionTrack.startTime;
      const elapsed = _currentTimeInt - currentExpressionTrack.startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      // console.log('calculateCurrentPosition :',duration,elapsed,progress);
      // 获取结束位置，如果没有则使用开始位置
      let endX = currentExpressionTrack.x1;
      let endY = currentExpressionTrack.y1;
      if (endX === undefined || endX === invalidPos) {
        endX = currentExpressionTrack.x;
      }
      if (endY === undefined || endY === invalidPos) {
        endY = currentExpressionTrack.y;
      }
      // console.log('calculateCurrentPosition 2:',currentExpressionTrack,progress);
      // 线性插值计算当前位置
      currentX = currentExpressionTrack.x + (endX - currentExpressionTrack.x) * progress;
      currentY = currentExpressionTrack.y + (endY - currentExpressionTrack.y) * progress;
      // console.log('calculateCurrentPosition currentX:',currentX,',currentY:',currentY);
    }
    
    // 获取当前帧图片的实际宽高
    let frameWidth = 50;
    let frameHeight = 50;
    
    try {
      // 获取当前帧图片URL
      const currentExpression = this.getRoleExpression(currentExpressionTrack.roleId,currentExpressionTrack.expressionId);
      const currentFrameUrl = this.getCurrentFrameUrl(currentExpressionTrack.roleId,currentExpression);
      const imageUrl = currentFrameUrl;  
      console.log('currentExpression:',currentExpression,',imageUrl:',imageUrl);
      // 尝试从图片缓存中获取图片的实际宽高
      const cachedImg = getCacheImage(imageUrl);
      if (cachedImg && cachedImg.width && cachedImg.height) {
        console.log('cachedImg.width:',cachedImg.width);
        frameWidth = cachedImg.width;
        frameHeight = cachedImg.height;
      }
    } catch (error) {
      console.error('获取当前帧图片宽高时出错:', error);
      // 出错时使用默认宽高
    }
    


    console.log('222>>>>',currentX,currentY,frameWidth,frameHeight,currentExpressionTrack.scale);
    // 返回位置和场景配置中的尺寸和角度，优先使用当前帧图片的实际宽高
    const position = { 
      x: currentX, 
      y: currentY, 
      width: frameWidth || roleConfig?.width ,
      height: frameHeight ||roleConfig?.height,
      angle: currentExpressionTrack.angle || roleConfig?.angle || 0,
      scale: round(currentExpressionTrack.scale) || 1,
      isValid: true 
    }
    //console.log('333>>>>',position);
    return position;
  }
  
  // 获取当前时间点指定角色ID的表情轨道
  getExpressionTrackByRoleId(roleId, time, onlyTrack = true) {
    if (!this.expressionTracks || !Array.isArray(this.expressionTracks)) {
      return null;
    }
    
    // 查找当前时间点该角色的表情轨道
    let currentExpressionTrack = this.expressionTracks.find(track => 
      track.roleId === roleId && 
      time >= track.startTime && 
      time < track.endTime
    );

    if(onlyTrack)
      return currentExpressionTrack;

    //console.log('getExpresTrackByRoleId', roleId, time, currentExpressionTrack);
    // 如果没有找到，检查是否在最后一帧
    if (!currentExpressionTrack && time >= this.totalDuration.value) {
      // 找到最后一个结束的轨道
      const lastTracks = this.expressionTracks  
        .filter(track => track.roleId === roleId && track.endTime <= time && track.endTime > time-1)
        .sort((a, b) => b.endTime - a.endTime);
      
      currentExpressionTrack = lastTracks.length > 0 ? lastTracks[0] : null;
    }


    // 如果没有找到表情轨道，尝试从当前场景中获取角色配置
    if (!currentExpressionTrack) {
      // 获取当前时间点的场景角色配置
      const sceneRoles = this.getSceneRolesByTime(time);
      const sceneRoleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === roleId) : null;
      
      // 如果场景中找到了角色配置，创建一个临时的表达式轨道用于位置计算
      if (sceneRoleConfig) {
        currentExpressionTrack = {
          roleId: roleId,
          expressionId: sceneRoleConfig.expressionId,
          x: sceneRoleConfig.x,
          y: sceneRoleConfig.y,
          x1: sceneRoleConfig.x1 || sceneRoleConfig.x,
          y1: sceneRoleConfig.y1 || sceneRoleConfig.y,
          startTime: time,
          endTime: time + 1,
          scale: sceneRoleConfig.scale?.toFixed(2) || 1,
          _isTemp: true
        };
        //console.log('使用默认表情:',currentExpressionTrack);
      }
    }
    
    return currentExpressionTrack;
  }

  // 检测角色点击
  checkRoleClick(x, y, roles, expressionTracks, _currentTimeInt) {
    // 遍历所有角色，检查点击位置是否在角色范围内
    const clickedRole = roles.find(role => {
      // 找到当前时间点该角色的表情轨道
      let currentExpressionTrack = this.getExpressionTrackByRoleId(role.id,_currentTimeInt);
      // let currentExpressionTrack = expressionTracks.find(track => 
      //   track.roleId === role.id && 
      //   _currentTime.value >= track.startTime && 
      //   _currentTime.value < track.endTime
      // );
      console.log('checkRoleClick:',role.id,_currentTimeInt,currentExpressionTrack);
      // 如果没有找到，检查是否在最后一帧
      if (!currentExpressionTrack && _currentTimeInt >= this.totalDuration.value) {
        // 找到最后一个结束的轨道
        const lastTracks = expressionTracks  
          .filter(track => track.roleId === role.id && track.endTime <= _currentTimeInt && track.endTime > _currentTimeInt-1)
          .sort((a, b) => b.endTime - a.endTime);
        
        currentExpressionTrack = lastTracks.length > 0 ? lastTracks[0] : null;
      }
       
      // 如果没有找到表情轨道，尝试从当前场景中获取角色配置
      if (!currentExpressionTrack) {
        // 获取当前时间点的场景角色配置
        const sceneRoles = this.getSceneRolesByTime(_currentTimeInt);
        const sceneRoleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === role.id) : null;
        
        // 如果场景中找到了角色配置，创建一个临时的表达式轨道用于位置计算
        if (sceneRoleConfig) {
          currentExpressionTrack = {
            roleId: role.id,
            expressionId: sceneRoleConfig.expressionId,
            x: sceneRoleConfig.x,
            y: sceneRoleConfig.y,
            x1: sceneRoleConfig.x1 || sceneRoleConfig.x,
            y1: sceneRoleConfig.y1 || sceneRoleConfig.y,
            startTime: _currentTimeInt,
            endTime: _currentTimeInt + 1,
            scale: sceneRoleConfig.scale?.toFixed(2) || 1,
            _isTemp: true
          };
          this.canvasCurrentExpTrack = currentExpressionTrack
          console.log('check the default role :', currentExpressionTrack);
        } else {
          //console.error('check the expression role :', currentExpressionTrack);
          return false;
        }
      }

       
      // 使用calculateCurrentPosition方法获取当前实际位置
      const currentPosition = this.calculateCurrentExpressPosition(currentExpressionTrack, _currentTimeInt);
      //console.log('点击表情的 Position:', currentPosition);
      currentExpressionTrack.width = currentPosition.width;
      currentExpressionTrack.height = currentPosition.height;
      currentExpressionTrack.angle = currentPosition.angle;
      currentExpressionTrack.scale = currentPosition.scale;
      this.canvasCurrentExpTrack = currentExpressionTrack
      // console.log('点击表情:', currentExpressionTrack);

      // 如果坐标计算无效，返回false
      if (!currentPosition.isValid) {
        // console.log(`角色 ${role.name} 在时间点 ${currentTime} 位置计算无效`);
        return false;
      }
      
      const { currentX, currentY } = { currentX: currentPosition.x, currentY: currentPosition.y };
      // console.log(`点击:${x},${y} 角色 ${role.name} in [${currentX}, ${currentX + currentPosition.width*currentPosition.scale},${currentY},${currentY +currentPosition.height*currentPosition.scale}]`);
      // 检查点击是否在角色当前位置的区域内
      return x >= currentX && 
             x <= currentX + currentPosition.width*currentPosition.scale && 
             y >= currentY && 
             y <= currentY +currentPosition.height*currentPosition.scale;
    });
    
    //console.log('checkRoleClick :', clickedRole);
    return clickedRole;
  }
  
  // 绘制角色表情-- 暂未使用
  drawRoleExpression(ctx, role, currentExpressionTrack, expression,_currentTimeInt, selectedRoleId) {
    if (!ctx || !role || !currentExpressionTrack || !expression) {
      return false;
    }
    
    try {
      // 获取当前帧索引
      const frameIndex = this.updateRoleState(role.id, expression, expression.frameInterval, currentExpressionTrack.startTime,_currentTimeInt);
      
      // 检查是否有有效的表情帧
      if (!expression.frames || !expression.frames[frameIndex]) {
        console.log(`角色 ${role.name} 在时间点 ${_currentTimeInt} 没有有效的表情帧`);
        return false;
      }
      
      // 获取图片URL
      const imageUrl = expression.frames[frameIndex];
      const img = getCacheImage(imageUrl);
      this.drawRoleImage(ctx, role, currentExpressionTrack, expression, imageUrl, img, _currentTimeInt, selectedRoleId);

    } catch (error) {
      console.error(`draw role expression error: ${error}`);
      return false;
    }
  }
  
  // 绘制角色选中状态
  drawRoleSelection(ctx, track, role, _currentTimeInt) {
    if (!ctx || !track || !role) return;
    
    // 使用calculateCurrentPosition方法获取当前实际位置和尺寸
    // 注意：这里需要currentTime，但该方法没有传入，我们假设使用当前时间
    // 由于calculateCurrentPosition需要currentTime参数
    // 所以这里使用了全局的currentTime
    const currentPosition = this.calculateCurrentExpressPosition(track, _currentTimeInt);
    //console.log('drawRolSelection the currentPosition :', currentPosition);
    const x = currentPosition.isValid ? currentPosition.x : track.x;
    const y = currentPosition.isValid ? currentPosition.y : track.y;
    const width = currentPosition.isValid ? currentPosition.width * track.scale : this.config.roleWidth;
    const height = currentPosition.isValid ? currentPosition.height * track.scale : this.config.roleHeight;
    
    // 绘制闪烁的黄色边框
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 8;
    
    // 绘制圆角矩形边框
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
    
    // 重置线条样式
    ctx.setLineDash([]);
    
    // 绘制右上角宽高调整圆点
    const cornerDotSize = 10;
    const cornerDotX = x + width;
    const cornerDotY = y;
    
    // 保存当前状态以绘制调整圆点
    ctx.save();
    
    // 绘制圆点背景（黑色外圈）
    ctx.beginPath();
    ctx.arc(cornerDotX, cornerDotY, cornerDotSize, 0, Math.PI * 2);
    ctx.fillStyle = '#0000FF';
    ctx.fill();
    
    // 绘制圆点内芯（白色）
    ctx.beginPath();
    ctx.arc(cornerDotX, cornerDotY, cornerDotSize - 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    // 恢复状态
    ctx.restore();
    
    // 绘制右下角角度调整圆点
    const angleDotX = x + width;
    const angleDotY = y + height;
    
    // 保存当前状态以绘制角度调整圆点
    ctx.save();
    
    // 绘制圆点背景（蓝色外圈）
    ctx.beginPath();
    ctx.arc(angleDotX, angleDotY, cornerDotSize, 0, Math.PI * 2);
    ctx.fillStyle = '#0000FF';
    ctx.fill();
    
    // 绘制圆点内芯（红色 - 用于区分角度调整点）
    ctx.beginPath();
    ctx.arc(angleDotX, angleDotY, cornerDotSize - 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    
    // 恢复状态以继续绘制表情名称标签
    ctx.restore();
    ctx.save();
    
    // 绘制表情名称标签
    const expression = role.expressions.find(exp => exp && exp.id === track.expressionId);
    const expressionName = expression ? expression.name : '未知表情';
    
    // 计算文本宽度以正确设置背景
    ctx.font = '12px Arial';
    const textWidth = ctx.measureText(expressionName).width + 20;
    const textHeight = 20;
    const labelX = x + width / 2 - textWidth / 2;
    
    // 由于全局坐标系已经翻转，需要将Y坐标调整为在角色下方
    const labelY = y + height + 15;
    
    // 应用反向缩放，确保标签在翻转的坐标系中是正立的
    const centerX = labelX + textWidth / 2;
    const centerY = labelY + textHeight / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(1, -1);
    ctx.translate(-centerX, -centerY);
    
    // 绘制标签背景
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(labelX + 5, labelY);
    ctx.lineTo(labelX + textWidth - 5, labelY);
    ctx.quadraticCurveTo(labelX + textWidth, labelY, labelX + textWidth, labelY + 5);
    ctx.lineTo(labelX + textWidth, labelY + textHeight - 5);
    ctx.quadraticCurveTo(labelX + textWidth, labelY + textHeight, labelX + textWidth - 5, labelY + textHeight);
    ctx.lineTo(labelX + 5, labelY + textHeight);
    ctx.quadraticCurveTo(labelX, labelY + textHeight, labelX, labelY + textHeight - 5);
    ctx.lineTo(labelX, labelY + 5);
    ctx.quadraticCurveTo(labelX, labelY, labelX + 5, labelY);
    ctx.closePath();
    ctx.fill();
    
    // 绘制标签文本
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(expressionName, labelX + textWidth / 2, labelY + textHeight / 2);
    
    // 恢复原始状态
    ctx.restore();
  }
  
  // 绘制角色备用图形
  drawRolePlaceholder(ctx, track, role, _currentTimeInt,highlight = false) {
    if (!ctx || !track || !role) return;
    
    // 保存当前状态，准备临时应用反向缩放以抵消全局翻转
    ctx.save();
    
    // 选择角色专属颜色
    const color = this.config.roleColors[role.id] || this.config.defaultColor;
    
    // 绘制一个更美观的备用图形
    ctx.fillStyle = highlight ? color : `${color}80`; // 透明度
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // 尝试获取场景级角色配置
    const currentPosition = this.calculateCurrentExpressPosition(track, _currentTimeInt);
    
    // 绘制圆角矩形
    const x = currentPosition.isValid ? currentPosition.x : track.x;
    const y = currentPosition.isValid ? currentPosition.y : track.y;
    const width = currentPosition.isValid ? currentPosition.width : this.config.roleWidth;
    const height = currentPosition.isValid ? currentPosition.height : this.config.roleHeight;
    const radius = 10;
    
    // 应用反向缩放，确保备用图形在翻转的坐标系中是正立的
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(1, -1);
    ctx.translate(-(x + width / 2), -(y + height / 2));
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // 绘制角色图标
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px FontAwesome';
    ctx.textAlign = 'center';
    ctx.fillText(
      '\uf007', // 用户图标
      x + width/2, 
      y + height/2 + 15
    );
    
    // 恢复原始状态
    ctx.restore();
  }

  // 重置所有状态
  reset() {
    this.roleStates = {};
    this.lastFrameTime = {};
  }
  
  // 重置特定角色的状态
  resetRole(roleId) {
    if (this.roleStates[roleId]) {
      delete this.roleStates[roleId];
      delete this.lastFrameTime[roleId];
    }
  }

  // 绘制角色图片的具体实现
  drawRoleImage(ctx, role, currentExpressionTrack, expression, imageUrl, img, _currentTimeInt, selectedRoleId) {
    if (!ctx || !role || !currentExpressionTrack || !expression) {
      return;
    }
    
    // 如果在播放状态且图片已缓存，则直接使用缓存图片
    if (img) {
      // console.log('使用缓存图片: ' + imageUrl);
      try {
        // 使用calculateCurrentPosition方法获取当前实际位置和尺寸角度
        const currentPosition = this.calculateCurrentExpressPosition(currentExpressionTrack, _currentTimeInt);
        
        // 如果坐标计算无效，返回
        if (!currentPosition.isValid) {
          console.log(`${role.name} ${currentExpressionTrack.expressionId} ${expression.name} miss start/end pos`);
          return;
        }
        
        //console.log(`will draw ${expression.name} ${currentPosition.width} ${currentPosition.height} scale:${currentExpressionTrack.scale}`);
        // console.log('currentExpressionTrack:',currentExpressionTrack);
        const currentX = currentPosition.x;
        const currentY = currentPosition.y;
        // 计算缩放系数，考虑canvas实际尺寸与分辨率的关系
        // const container = document.getElementById('canvasContainer');
        // const parentWidth = container.parentElement.clientWidth;
        // const parentHeight = container.parentElement.clientHeight;
        // const widthRatio = parentWidth / canvas.value.width;
        // const heightRatio = parentHeight / canvas.value.height;
        // const scale = Math.min(widthRatio, heightRatio, 1);
        // console.log('scale:', scale,',widthRatio:',widthRatio,',heightRatio:',heightRatio,', container:',parentWidth,parentHeight,'canvas w h:',canvas.value.width,canvas.value.height,currentExpressionTrack.scale);

        // 计算当前宽高，考虑表情缩放和canvas分辨率缩放
        const currentWidth = img.width * (currentPosition.scale || 1);
        const currentHeight = img.height * (currentPosition.scale || 1);
        const currentAngle = currentPosition.angle;
        
        // console.log('current:',currentWidth,currentHeight,currentExpressionTrack.scale);

        // 保存当前状态，准备临时应用反向缩放以抵消全局翻转
        ctx.save();
        
        // 在角色绘制前应用反向缩放，确保图片在翻转的坐标系中是正立的
        ctx.translate(currentX + currentWidth / 2, currentY + currentHeight / 2);
        ctx.scale(1, -1);
        ctx.translate(-(currentX + currentWidth / 2), -(currentY + currentHeight / 2));
        
        // 如果有角度，应用旋转
        if (currentAngle && currentAngle !== 0) {
          ctx.save();
          ctx.translate(currentX + currentWidth / 2, currentY + currentHeight / 2);
          ctx.rotate((currentAngle * Math.PI) / 180); // 转换为弧度
          ctx.translate(-(currentX + currentWidth / 2), -(currentY + currentHeight / 2));
        }
        
        // console.log('w h:',img.width, img.height,currentWidth,currentHeight);
        // 绘制角色图片，使用计算后的宽高代替图片原始宽高，解决分辨率误差问题
        ctx.drawImage(
          img, 
          currentX, 
          currentY,
          currentWidth, // 使用计算后的宽度
          currentHeight  // 使用计算后的高度
        );
        
        // 如果应用了旋转，恢复状态
        if (currentAngle && currentAngle !== 0) {
          ctx.restore();
        }
        
        // 恢复原始状态
        ctx.restore();

        

        // 保存当前状态，准备绘制角色名称
        ctx.save();
        
        // 不使用save/restore和缩放，直接在正确的位置绘制角色名称
        // 由于全局坐标系已经翻转，需要将Y坐标调整为在角色上方
        const nameY = currentY + currentHeight + 15;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(
          role.name, 
          currentX + currentWidth / 2, 
          nameY
        );
        ctx.fillText(
            role.name, 
            currentX + currentWidth / 2, 
            nameY
          );
          
          // 恢复原始状态
          ctx.restore();
      } catch (error) {
        console.error('绘制缓存图片时出错: ' + error);
        this.drawRolePlaceholder(ctx, currentExpressionTrack, role, true);
      }
    } else {
      // 使用统一的图片加载函数
      try {
        if (img === null || img === undefined) {
          // 保存this上下文，以便在回调函数中使用
          const self = this;
          img = loadImageWithCORS(
            imageUrl,
            (loadedImg) => {
              // 添加到缓存
              //console.log('加载角色图片成功: ' + imageUrl);
              self.drawRoleImage(ctx, role, currentExpressionTrack, expression, imageUrl, loadedImg, _currentTimeInt, selectedRoleId);
            },
            () => {
              console.error('无法加载角色图片: ' + imageUrl);
              debugInfo.value = '角色图片加载失败: ' + role.name;
              // 最终失败时，确保备用图形清晰可见
              self.drawRolePlaceholder(ctx, currentExpressionTrack, role, true);
            }
          );
        }
      } catch (error) {
        console.error('设置图片源时出错: ' + error);
        this.drawRolePlaceholder(ctx, currentExpressionTrack, role, true);
      }
    }

    // 在Canvas上绘制选中状态
    if (selectedRoleId === role.id) {
      this.drawRoleSelection(ctx, currentExpressionTrack, role, _currentTimeInt);
    }
  }

  // 计算角色当前实际位置（基于时间的线性插值）
  calculateCurrentExpressPosition(currentExpressionTrack, _currentTimeInt) {
    let  currentX = 0;
    let  currentY = 0;
    // 获取当前时间点的场景级角色配置
    const sceneRoles = this.getSceneRolesByTime(_currentTimeInt);
    const roleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === currentExpressionTrack.roleId) : null;

    // 检查是否存在临时位置（拖拽过程中使用）
    if (currentExpressionTrack._tempX !== undefined && currentExpressionTrack._tempY !== undefined) {
      
      // 返回临时位置时，确保Y坐标在渲染坐标系中是正确的
      // 注意：这里不进行额外转换，因为拖拽时已经计算好了正确的坐标
      console.log('calculateCurrentPosition 1:',currentExpressionTrack);

      currentX = currentExpressionTrack._tempX;
      currentY = currentExpressionTrack._tempY;
    }else{
      // 计算当前表情位置（基于当前时间的线性插值）
      const duration = currentExpressionTrack.endTime - currentExpressionTrack.startTime;
      const elapsed = _currentTimeInt - currentExpressionTrack.startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      // console.log('calculateCurrentPosition :',duration,elapsed,progress);
      // 获取结束位置，如果没有则使用开始位置
      let endX = currentExpressionTrack.x1;
      let endY = currentExpressionTrack.y1;
      if (endX === undefined || endX === invalidPos) {
        endX = currentExpressionTrack.x;
      }
      if (endY === undefined || endY === invalidPos) {
        endY = currentExpressionTrack.y;
      }
      // console.log('calculateCurrentPosition 2:',currentExpressionTrack,progress);
      // 线性插值计算当前位置
      currentX = currentExpressionTrack.x + (endX - currentExpressionTrack.x) * progress;
      currentY = currentExpressionTrack.y + (endY - currentExpressionTrack.y) * progress;
      // console.log('calculateCurrentPosition currentX:',currentX,',currentY:',currentY);
    }
    
    // 获取当前帧图片的实际宽高
    let frameWidth = 50;
    let frameHeight = 50;
    
    try {
      // 获取当前帧图片URL
      const currentExpression = this.getRoleExpression(currentExpressionTrack.roleId,currentExpressionTrack.expressionId);
      const currentFrameUrl = this.getCurrentFrameUrl(currentExpressionTrack.roleId,currentExpression);
      const imageUrl = currentFrameUrl;  
      // console.log('currentExpression:',currentExpression,',imageUrl:',imageUrl);
      // 尝试从图片缓存中获取图片的实际宽高
      const cachedImg = getCacheImage(imageUrl);
      if (cachedImg && cachedImg.width && cachedImg.height) {
        //console.log('cachedImg.width:',cachedImg.width);
        frameWidth = cachedImg.width;
        frameHeight = cachedImg.height;
      }
    } catch (error) {
      console.error('获取当前帧图片宽高时出错:', error);
      // 出错时使用默认宽高
    }


    //console.log('222>>>>',currentX,currentY,frameWidth,frameHeight,currentExpressionTrack.scale);
    // 返回位置和场景配置中的尺寸和角度，优先使用当前帧图片的实际宽高
    const position = { 
      x: currentX, 
      y: currentY, 
      width: frameWidth || roleConfig?.width ,
      height: frameHeight ||roleConfig?.height,
      angle: currentExpressionTrack.angle || roleConfig?.angle || 0,
      scale: round(currentExpressionTrack.scale) || 1,
      isValid: true 
    }
    return position;
  }
  
  // 计算角色当前实际位置（基于时间的线性插值） 调试使用 哪个方法有问题调用
  calculateCurrentExpressPosition_debug(currentExpressionTrack, _currentTimeInt) {
    let  currentX = 0;
    let  currentY = 0;
    // 获取当前时间点的场景级角色配置
    const sceneRoles = this.getSceneRolesByTime(_currentTimeInt);
    const roleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === currentExpressionTrack.roleId) : null;

    // 检查是否存在临时位置（拖拽过程中使用）
    if (currentExpressionTrack._tempX !== undefined && currentExpressionTrack._tempY !== undefined) {
      
      // 返回临时位置时，确保Y坐标在渲染坐标系中是正确的
      // 注意：这里不进行额外转换，因为拖拽时已经计算好了正确的坐标
      console.log('calculateCurrentPosition 2-1:',currentExpressionTrack);

      currentX = currentExpressionTrack._tempX;
      currentY = currentExpressionTrack._tempY;
    }else{
      console.log('calculateCurrentPosition 2-2:',currentExpressionTrack);

      // 计算当前表情位置（基于当前时间的线性插值）
      const duration = currentExpressionTrack.endTime - currentExpressionTrack.startTime;
      const elapsed = _currentTimeInt - currentExpressionTrack.startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      // console.log('calculateCurrentPosition :',duration,elapsed,progress);
      // 获取结束位置，如果没有则使用开始位置
      let endX = currentExpressionTrack.x1;
      let endY = currentExpressionTrack.y1;
      if (endX === undefined || endX === invalidPos) {
        endX = currentExpressionTrack.x;
      }
      if (endY === undefined || endY === invalidPos) {
        endY = currentExpressionTrack.y;
      }
      // console.log('calculateCurrentPosition 2:',currentExpressionTrack,progress);
      // 线性插值计算当前位置
      currentX = currentExpressionTrack.x + (endX - currentExpressionTrack.x) * progress;
      currentY = currentExpressionTrack.y + (endY - currentExpressionTrack.y) * progress;
      // console.log('calculateCurrentPosition currentX:',currentX,',currentY:',currentY);
    }
    
    // 获取当前帧图片的实际宽高
    let frameWidth = 50;
    let frameHeight = 50;
    
    try {
      // 获取当前帧图片URL
      const currentExpression = this.getRoleExpression(currentExpressionTrack.roleId,currentExpressionTrack.expressionId);
      const currentFrameUrl = this.getCurrentFrameUrl(currentExpressionTrack.roleId,currentExpression);
      const imageUrl = currentFrameUrl;  
      console.log('currentExpression:',currentExpression,',imageUrl:',imageUrl);
      // 尝试从图片缓存中获取图片的实际宽高
      const cachedImg = getCacheImage(imageUrl);
      if (cachedImg && cachedImg.width && cachedImg.height) {
        console.log('cachedImg.width:',cachedImg.width);
        frameWidth = cachedImg.width;
        frameHeight = cachedImg.height;
      }else{
        console.error('图片缓存中没有找到,获取帧宽高!!!!!');
      }
    } catch (error) {
      console.error('获取当前帧图片宽高时出错:', error);
      // 出错时使用默认宽高
    }
    


    console.log('222>>>>',currentX,currentY,frameWidth,frameHeight,currentExpressionTrack.scale);
    // 返回位置和场景配置中的尺寸和角度，优先使用当前帧图片的实际宽高
    const position = { 
      x: currentX, 
      y: currentY, 
      width: frameWidth || roleConfig?.width ,
      height: frameHeight ||roleConfig?.height,
      angle: currentExpressionTrack.angle || roleConfig?.angle || 0,
      scale: round(currentExpressionTrack.scale) || 1,
      isValid: true 
    }
    //console.log('333>>>>',position);
    return position;
  }



  // // 检测角色点击
  // checkRoleClick(x, y, roles, expressionTracks, _currentTimeInt) {
  //   // 遍历所有角色，检查点击位置是否在角色范围内
  //   const clickedRole = roles.find(role => {
  //     // 找到当前时间点该角色的表情轨道
  //     let currentExpressionTrack = getExpressionTrackByRoleId(role.id,_currentTimeInt);
  //     // let currentExpressionTrack = expressionTracks.find(track => 
  //     //   track.roleId === role.id && 
  //     //   _currentTime.value >= track.startTime && 
  //     //   _currentTime.value < track.endTime
  //     // );
  //     console.log('checkRoleClick:',role.id,_currentTimeInt,currentExpressionTrack);
  //     // 如果没有找到，检查是否在最后一帧
  //     if (!currentExpressionTrack && _currentTimeInt >= totalDuration.value) {
  //       // 找到最后一个结束的轨道
  //       const lastTracks = expressionTracks  
  //         .filter(track => track.roleId === role.id && track.endTime <= _currentTimeInt && track.endTime > _currentTimeInt-1)
  //         .sort((a, b) => b.endTime - a.endTime);
        
  //       currentExpressionTrack = lastTracks.length > 0 ? lastTracks[0] : null;
  //     }
        
  //     // 如果没有找到表情轨道，尝试从当前场景中获取角色配置
  //     if (!currentExpressionTrack) {
  //       // 获取当前时间点的场景角色配置
  //       const sceneRoles = getSceneRolesByTime(_currentTimeInt);
  //       const sceneRoleConfig = sceneRoles ? sceneRoles.find(r => r.roleId === role.id) : null;
        
  //       // 如果场景中找到了角色配置，创建一个临时的表达式轨道用于位置计算
  //       if (sceneRoleConfig) {invalidPos
  //         currentExpressionTrack = {
  //           roleId: role.id,
  //           expressionId: sceneRoleConfig.expressionId,
  //           x: sceneRoleConfig.x,
  //           y: sceneRoleConfig.y,
  //           x1: sceneRoleConfig.x1 || sceneRoleConfig.x,
  //           y1: sceneRoleConfig.y1 || sceneRoleConfig.y,
  //           startTime: _currentTimeInt,
  //           endTime: _currentTimeInt + 1,
  //           scale: sceneRoleConfig.scale?.toFixed(2) || 1,
  //           _isTemp: true
  //         };
  //         this.canvasCurrentExpTrack = currentExpressionTrack
  //         console.log('check the default role :', currentExpressionTrack);
  //       } else {
  //         //console.error('check the expression role :', currentExpressionTrack);
  //         return false;
  //       }
  //     }


        
  //     // 使用calculateCurrentPosition方法获取当前实际位置
  //     const currentPosition = this.calculateCurrentExpressPosition(currentExpressionTrack, _currentTimeInt);
  //     //console.log('点击表情的 Position:', currentPosition);
  //     currentExpressionTrack.width = currentPosition.width;
  //     currentExpressionTrack.height = currentPosition.height;
  //     currentExpressionTrack.angle = currentPosition.angle;
  //     currentExpressionTrack.scale = currentPosition.scale;
  //     this.canvasCurrentExpTrack = currentExpressionTrack
  //     // console.log('点击表情:', currentExpressionTrack);

  //     // 如果坐标计算无效，返回false
  //     if (!currentPosition.isValid) {
  //       // console.log(`角色 ${role.name} 在时间点 ${currentTime} 位置计算无效`);
  //       return false;
  //     }
      
  //     const { currentX, currentY } = { currentX: currentPosition.x, currentY: currentPosition.y };
  //     // console.log(`点击:${x},${y} 角色 ${role.name} in [${currentX}, ${currentX + currentPosition.width*currentPosition.scale},${currentY},${currentY +currentPosition.height*currentPosition.scale}]`);
  //     // 检查点击是否在角色当前位置的区域内
  //     return x >= currentX && 
  //             x <= currentX + currentPosition.width*currentPosition.scale && 
  //             y >= currentY && 
  //             y <= currentY +currentPosition.height*currentPosition.scale;
  //   });
    
  //   //console.log('checkRoleClick :', clickedRole);
  //   return clickedRole;
  // }
          
  // // 绘制角色表情-- 暂未使用
  // drawRoleExpression(ctx, role, currentExpressionTrack, expression, _currentTimeInt) {
  //   if (!ctx || !role || !currentExpressionTrack || !expression) {
  //     return false;
  //   }
    
  //   try {
  //     // 获取当前帧索引
  //     const frameIndex = this.updateRoleState(role.id, expression, expression.frameInterval, currentExpressionTrack.startTime,_currentTimeInt);
      
  //     // 检查是否有有效的表情帧
  //     if (!expression.frames || !expression.frames[frameIndex]) {
  //       console.log(`角色 ${role.name} 在时间点 ${_currentTimeInt} 没有有效的表情帧`);
  //       return false;
  //     }
      
  //     // 获取图片URL
  //     const imageUrl = expression.frames[frameIndex];
  //     this.drawRoleImage(ctx, role, currentExpressionTrack, expression, imageUrl, img, _currentTimeInt, selectedRoleId.value, isPlaying.value);

  //   } catch (error) {
  //     console.error(`draw role expression error: ${error}`);
  //     return false;
  //   }
  // }
          
  // // 绘制角色选中状态
  // drawRoleSelection(ctx, track, role,_currentTimeInt) {
  //   if (!ctx || !track || !role) return;
    
  //   // 使用calculateCurrentPosition方法获取当前实际位置和尺寸
  //   // 注意：这里需要currentTime，但该方法没有传入，我们假设使用当前时间
  //   // 由于calculateCurrentPosition需要currentTime参数
  //   // 所以这里使用了全局的currentTime
  //   const currentPosition = this.calculateCurrentExpressPosition(track, _currentTimeInt);
  //   //console.log('drawRolSelection the currentPosition :', currentPosition);
  //   const x = currentPosition.isValid ? currentPosition.x : track.x;
  //   const y = currentPosition.isValid ? currentPosition.y : track.y;
  //   const width = currentPosition.isValid ? currentPosition.width * track.scale : this.config.roleWidth;
  //   const height = currentPosition.isValid ? currentPosition.height * track.scale : this.config.roleHeight;
    
  //   // 绘制闪烁的黄色边框
  //   ctx.strokeStyle = '#EAB308';
  //   ctx.lineWidth = 8;
    
  //   // 绘制圆角矩形边框
  //   const radius = 10;
  //   ctx.beginPath();
  //   ctx.moveTo(x + radius, y);
  //   ctx.lineTo(x + width - radius, y);
  //   ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  //   ctx.lineTo(x + width, y + height - radius);
  //   ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  //   ctx.lineTo(x + radius, y + height);
  //   ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  //   ctx.lineTo(x, y + radius);
  //   ctx.quadraticCurveTo(x, y, x + radius, y);
  //   ctx.closePath();
  //   ctx.stroke();
    
  //   // 重置线条样式
  //   ctx.setLineDash([]);
    
  //   // 绘制右上角宽高调整圆点
  //   const cornerDotSize = 10;
  //   const cornerDotX = x + width;
  //   const cornerDotY = y;
    
  //   // 保存当前状态以绘制调整圆点
  //   ctx.save();
    
  //   // 绘制圆点背景（黑色外圈）
  //   ctx.beginPath();
  //   ctx.arc(cornerDotX, cornerDotY, cornerDotSize, 0, Math.PI * 2);
  //   ctx.fillStyle = '#0000FF';
  //   ctx.fill();
    
  //   // 绘制圆点内芯（白色）
  //   ctx.beginPath();
  //   ctx.arc(cornerDotX, cornerDotY, cornerDotSize - 3, 0, Math.PI * 2);
  //   ctx.fillStyle = '#FFFFFF';
  //   ctx.fill();
    
  //   // 恢复状态
  //   ctx.restore();
    
  //   // 绘制右下角角度调整圆点
  //   const angleDotX = x + width;
  //   const angleDotY = y + height;
    
  //   // 保存当前状态以绘制角度调整圆点
  //   ctx.save();
    
  //   // 绘制圆点背景（蓝色外圈）
  //   ctx.beginPath();
  //   ctx.arc(angleDotX, angleDotY, cornerDotSize, 0, Math.PI * 2);
  //   ctx.fillStyle = '#0000FF';
  //   ctx.fill();
    
  //   // 绘制圆点内芯（红色 - 用于区分角度调整点）
  //   ctx.beginPath();
  //   ctx.arc(angleDotX, angleDotY, cornerDotSize - 3, 0, Math.PI * 2);
  //   ctx.fillStyle = '#FF0000';
  //   ctx.fill();
    
  //   // 恢复状态以继续绘制表情名称标签
  //   ctx.restore();
  //   ctx.save();
    
  //   // 绘制表情名称标签
  //   const expression = role.expressions.find(exp => exp && exp.id === track.expressionId);
  //   const expressionName = expression ? expression.name : '未知表情';
    
  //   // 计算文本宽度以正确设置背景
  //   ctx.font = '12px Arial';
  //   const textWidth = ctx.measureText(expressionName).width + 20;
  //   const textHeight = 20;
  //   const labelX = x + width / 2 - textWidth / 2;
    
  //   // 由于全局坐标系已经翻转，需要将Y坐标调整为在角色下方
  //   const labelY = y + height + 15;
    
  //   // 应用反向缩放，确保标签在翻转的坐标系中是正立的
  //   const centerX = labelX + textWidth / 2;
  //   const centerY = labelY + textHeight / 2;
  //   ctx.translate(centerX, centerY);
  //   ctx.scale(1, -1);
  //   ctx.translate(-centerX, -centerY);
    
  //   // 绘制标签背景
  //   ctx.fillStyle = '#10B981';
  //   ctx.beginPath();
  //   ctx.moveTo(labelX + 5, labelY);
  //   ctx.lineTo(labelX + textWidth - 5, labelY);
  //   ctx.quadraticCurveTo(labelX + textWidth, labelY, labelX + textWidth, labelY + 5);
  //   ctx.lineTo(labelX + textWidth, labelY + textHeight - 5);
  //   ctx.quadraticCurveTo(labelX + textWidth, labelY + textHeight, labelX + textWidth - 5, labelY + textHeight);
  //   ctx.lineTo(labelX + 5, labelY + textHeight);
  //   ctx.quadraticCurveTo(labelX, labelY + textHeight, labelX, labelY + textHeight - 5);
  //   ctx.lineTo(labelX, labelY + 5);
  //   ctx.quadraticCurveTo(labelX, labelY, labelX + 5, labelY);
  //   ctx.closePath();
  //   ctx.fill();
    
  //   // 绘制标签文本
  //   ctx.fillStyle = 'white';
  //   ctx.font = '12px Arial';
  //   ctx.textAlign = 'center';
  //   ctx.textBaseline = 'middle';
  //   ctx.fillText(expressionName, labelX + textWidth / 2, labelY + textHeight / 2);
    
  //   // 恢复原始状态
  //   ctx.restore();
  // }
  
  // // 绘制角色备用图形
  // drawRolePlaceholder(ctx, track, role, _currentTimeInt,highlight = false) {
  //   if (!ctx || !track || !role) return;
    
  //   // 保存当前状态，准备临时应用反向缩放以抵消全局翻转
  //   ctx.save();
    
  //   // 选择角色专属颜色
  //   const color = this.config.roleColors[role.id] || this.config.defaultColor;
    
  //   // 绘制一个更美观的备用图形
  //   ctx.fillStyle = highlight ? color : `${color}80`; // 透明度
  //   ctx.strokeStyle = color;
  //   ctx.lineWidth = 2;
    
  //   // 尝试获取场景级角色配置
  //   const currentPosition = this.calculateCurrentExpressPosition(track, _currentTimeInt);
    
  //   // 绘制圆角矩形
  //   const x = currentPosition.isValid ? currentPosition.x : track.x;
  //   const y = currentPosition.isValid ? currentPosition.y : track.y;
  //   const width = currentPosition.isValid ? currentPosition.width : this.config.roleWidth;
  //   const height = currentPosition.isValid ? currentPosition.height : this.config.roleHeight;
  //   const radius = 10;
    
  //   // 应用反向缩放，确保备用图形在翻转的坐标系中是正立的
  //   ctx.translate(x + width / 2, y + height / 2);
  //   ctx.scale(1, -1);
  //   ctx.translate(-(x + width / 2), -(y + height / 2));
    
  //   ctx.beginPath();
  //   ctx.moveTo(x + radius, y);
  //   ctx.lineTo(x + width - radius, y);
  //   ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  //   ctx.lineTo(x + width, y + height - radius);
  //   ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  //   ctx.lineTo(x + radius, y + height);
  //   ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  //   ctx.lineTo(x, y + radius);
  //   ctx.quadraticCurveTo(x, y, x + radius, y);
  //   ctx.closePath();
    
  //   ctx.fill();
  //   ctx.stroke();
    
  //   // 绘制角色图标
  //   ctx.fillStyle = 'white';
  //   ctx.font = 'bold 48px FontAwesome';
  //   ctx.textAlign = 'center';
  //   ctx.fillText(
  //     '\uf007', // 用户图标
  //     x + width/2, 
  //     y + height/2 + 15
  //   );
    
  //   // 恢复原始状态
  //   ctx.restore();
  // }

  // 重置所有状态
  reset() {
    this.roleStates = {};
    this.lastFrameTime = {};
  }


  // 重置特定角色的状态
  resetRole(roleId) {
    if (this.roleStates[roleId]) {
      delete this.roleStates[roleId];
      delete this.lastFrameTime[roleId];
    }
  }

  // 绘制角色图片的具体实现
  drawRoleImage(ctx, role, currentExpressionTrack, expression, imageUrl, img, _currentTimeInt, selectedRoleId, isPlaying) {
    if (!ctx || !role || !currentExpressionTrack || !expression) {
      return;
    }
    
    // 如果在播放状态且图片已缓存，则直接使用缓存图片
    if (img) {
      // console.log('使用缓存图片: ' + imageUrl);
      try {
        // 使用calculateCurrentPosition方法获取当前实际位置和尺寸角度
        const currentPosition = this.calculateCurrentExpressPosition(currentExpressionTrack, _currentTimeInt);
        
        // 如果坐标计算无效，返回
        if (!currentPosition.isValid) {
          console.log(`${role.name} ${currentExpressionTrack.expressionId} ${expression.name} miss start/end pos`);
          return;
        }
        
        //console.log(`will draw ${expression.name} ${currentPosition.width} ${currentPosition.height} scale:${currentExpressionTrack.scale}`);
        // console.log('currentExpressionTrack:',currentExpressionTrack);
        const currentX = currentPosition.x;
        const currentY = currentPosition.y;
        // 计算缩放系数，考虑canvas实际尺寸与分辨率的关系
        // const container = document.getElementById('canvasContainer');
        // const parentWidth = container.parentElement.clientWidth;
        // const parentHeight = container.parentElement.clientHeight;
        // const widthRatio = parentWidth / canvas.value.width;
        // const heightRatio = parentHeight / canvas.value.height;
        // const scale = Math.min(widthRatio, heightRatio, 1);
        // console.log('scale:', scale,',widthRatio:',widthRatio,',heightRatio:',heightRatio,', container:',parentWidth,parentHeight,'canvas w h:',canvas.value.width,canvas.value.height,currentExpressionTrack.scale);

        // 计算当前宽高，考虑表情缩放和canvas分辨率缩放
        const currentWidth = img.width * (currentPosition.scale || 1);
        const currentHeight = img.height * (currentPosition.scale || 1);
        const currentAngle = currentPosition.angle;
        
        // console.log('current:',currentWidth,currentHeight,currentExpressionTrack.scale);

        // 保存当前状态，准备临时应用反向缩放以抵消全局翻转
        ctx.save();
        
        // 在角色绘制前应用反向缩放，确保图片在翻转的坐标系中是正立的
        ctx.translate(currentX + currentWidth / 2, currentY + currentHeight / 2);
        ctx.scale(1, -1);
        ctx.translate(-(currentX + currentWidth / 2), -(currentY + currentHeight / 2));
        
        // 如果有角度，应用旋转
        if (currentAngle && currentAngle !== 0) {
          ctx.save();
          ctx.translate(currentX + currentWidth / 2, currentY + currentHeight / 2);
          ctx.rotate((currentAngle * Math.PI) / 180); // 转换为弧度
          ctx.translate(-(currentX + currentWidth / 2), -(currentY + currentHeight / 2));
        }
        
        // console.log('w h:',img.width, img.height,currentWidth,currentHeight);
        // 绘制角色图片，使用计算后的宽高代替图片原始宽高，解决分辨率误差问题
        ctx.drawImage(
          img, 
          currentX, 
          currentY,
          currentWidth, // 使用计算后的宽度
          currentHeight  // 使用计算后的高度
        );
        
        // 如果应用了旋转，恢复状态
        if (currentAngle && currentAngle !== 0) {
          ctx.restore();
        }
        
        // 恢复原始状态
        ctx.restore();

        

        // 保存当前状态，准备绘制角色名称
        ctx.save();
        
        // 不使用save/restore和缩放，直接在正确的位置绘制角色名称
        // 由于全局坐标系已经翻转，需要将Y坐标调整为在角色上方
        const nameY = currentY + currentHeight + 15;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(
          role.name, 
          currentX + currentWidth / 2, 
          nameY
        );
        ctx.fillText(
            role.name, 
            currentX + currentWidth / 2, 
            nameY
          );
          
          // 恢复原始状态
          ctx.restore();
      } catch (error) {
        console.error('绘制缓存图片时出错: ' + error);
        this.drawRolePlaceholder(ctx, currentExpressionTrack, role, true);
      }
    } else {
      // 使用统一的图片加载函数
      try {
        if (img === null || img === undefined) {
          // 保存this上下文，以便在回调函数中使用
          const self = this;
          img = loadImageWithCORS(
            imageUrl,
            (loadedImg) => {
              // 添加到缓存
              console.log('加载角色图片成功: ' , imageUrl,loadedImg);
              self.drawRoleImage(ctx, role, currentExpressionTrack, expression, imageUrl, loadedImg, _currentTimeInt, selectedRoleId, isPlaying);
            },
            () => {
              console.error('无法加载角色图片: ' + imageUrl);
              debugInfo.value = '角色图片加载失败: ' + role.name;
              // 最终失败时，确保备用图形清晰可见
              self.drawRolePlaceholder(ctx, currentExpressionTrack, role, true);
            }
          );
        }
      } catch (error) {
        console.error('设置图片源时出错: ' + error);
        this.drawRolePlaceholder(ctx, currentExpressionTrack, role, true);
      }
    }

    // 在Canvas上绘制选中状态
    if (!isPlaying && selectedRoleId === role.id) {
      this.drawRoleSelection(ctx, currentExpressionTrack, role, _currentTimeInt);
    }
  }
}//类定义结束


export default RoleExpressionManager;