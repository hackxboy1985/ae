// import { Sprite, Anim, AnimFrame, ImageItem } from 'sprite.js';
// import { Project } from './project.js';
// import { Commands } from './commands.js';
// import { ModuleMove } from './moduleMove.js';
// import { Api } from './api.js';
// import {LWImageManager} from './image.js';


// 全局变量
        

        // 新增：图片预览canvas
        let imagePreviewCanvas = document.getElementById('image-preview-canvas');
        let imagePreviewCtx = imagePreviewCanvas ? imagePreviewCanvas.getContext('2d') : null;
        // 变形预览canvas
        let originalPreviewCanvas = document.getElementById('original-preview');
        let originalPreviewCtx = originalPreviewCanvas ? originalPreviewCanvas.getContext('2d') : null;
        let flipHorizontalPreviewCanvas = document.getElementById('flip-horizontal-preview');
        let flipHorizontalPreviewCtx = flipHorizontalPreviewCanvas ? flipHorizontalPreviewCanvas.getContext('2d') : null;
        let flipVerticalPreviewCanvas = document.getElementById('flip-vertical-preview');
        let flipVerticalPreviewCtx = flipVerticalPreviewCanvas ? flipVerticalPreviewCanvas.getContext('2d') : null;
        // 新增：水平+垂直翻转预览canvas
        let flipBothPreviewCanvas = document.getElementById('flip-both-preview');
        let flipBothPreviewCtx = flipBothPreviewCanvas ? flipBothPreviewCanvas.getContext('2d') : null;
        
        let moduleInfo = document.getElementById('module-info');
        let isImageModuleRangeMoving = false;
        let cropStartX = 0;
        let cropStartY = 0;
        let isCropping = false;
        // 虚拟裁剪框参数
        let cropLeft = 0;
        let cropTop = 0;
        let cropWidth = 0;
        let cropHeight = 0;
        let currentImage = null;
        let currentImageId = null;
        let previewImage = null; // 专门用于canvas渲染的图片变量
        let previewImageId = null; // 预览图片的ID
        let imageManager = null; // 只声明不初始化
        let zoomLevel = 1; // 当前缩放级别
        let zoomCenterX = 0; // 缩放中心点X
        let zoomCenterY = 0; // 缩放中心点Y
        // 新增：图片预览相关变量
        let previewZoomLevel = 1; // 预览canvas的缩放级别
        // let selectedImageModule = -1; // 当前选中的图片模块
        let showPreviewWithMouse = false; // 是否显示跟随鼠标的预览
        let selectedTransformation = 'original'; // 当前选中的变形方式
        let mouseXOnCanvas = 0; // 鼠标在canvas上的X坐标
        let mouseYOnCanvas = 0; // 鼠标在canvas上的Y坐标
        // 拖拽操作模式变量
        let resizeMode = null; // 'move', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        let initialLeft = 0;
        let initialTop = 0;
        let initialWidth = 0;
        let initialHeight = 0;
        let currentProject = null;
        let currentSprite = null;
        let currentAnim = null;
        let currentFrame = null;
        let currentFrameIndex = 0;
        let selectedModuleIndex = -1; // 当前选中的单个模块索引
        let selectedModuleIndices = []; // 存储多个选中模块的索引数组
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let isMarqueeSelecting = false; // 是否正在进行框选
        let marqueeStartX = 0; // 框选起始点X坐标
        let marqueeStartY = 0; // 框选起始点Y坐标
        let marqueeEndX = 0; // 框选结束点X坐标
        let marqueeEndY = 0; // 框选结束点Y坐标
        // 图片模块编辑模式
        let editMode = 'crop'; // 'crop' 或 'edit'
        let selectedImageModule = -1; // 当前选中的图片模块
        let isCtrlPressed = false;// 是否按下了Ctrl键或cmd键
        let isPlaying = false;
        let animationSpeed = 100;
        let lastFrameTime = 0;
        let animationFrameId = null;
        let selectedImageModules = []; // 支持多选模块的数组
        let dragStartModuleStates = []; // 保存所有选中模块的初始状态，用于拖拽操作
        let currentTab = 'animation';
        let isMultiDragging = false; // 控制多选时的拖拽状态
        
        // 存储复制的模块信息，用于跨精灵粘贴
        let copiedModuleInfo = null;
        let copiedModuleInfos = null; // 存储复制的多个模块信息
        
        // 网格相关设置
        let showGrid = true;         // 是否显示网格
        const gridSize = 20;         // 网格大小（像素）
        const gridColor = '#e0e0e0'; // 网格颜色
        
        // 定义与ActionEditor相同的原点变量
        let m_imageOriginPos = { x: 0, y: 0 };
        
        // 命令管理器单例
        CommandManager.instance = new CommandManager();
        
        // 调整canvas大小以适应容器
        function resizeCanvas() {
            const container = canvas.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // 设置canvas的实际尺寸
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // 重新渲染画布

        }
        
        
        
        // 图片模块编辑的原点位置
        let imageModuleOriginPos = { x: 0, y: 0 };
        
        // 调试函数：检查canvas和相关变量的状态
        function debugCanvasState() {
            console.log('==== Canvas状态检查 ====');
            console.log('currentSprite:', currentSprite ? '存在' : '不存在');
            console.log('currentImageId:', currentImageId);
            console.log('currentImage:', currentImage ? (currentImage.src || '图片对象存在但无src') : '不存在');
            console.log('imagePreviewCanvas:', imagePreviewCanvas ? '存在' : '不存在');
            console.log('imagePreviewCtx:', imagePreviewCtx ? '存在' : '不存在');
            
            // 检查DOM元素
            const dropdownEl = document.getElementById('image-dropdown');
            console.log('image-dropdown元素:', dropdownEl ? '存在' : '不存在');
            
            const canvasEl = document.getElementById('image-preview-canvas');
            console.log('image-preview-canvas DOM元素:', canvasEl ? '存在' : '不存在');
            if (canvasEl) {
                console.log('canvas尺寸:', canvasEl.width + 'x' + canvasEl.height);
            }
            
            // 检查sprite中的图片列表
            if (currentSprite && currentSprite.m_imageList) {
                console.log('sprite中的图片数量:', currentSprite.m_imageList.length);
                if (currentSprite.m_imageList.length > 0) {
                    console.log('第一张图片信息:', currentSprite.m_imageList[0].name + ' (id: ' + currentSprite.m_imageList[0].id + ')');
                }
            }
            console.log('========================');
        }
        
        //清理选中状态
        function clearClickPreviewTransform() {
            // 绑定变形选项点击事件
            const transformationItems = document.querySelectorAll('.transformation-item');
            transformationItems.forEach(i => i.style.border = 'none');
        }

        // 渲染图片预览
        function renderImagePreview(i = -1) {
            if (i !== -1) {
                console.log('renderImagePreview',i);
            }
            // debugCanvasState();
            if (!previewImage || !imagePreviewCanvas || !imagePreviewCtx) {
                console.warn('Cannot render preview: missing required elements');
                return;
            }
            
            // 检查图片是否已加载完成
            // if (!previewImage.complete || previewImage.naturalWidth === 0) {
            //     console.log('图片尚未加载完成，等待加载...');
            //     previewImage.onload = function() {
            //         console.log('图片加载完成，重新渲染');
            //         renderImagePreview();
            //     };
                
            //     // 如果图片已经有src但未加载，尝试重新加载
            //     if (previewImage.src) {
            //         console.log('尝试重新加载图片');
            //         previewImage.src = previewImage.src;
            //     }
            //     return;
            // }
            
            // 设置canvas大小以适应容器（只在初始化或图片改变时设置，不随缩放变化）
            const container = imagePreviewCanvas.parentElement;
            // 保持canvas尺寸固定，只改变绘制时的缩放比例
            if (!imagePreviewCanvas.dataset.initialized) {
                // 首次加载或图片改变时设置canvas尺寸
                // console.log('首次设置canvas尺寸为适应容器');
                imagePreviewCanvas.width = container.clientWidth - 20; // 减去边距
                imagePreviewCanvas.height = 300; // 设置固定高度
                imagePreviewCanvas.dataset.initialized = 'true';
            }
            
            // 清空画布
            // console.log('清空画布，尺寸:', imagePreviewCanvas.width + 'x' + imagePreviewCanvas.height);
            imagePreviewCtx.clearRect(0, 0, imagePreviewCanvas.width, imagePreviewCanvas.height);
            
            // 设置canvas样式使其可见
            // console.log('设置canvas样式以确保可见');
            imagePreviewCanvas.style.border = '2px solid #4CAF50';
            imagePreviewCanvas.style.display = 'block';
            imagePreviewCanvas.style.backgroundColor = '#f0f0f0';
            imagePreviewCanvas.style.margin = '10px 0';
            imagePreviewCanvas.style.visibility = 'visible';
            imagePreviewCanvas.style.opacity = '1';
            
            // 计算图片绘制位置（居中）
            const drawX = (imagePreviewCanvas.width - previewImage.width * previewZoomLevel) / 2;
            const drawY = 20; // 顶部留出一些空间
            const drawWidth = previewImage.width * previewZoomLevel;
            const drawHeight = previewImage.height * previewZoomLevel;
            
            // 绘制图片
            // console.log('开始绘制图片:');
            // console.log('  图片尺寸:', previewImage.width + 'x' + previewImage.height);
            // console.log('  绘制位置:', drawX + ', ' + drawY);
            // console.log('  绘制尺寸:', drawWidth + 'x' + drawHeight);
            // console.log('  缩放级别:', previewZoomLevel);
            
            imagePreviewCtx.drawImage(
                previewImage, 
                0, 0, 
                previewImage.width, previewImage.height, 
                drawX, drawY, 
                drawWidth, drawHeight
            );
            
            // 绘制所有模块矩形
            if (currentSprite && previewImageId) {
                const imageItem = currentSprite.getImage(previewImageId);
                if (imageItem) {
                    if (imageItem.modulesList) {
                        imageItem.modulesList.forEach((module, index) => {
                            // 绘制模块边框
                            imagePreviewCtx.strokeStyle = index === selectedImageModule ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
                            imagePreviewCtx.lineWidth = index === selectedImageModule ? 3 : 2;
                            imagePreviewCtx.strokeRect(
                                drawX + module.x * previewZoomLevel, 
                                drawY + module.y * previewZoomLevel, 
                                module.width * previewZoomLevel, 
                                module.height * previewZoomLevel
                            );
                            // 绘制模块索引
                            imagePreviewCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            imagePreviewCtx.fillRect(
                                drawX + module.x * previewZoomLevel, 
                                drawY + module.y * previewZoomLevel, 
                                20, 
                                20
                            );
                            imagePreviewCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                            imagePreviewCtx.font = '14px Arial';
                            imagePreviewCtx.fillText(
                                `${index + 1}`, 
                                drawX + module.x * previewZoomLevel + 5, 
                                drawY + module.y * previewZoomLevel + 16
                            );
                        });
                        // console.log('模块绘制完成');
                    } else {
                        // console.log('模块列表不存在或为空');
                    }
                } else {
                    // console.log('未找到对应的imageItem');
                }
            } else {
                // console.log('currentSprite或currentImageId不存在');
            }
            
            notification('图片选择！');
        }

        function notification(text) {
            const notification = document.createElement('div');
            notification.textContent = text;
            notification.style.cssText = 'position: fixed; top: 10%; left: 50%; transform: translate(-50%, -50%); background-color: #4CAF50; color: white; padding: 10px; border-radius: 4px; z-index: 1001;';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        // 处理图片预览canvas的点击事件
        function handlePreviewCanvasClick(e) {
            // console.log('点击预览位置:', e.clientX, e.clientY);
            if (!currentSprite || !previewImage) return;


            const rect = imagePreviewCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // console.log('点击预览位置:', mouseX, mouseY);
            
            const imageItem = currentSprite.getImage(previewImageId);
            if (!imageItem || !imageItem.modulesList) return;
            
            // 计算图片在canvas上的位置
            const drawX = (imagePreviewCanvas.width - previewImage.width * previewZoomLevel) / 2;
            const drawY = 20;
            
            // 检查是否点击了某个模块
            let clickedModuleIndex = -1;
            for (let i = imageItem.modulesList.length - 1; i >= 0; i--) {
                const module = imageItem.modulesList[i];
                const moduleX = drawX + module.x * previewZoomLevel;
                const moduleY = drawY + module.y * previewZoomLevel;
                const moduleWidth = module.width * previewZoomLevel;
                const moduleHeight = module.height * previewZoomLevel;
                
                if (mouseX >= moduleX && mouseX <= moduleX + moduleWidth && 
                    mouseY >= moduleY && mouseY <= moduleY + moduleHeight) {
                    clickedModuleIndex = i;
                    break;
                }
            }
            
            if (clickedModuleIndex !== -1) {
                // 选中模块并保存为变量，但不直接添加到当前帧
                selectedImageModule = clickedModuleIndex;
                showPreviewWithMouse = true;
                
                // 显示变形预览区域
                document.getElementById('transformation-preview').style.display = 'flex';
                // console.log('绘制变形', clickedModuleIndex);
                // 渲染变形预览
                renderTransformationPreviews(imageItem, clickedModuleIndex);
            } else {
                // 如果点击了canvas其他区域，取消选中
                selectedImageModule = -1;
                showPreviewWithMouse = false;
                document.getElementById('transformation-preview').style.display = 'none';
            }
            
            // 重新渲染图片预览
            renderImagePreview();
        }
        
        // 更新鼠标位置
        function updateMousePosition(e) {
            const rect = imagePreviewCanvas.getBoundingClientRect();
            const canvasScale = (imagePreviewCanvas.width/rect.width);
            mouseXOnCanvas = (e.clientX - rect.left) * canvasScale;
            mouseYOnCanvas = (e.clientY - rect.top) * canvasScale;
        }
        
        // 渲染变形预览
        function renderTransformationPreviews(imageItem, moduleIndex) {
            if (!imageItem || !imageItem.image || moduleIndex < 0 || moduleIndex >= imageItem.modulesList.length) return;
            
            const module = imageItem.modulesList[moduleIndex];
            const scale = Math.min(60 / module.width, 60 / module.height);
            const scaledWidth = module.width * scale;
            const scaledHeight = module.height * scale;
            
            // 清空所有变形预览canvas
            if (originalPreviewCtx) {
                originalPreviewCtx.clearRect(0, 0, 60, 60);
            }
            if (flipHorizontalPreviewCtx) {
                flipHorizontalPreviewCtx.clearRect(0, 0, 60, 60);
            }
            if (flipVerticalPreviewCtx) {
                flipVerticalPreviewCtx.clearRect(0, 0, 60, 60);
            }
            if (flipBothPreviewCtx) {
                flipBothPreviewCtx.clearRect(0, 0, 60, 60);
            }
            
            // 计算居中位置
            const offsetX = (60 - scaledWidth) / 2;
            const offsetY = (60 - scaledHeight) / 2;
            
            // 绘制原图预览
            if (originalPreviewCtx) {
                originalPreviewCtx.drawImage(
                    imageItem.image,
                    module.x, module.y, module.width, module.height,
                    offsetX, offsetY, scaledWidth, scaledHeight
                );
            }
            
            // 绘制水平翻转预览
            if (flipHorizontalPreviewCtx) {
                flipHorizontalPreviewCtx.save();
                flipHorizontalPreviewCtx.translate(60, 0);
                flipHorizontalPreviewCtx.scale(-1, 1);
                flipHorizontalPreviewCtx.drawImage(
                    imageItem.image,
                    module.x, module.y, module.width, module.height,
                    offsetX, offsetY, scaledWidth, scaledHeight
                );
                flipHorizontalPreviewCtx.restore();
            }
            
            // 绘制垂直翻转预览
            if (flipVerticalPreviewCtx) {
                flipVerticalPreviewCtx.save();
                flipVerticalPreviewCtx.translate(0, 60);
                flipVerticalPreviewCtx.scale(1, -1);
                flipVerticalPreviewCtx.drawImage(
                    imageItem.image,
                    module.x, module.y, module.width, module.height,
                    offsetX, offsetY, scaledWidth, scaledHeight
                );
                flipVerticalPreviewCtx.restore();
            }
            
            // 绘制水平+垂直翻转预览
            if (flipBothPreviewCtx) {
                flipBothPreviewCtx.save();
                flipBothPreviewCtx.translate(60, 60);
                flipBothPreviewCtx.scale(-1, -1);
                flipBothPreviewCtx.drawImage(
                    imageItem.image,
                    module.x, module.y, module.width, module.height,
                    offsetX, offsetY, scaledWidth, scaledHeight
                );
                flipBothPreviewCtx.restore();
            }
        }
        
        // 将选中的模块添加到动作编辑的当前帧
        function addModuleToFrame(e) {
            // 如果正在编辑表情区域，不允许添加模块
            if (isEditingExpressionRect) {
                return;
            }

            console.log('currentFrame:',!currentFrame);
            console.log('currentImageId:',previewImageId);
            console.log('selectedImageModule:',selectedImageModule);
            if (!currentFrame || !currentSprite || !previewImageId || selectedImageModule === -1) return;
            

            const [x, y] = getCurrentXY(e);
            console.log('添加模块到当前帧', x, y);
            const imageItem = currentSprite.getImage(previewImageId);
            if (!imageItem || !imageItem.modulesList || selectedImageModule >= imageItem.modulesList.length) return;
            
            // 创建新模块
            const module = new Module(previewImageId, selectedImageModule);
            
            // 添加到当前帧
            const frameModule = new FrameModule(module, x, y);
            
            // 应用选中的变形
            if (selectedTransformation === 'flip-horizontal') {
                frameModule.flag = 1;
            } else if (selectedTransformation === 'flip-vertical') {
                frameModule.flag = 2;
            } else if (selectedTransformation === 'flip-both') {
                frameModule.flag = 3;
            }
            
            currentFrame.addModule(frameModule);
            
            showPreviewWithMouse = false;
            clearClickPreviewTransform();
            // 更新界面
            renderCanvas();
        }
        
        // 绘制跟随鼠标的预览
        function drawMouseFollowPreview(ctx) {
            // 只在动作编辑标签页显示预览
            // console.log('currentSprite', currentSprite,previewImageId,selectedImageModule);
            if (currentTab !== 'animation' || !showPreviewWithMouse || !currentSprite || !previewImageId || selectedImageModule === -1) return;
            
            // console.log('previewImageId', previewImageId);
            const imageItem = currentSprite.getImage(previewImageId);
            // console.log('imageItem', imageItem);
            if (!imageItem || !imageItem.image || selectedImageModule >= imageItem.modulesList.length) {
                console.log('null， can not review');
                return;
            }
            
            const module = imageItem.modulesList[selectedImageModule];

            ctx.save();
            
            // 移动到鼠标位置
            ctx.translate(mouseXOnCanvas, mouseYOnCanvas);
            
            // 应用变形
            if (selectedTransformation === 'flip-horizontal') {
                ctx.scale(-1, 1);
            } else if (selectedTransformation === 'flip-vertical') {
                ctx.scale(1, -1);
            }
            
            // 绘制模块预览（半透明）
            ctx.globalAlpha = 0.7;
            ctx.drawImage(
                imageItem.image,
                module.x, module.y, module.width, module.height,
                //-module.width / 2, -module.height / 2,
                0,0,
                 module.width, module.height
            );
            
            ctx.restore();
        }
        
        // 绘制当前图片（考虑缩放）
        function drawCurrentImage() {
            if (!currentImage) return;
            
            imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            
            // 计算图片绘制位置（保持图片在画布中心）
            const drawX = (imageCanvas.width - currentImage.width * zoomLevel) / 2;
            const drawY = (imageCanvas.height - currentImage.height * zoomLevel) / 2;
            const drawWidth = currentImage.width * zoomLevel;
            const drawHeight = currentImage.height * zoomLevel;
            
            // 记录缩放中心点
            zoomCenterX = imageCanvas.width / 2;
            zoomCenterY = imageCanvas.height / 2;
            
            // 设置图片模块编辑的原点位置（画布中心）
            imageModuleOriginPos.x = imageCanvas.width / 2;
            imageModuleOriginPos.y = imageCanvas.height / 2;
            
            // 如果需要显示网格，先绘制网格
            if (showGrid) {
                imageCtx.strokeStyle = gridColor;
                imageCtx.lineWidth = 1; // 线宽固定
                
                // 绘制垂直网格线
                imageCtx.beginPath();
                for (let x = 0; x <= imageCanvas.width; x += gridSize) {
                    imageCtx.moveTo(x, 0);
                    imageCtx.lineTo(x, imageCanvas.height);
                }
                imageCtx.stroke();
                
                // 绘制水平网格线
                imageCtx.beginPath();    
                for (let y = 0; y <= imageCanvas.height; y += gridSize) {
                    imageCtx.moveTo(0, y);
                    imageCtx.lineTo(imageCanvas.width, y);
                }
                imageCtx.stroke();
            }
            
            // 绘制X轴和Y轴
            imageCtx.strokeStyle = '#999';
            imageCtx.lineWidth = 1;
            imageCtx.setLineDash([5, 5]);

            // X轴
            imageCtx.beginPath();
            imageCtx.moveTo(0, imageModuleOriginPos.y);
            imageCtx.lineTo(imageCanvas.width, imageModuleOriginPos.y);
            imageCtx.stroke();
            
            // Y轴
            imageCtx.beginPath();
            imageCtx.moveTo(imageModuleOriginPos.x, 0);
            imageCtx.lineTo(imageModuleOriginPos.x, imageCanvas.height);
            imageCtx.stroke();
            
            // 重置线条样式
            imageCtx.setLineDash([]);
            
            // 绘制原点十字线
            imageCtx.strokeStyle = 'red';
            imageCtx.lineWidth = 1;
            imageCtx.beginPath();
            imageCtx.moveTo((imageModuleOriginPos.x) - 8, imageModuleOriginPos.y);
            imageCtx.lineTo((imageModuleOriginPos.x) + 8, imageModuleOriginPos.y); 
            imageCtx.moveTo(imageModuleOriginPos.x, (imageModuleOriginPos.y) - 8);
            imageCtx.lineTo(imageModuleOriginPos.x, (imageModuleOriginPos.y) + 8);
            imageCtx.stroke();
            
            // 绘制缩放后的图片
            imageCtx.drawImage(
                currentImage, 
                0, 0, 
                currentImage.width, currentImage.height, 
                drawX, drawY, 
                drawWidth, drawHeight
            );
            
            // 绘制选中的模块
            drawSelectedModules();
            
            // 根据当前模式显示不同的内容
            if (editMode === 'crop') {
                // 裁剪模式：显示虚拟裁剪框
                if (isCropping && cropWidth > 0 && cropHeight > 0) {
                    const canvasX = drawX + cropLeft * zoomLevel;
                    const canvasY = drawY + cropTop * zoomLevel;
                    const canvasWidth = cropWidth * zoomLevel;
                    const canvasHeight = cropHeight * zoomLevel;
                    
                    // 绘制裁剪框边框
                    imageCtx.strokeStyle = 'blue';
                    imageCtx.lineWidth = 2;
                    imageCtx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);
                    
                    // 绘制裁剪框内部透明覆盖层
                    imageCtx.fillStyle = 'rgba(0, 128, 255, 0.1)';
                    imageCtx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);
                    
                    // 绘制裁剪手柄
                    drawCropHandles(canvasX, canvasY, canvasWidth, canvasHeight);
                }
            } else if (editMode === 'edit') {
                // 编辑模式：显示所有现有模块，并高亮选中的模块
                const imageItem = currentSprite.getImage(currentImageId);
                if (imageItem && imageItem.modulesList) {
                    imageItem.modulesList.forEach((module, index) => {
                        const moduleX = drawX + module.x * zoomLevel;
                        const moduleY = drawY + module.y * zoomLevel;
                        const moduleWidth = module.width * zoomLevel;
                        const moduleHeight = module.height * zoomLevel;
                        
                        // 如果是选中的模块，高亮显示
                        if (index === selectedImageModule) {
                            // 绘制选中模块的边框
                            imageCtx.strokeStyle = 'green';
                            imageCtx.lineWidth = 2;
                            imageCtx.strokeRect(moduleX, moduleY, moduleWidth, moduleHeight);
                            
                            // 绘制选中模块内部透明覆盖层
                            imageCtx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                            imageCtx.fillRect(moduleX, moduleY, moduleWidth, moduleHeight);
                            
                            // 绘制调整手柄
                            drawCropHandles(moduleX, moduleY, moduleWidth, moduleHeight);
                        } else {
                            // 绘制未选中模块的边框
                            imageCtx.strokeStyle = 'gray';
                            imageCtx.lineWidth = 1;
                            imageCtx.strokeRect(moduleX, moduleY, moduleWidth, moduleHeight);
                        }
                    });
                }
            }
            
            // 绘制跟随鼠标的预览
            drawMouseFollowPreview(imageCtx);
        }
        
        // 绘制裁剪手柄
        function drawCropHandles(x, y, width, height) {
            const handleSize = 6;
            const handleStyle = '#0066cc';
            
            imageCtx.fillStyle = handleStyle;
            
            // 左上角
            imageCtx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
            // 右上角
            imageCtx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
            // 左下角
            imageCtx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
            // 右下角
            imageCtx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
            // 左边
            imageCtx.fillRect(x - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
            // 右边
            imageCtx.fillRect(x + width - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
            // 上边
            imageCtx.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize);
            // 下边
            imageCtx.fillRect(x + width/2 - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        }
        
        // 处理放大
        function handleZoomIn() {
            zoomLevel = Math.min(zoomLevel + 0.1, 5); // 最大放大5倍
            updateZoomLevel();
            // 根据当前标签页更新对应的画布
            if (currentTab === 'animation') {
                renderCanvas();
            } else {
                drawCurrentImage();
            }
        }
        
        // 处理缩小
        function handleZoomOut() {
            zoomLevel = Math.max(zoomLevel - 0.1, 0.1); // 最小缩小到0.1倍
            updateZoomLevel();
            // 根据当前标签页更新对应的画布
            if (currentTab === 'animation') {
                renderCanvas();
            } else {
                drawCurrentImage();
            }
        }
        
        // 重置缩放
        function handleZoomReset() {
            zoomLevel = 1;
            updateZoomLevel();
            // 重置原点到画布中心
            if (!isDraggingOrigin) {
                updateImageOriginPos();
            }
            // 根据当前标签页更新对应的画布
            if (currentTab === 'animation') {
                renderCanvas();
            } else {
                drawCurrentImage();
            }
        }
        
        // 更新原点位置
        function updateImageOriginPos() {
            m_imageOriginPos.x = canvas.width / 2;
            m_imageOriginPos.y = canvas.height / 2;
        }
        
        // 跟踪空格键状态
        let isSpacePressed = false;
        // 跟踪是否处于拖拽原点模式
        let isDraggingOrigin = false;
        // 拖拽原点的起始位置（原有变量，保留以确保兼容性）
        let originDragStartX = 0;
        let originDragStartY = 0;
        // 拖拽原点时的屏幕坐标和原点位置
        let originDragScreenX = 0;
        let originDragScreenY = 0;
        let originDragStartPosX = 0;
        let originDragStartPosY = 0;
        
        // 模块拖拽相关变量
        let moduleDragStartX = 0;
        let moduleDragStartY = 0;
        
        // 显示动作编辑区鼠标位置
        function showMousePosition(e) {
            const rect = canvas.getBoundingClientRect();
            const canvasScale = (canvas.width/rect.width);
            const x = (e.clientX - rect.left) * canvasScale;
            const y = (e.clientY - rect.top) * canvasScale;
            
            // 计算相对于画布中心的坐标
            const relativeX = Math.round((x - m_imageOriginPos.x)/zoomLevel);
            const relativeY = Math.round((m_imageOriginPos.y - y)/zoomLevel);
            //console.log('scaledX:',x - m_imageOriginPos.x, relativeX, 'scaledY:',m_imageOriginPos.y - y,relativeY);

            // 更新鼠标位置显示
            document.getElementById('mouse-position').textContent = 
                `鼠标位置: 绝对(${Math.round(x)}, ${Math.round(y)}) 相对(${relativeX}, ${relativeY})`;
        }
        
        
        
        // 更新缩放级别显示
        function updateZoomLevel() {
            document.getElementById('zoom-level').textContent = Math.round(zoomLevel * 100) + '%';
            document.getElementById('animation-zoom-level').textContent = Math.round(zoomLevel * 100) + '%';
        }
        
        // 处理鼠标滚轮缩放
        function handleMouseWheel(e) {
            e.preventDefault();
            
            // 应用缩放
            if (e.deltaY < 0) {
                zoomLevel = Math.min(zoomLevel + 0.05, 5);
            } else {
                zoomLevel = Math.max(zoomLevel - 0.05, 0.1);
            }
            
            updateZoomLevel();
            
            console.log('currentTab=',currentTab);
            // 根据当前编辑模式调用相应的绘制函数
            if (currentTab === 'animation') {
                renderCanvas();
            }else{
                drawCurrentImage();
            }

            // if (currentImage) {
            //     drawCurrentImage();
            // } else if (currentFrame) {
            //      renderCanvas();
            // }
        }
        

        
        
        
        // 绘制所有已选模块到图片画布上
        function drawSelectedModules() {
            if (!currentImage || !currentSprite || !currentImageId) return;
            
            // // 清空画布并重绘原图
            // imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            // imageCtx.drawImage(currentImage, 0, 0);
            
            const imageItem = currentSprite.getImage(currentImageId);
            if (!imageItem) return;
            
            // 检查是否显示所有模块
            const showAllModules = document.getElementById('show-all-modules').checked;
            const drawX = (imageCanvas.width - currentImage.width * zoomLevel) / 2;
            const drawY = (imageCanvas.height - currentImage.height * zoomLevel) / 2;
            // console.log('图片在画布上的绘制位置：',drawX,drawY);

            if (showAllModules) {

                // 绘制所有模块
                imageItem.modulesList.forEach((module, index) => {
                    if (index >= 0 && index < imageItem.modulesList.length) {
                        // 绘制模块边框
                        imageCtx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                        imageCtx.lineWidth = 2;
                        imageCtx.strokeRect(drawX + module.x * zoomLevel, drawY + module.y * zoomLevel, module.width * zoomLevel, module.height * zoomLevel);
                        // 绘制模块索引
                        imageCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                        imageCtx.font = '12px Arial';
                        imageCtx.fillText(`${index + 1}`, drawX + module.x * zoomLevel + 2, drawY + module.y * zoomLevel + 14);
                    }
                });
            }
            //else {
            // 绘制所有选中的模块
            const needDrawModules = selectedImageModule !== -1 ? [selectedImageModule] : selectedImageModules;
            
            imageItem.modulesList.forEach((module,index) => {
                if (index >= 0 && index < imageItem.modulesList.length && needDrawModules.includes(index)) {
                    // 绘制选中模块的高亮框
                    imageCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                    imageCtx.lineWidth = 2;
                    imageCtx.strokeRect(drawX + module.x * zoomLevel, drawY + module.y * zoomLevel, module.width * zoomLevel, module.height * zoomLevel);
                    // 绘制模块索引
                    imageCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    imageCtx.font = '12px Arial';
                    imageCtx.fillText(`${index + 1}`, drawX + module.x * zoomLevel + 2, drawY + module.y * zoomLevel + 14);
                }
            });
            // }
        }
        
        // 切换Tab函数 switchTab("animation")
        function switchTab(tabName) {
            // 更新Tab状态
            document.getElementById('tab-animation').classList.remove('active');
            document.getElementById('tab-image').classList.remove('active');
            document.getElementById('content-animation').classList.remove('active');
            document.getElementById('content-image').classList.remove('active');
            
            document.getElementById(`tab-${tabName}`).classList.add('active');
            document.getElementById(`content-${tabName}`).classList.add('active');
            
            currentTab = tabName;
            
            // 根据Tab重新渲染并控制控制面板显示
            if (tabName === 'animation') {
                // 停止图片模块编辑的框选和编辑操作
                selectedImageModule = -1; // 清除选中的图片模块
                selectedImageModules = []; // 清除多选图片模块数组
                // isEditingExpressionRect = false; // 停止表情区域编辑
                // isDraggingExpressionRect = false; // 停止表情区域拖拽
                expressionResizeControlPoint = -1; // 清除表情区域调整点
                
                // 清除表情区域按钮的activate状态
                const cropBtn = document.getElementById('crop-module');
                if (cropBtn) {
                    // console.log('111');
                    cropBtn.classList.remove('active');
                }
                const editBtn = document.getElementById('edit-module');
                if (editBtn) {
                    // console.log('222');
                    editBtn.classList.remove('active');
                }
                // 设置为非裁剪非编辑模式
                editMode = 'crop';
                isCropping = false;


                renderCanvas(1);
                  updateExpressionCheckboxState();
                // document.getElementById('animation-modules-list').innerHTML = '';
                // document.getElementById('selected-image-title').textContent = '选择图片查看模块';
                
                // 显示动作编辑控制面板，隐藏图片模块编辑控制面板
                document.getElementById('control-panel').style.display = 'flex';
                document.getElementById('expression-list-section').style.display = 'none';
                document.getElementById('image-control-section').style.display = 'none';
                
                

                // 重新初始化图片预览相关元素
                console.log('Initializing image preview elements in switchTab(animation)');
                if (!imagePreviewCanvas) {
                    console.log('Looking for image-preview-canvas element');
                    imagePreviewCanvas = document.getElementById('image-preview-canvas');
                    if (imagePreviewCanvas) {
                        imagePreviewCtx = imagePreviewCanvas.getContext('2d');
                        console.log('Successfully initialized canvas and context');
                    } else {
                        console.warn('image-preview-canvas element not found');
                    }
                }

                // 填充图片选择下拉列表
                //console.log('Calling populateImageDropdown from switchTab');
                populateImageDropdown();

                // 如果已有选中的图片，立即渲染预览
                console.log('Checking if currentImage and imagePreviewCanvas are available for render');
                console.log({ hasCurrentImage: !!currentImage, hasCanvas: !!imagePreviewCanvas });
                if (currentImage && imagePreviewCanvas) {
                    console.log('Calling renderImagePreview from switchTab');
                    renderImagePreview();
                } else {
                    console.log('Skipping renderImagePreview: missing required elements');
                }
            } else if (tabName === 'image') {
                updateExpressionCheckboxState();
                // const cropBtn = document.getElementById('crop-module');
                // if (cropBtn) {
                //     cropBtn.classList.remove('active');
                // }
                // const editBtn = document.getElementById('edit-module');
                // if (editBtn) {
                //     editBtn.classList.remove('active');
                // }

                // 如果没有选中的图片，但是currentSprite有图片列表，则默认选中第一个图片
                if (!currentImage && currentSprite && currentSprite.m_imageList.length > 0) {
                    const firstImageItem = currentSprite.m_imageList[0];
                    currentImage = firstImageItem.image;
                    currentImageId = firstImageItem.id;
                    
                    // 调整画布大小以适应图片
                    imageCanvas.width = currentImage.width;
                    imageCanvas.height = currentImage.height;
                    
                    // 重置缩放
                    zoomLevel = 1;
                    updateZoomLevel();
                }
                
                renderModulesList();
                drawCurrentImage();
                renderImagesList();
                
                // 显示图片模块编辑控制面板，隐藏动作编辑控制面板
                document.getElementById('control-panel').style.display = 'none';
                document.getElementById('image-control-section').style.display = 'flex';
            }
        }
        
        // 填充图片选择下拉列表
        function populateImageDropdown() {
            console.log('populateImageDropdown called');
            const imageDropdown = document.getElementById('image-dropdown');
            if (!imageDropdown) {
                console.warn('Cannot populate dropdown: image-dropdown element not found');
                return;
            }
            
            // 清空现有选项
            imageDropdown.innerHTML = '<option value="">请选择图片</option>';
            
            // 如果没有当前角色或图片列表为空，直接返回
            if (!currentSprite) {
                console.warn('Cannot populate dropdown: currentSprite is null');
                return;
            }
            
            if (currentSprite.m_imageList.length === 0) {
                console.log('No images available in currentSprite');
                return;
            }
            
            console.log('Adding', currentSprite.m_imageList.length, 'images to dropdown');
            // 添加图片选项
            currentSprite.m_imageList.forEach(imageItem => {
                const option = document.createElement('option');
                option.value = imageItem.id;
                option.textContent = imageItem.name;
                imageDropdown.appendChild(option);
            });
            
            // 如果有当前选中的图片，设置为默认选中并立即渲染预览
            if (currentImageId) {
                console.log('Setting default selected image:', currentImageId);
                imageDropdown.value = currentImageId;
                
                // 确保currentImage已设置
                if (!currentImage) {
                    console.log('currentImage not set, trying to get from sprite');
                    const imageItem = currentSprite.getImage(parseInt(currentImageId));
                    if (imageItem) {
                        console.log('Found image item:', imageItem.name);
                        currentImage = imageItem.image;
                        previewImage = imageItem.image; // 设置专门用于canvas渲染的图片
                        console.log('Set currentImage and previewImage:', currentImage ? currentImage.src : 'null');
                    } else {
                        console.warn('Image item not found for id:', currentImageId);
                    }
                }
                
                // 确保imagePreviewCanvas和imagePreviewCtx已初始化
                if (!imagePreviewCanvas) {
                    console.log('Initializing imagePreviewCanvas');
                    imagePreviewCanvas = document.getElementById('image-preview-canvas');
                    if (imagePreviewCanvas) {
                        imagePreviewCtx = imagePreviewCanvas.getContext('2d');
                        console.log('Successfully initialized canvas and context');
                    } else {
                        console.warn('image-preview-canvas element not found');
                    }
                }
                
                // 立即渲染图片预览
                console.log('About to call renderImagePreview from populateImageDropdown');
                renderImagePreview();
            }
        }
        
        // 渲染图片模块编辑中的图片列表
        function renderImagesList() {
            const imagesListContainer = document.getElementById('images-list');
            imagesListContainer.innerHTML = '';
            
            if (!currentSprite || currentSprite.m_imageList.length === 0) {
                imagesListContainer.innerHTML = '<div class="empty-message">暂无加载的图片</div>';
                return;
            }
            
            currentSprite.m_imageList.forEach(imageItem => {
                const imageNameEl = document.createElement('div');
                imageNameEl.className = 'image-name-item' + (currentImageId === imageItem.id ? ' selected' : '');
                // imageNameEl.textContent = imageItem.name;
                imageNameEl.style.cssText = `
                    padding: 5px 10px;
                    margin: 2px 0;
                    cursor: pointer;
                    background-color: ${currentImageId === imageItem.id ? '#e0e0e0' : '#f0f0f0'};
                    border-radius: 3px;
                `;
                
                // 创建图片名称和操作按钮容器
                const imageNameContainer = document.createElement('div');
                imageNameContainer.style.display = 'flex';
                imageNameContainer.style.alignItems = 'center';
                imageNameContainer.style.justifyContent = 'space-between';
                imageNameEl.appendChild(imageNameContainer);
                
                // 图片名称文本节点
                const nameText = document.createTextNode(imageItem.name);
                imageNameContainer.appendChild(nameText);
                
                // 创建操作按钮容器
                const actionButtons = document.createElement('div');
                actionButtons.style.display = 'flex';
                actionButtons.style.gap = '3px';
                imageNameContainer.appendChild(actionButtons);
                
                // 删除按钮
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '删除';
                deleteButton.style.padding = '2px 5px';
                deleteButton.style.fontSize = '10px';
                deleteButton.style.backgroundColor = '#ff6b6b';
                deleteButton.style.color = 'white';
                deleteButton.style.border = 'none';
                deleteButton.style.borderRadius = '2px';
                deleteButton.style.cursor = 'pointer';
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    deleteImage(imageItem);
                });
                actionButtons.appendChild(deleteButton);
                
                // 替换按钮
                const replaceButton = document.createElement('button');
                replaceButton.textContent = '替换';
                replaceButton.style.padding = '2px 5px';
                replaceButton.style.fontSize = '10px';
                replaceButton.style.backgroundColor = '#4ecdc4';
                replaceButton.style.color = 'white';
                replaceButton.style.border = 'none';
                replaceButton.style.borderRadius = '2px';
                replaceButton.style.cursor = 'pointer';
                replaceButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    replaceImage(imageItem);
                });
                actionButtons.appendChild(replaceButton);
                
                imageNameEl.addEventListener('click', () => {
                    // 加载选中的图片作为当前编辑图片
                    currentImage = imageItem.image;
                    currentImageId = imageItem.id;
                    
                    // 调整画布大小以适应图片
                    imageCanvas.width = currentImage.width;
                    imageCanvas.height = currentImage.height;
                    
                    // 重置缩放
                    zoomLevel = 1;
                    updateZoomLevel();
                    
                    // 绘制图片
                    drawCurrentImage();
                    
                    // 重新渲染模块列表
                    renderModulesList();
                    
                    // 重新渲染图片列表以更新选中状态
                    renderImagesList();
                });
                
                imagesListContainer.appendChild(imageNameEl);
            });
        }
        
        // 渲染动作编辑中的图片列表----已放弃不使用
        function renderAnimationImagesList() {
            // const imagesListContainer = document.getElementById('animation-images-list');
            // imagesListContainer.innerHTML = '';
            
            // if (!currentSprite || currentSprite.m_imageList.length === 0) {
            //     imagesListContainer.innerHTML = '<div class="empty-message">暂无可用图片</div>';
            //     return;
            // }
            
            // currentSprite.m_imageList.forEach(imageItem => {
            //     const imageNameEl = document.createElement('div');
            //     imageNameEl.className = 'image-name-item';
            //     imageNameEl.textContent = imageItem.name;
            //     imageNameEl.style.cssText = `
            //         padding: 5px 10px;
            //         margin: 2px 0;
            //         cursor: pointer;
            //         background-color: #f0f0f0;
            //         border-radius: 3px;
            //     `;
                
            //     imageNameEl.addEventListener('click', () => {
            //         // 显示选中图片的所有模块
            //         renderAnimationModulesList(imageItem);
            //     });
                
            //     imagesListContainer.appendChild(imageNameEl);
            // });
        }
        
        // 渲染动作编辑中选中图片的模块列表
        function renderAnimationModulesList(imageItem) {
            const modulesListContainer = document.getElementById('animation-modules-list');
            modulesListContainer.innerHTML = '';
            
            document.getElementById('selected-image-title').textContent = `${imageItem.name} 的模块`;
            
            if (!imageItem.modulesList || imageItem.modulesList.length === 0) {
                modulesListContainer.innerHTML = '<div class="empty-message">该图片暂无模块</div>';
                return;
            }
            
            imageItem.modulesList.forEach((module, index) => {
                const moduleItem = document.createElement('div');
                moduleItem.className = 'animation-module-item';
                moduleItem.style.cssText = `
                    display: inline-block;
                    width: 80px;
                    height: 80px;
                    margin: 5px;
                    padding: 5px;
                    border: 1px solid #ddd;
                    cursor: pointer;
                    text-align: center;
                    position: relative;
                `;
                
                // 创建一个小画布来显示模块预览
                const previewCanvas = document.createElement('canvas');
                // previewCanvas.width = 70;
                // previewCanvas.height = 70;
                const previewCtx = previewCanvas.getContext('2d');
                
                // 计算缩放比例
                const scale = Math.min(70 / module.width, 70 / module.height);
                const scaledWidth = module.width * scale;
                const scaledHeight = module.height * scale;
                
                // 绘制预览
                previewCtx.drawImage(
                    imageItem.image,
                    module.x, module.y,
                    module.width, module.height,
                    (70 - scaledWidth) / 2, (70 - scaledHeight) / 2,
                    scaledWidth, scaledHeight
                );
                
                moduleItem.appendChild(previewCanvas);
                
                // 添加模块索引
                const indexText = document.createElement('div');
                indexText.style.position = 'absolute';
                indexText.style.bottom = '2px';
                indexText.style.right = '2px';
                indexText.style.fontSize = '12px';
                indexText.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                indexText.style.padding = '1px 3px';
                indexText.style.borderRadius = '2px';
                indexText.textContent = `${index + 1}`;
                
                moduleItem.appendChild(indexText);
                
                // 添加点击事件
                moduleItem.addEventListener('click', () => {
                    if (!currentFrame) {
                        alert('请先选择一个帧');
                        return;
                    }
                    
                    // 创建模块并添加到当前帧
                    const moduleObj = new Module(imageItem.id, index);
                    const frameModule = new FrameModule(moduleObj, 0, 0, 0);
                    
                    CommandManager.instance.addCommand(new AddFmCommand(currentFrame, frameModule));
                    
                    // 更新界面
                    renderCanvas(2);
                });
                
                modulesListContainer.appendChild(moduleItem);
            });
        }
        
        // 显示编辑角色模态框
        function showNewSpriteModal() {
            const spriteNameInput = document.getElementById('sprite-name');
            
            // 如果已有当前角色，将其名称填入输入框
            if (currentSprite) {
                spriteNameInput.value = currentSprite.name;
            } else {
                spriteNameInput.value = '';
            }
            
            document.getElementById('new-sprite-modal').style.display = 'flex';
            spriteNameInput.focus();
        }
        
        // 隐藏新建角色模态框
        function hideNewSpriteModal() {
            document.getElementById('new-sprite-modal').style.display = 'none';
            document.getElementById('sprite-name').value = '';
        }
        
        // 重命名动画
        function renameAnimation() {
            if (!currentAnim) return;
            
            const newName = prompt('请输入新的动画名称:', currentAnim.name);
            if (newName && newName.trim()) {
                currentAnim.name = newName.trim();
                renderAnimList();
                document.getElementById('current-anim-name').textContent = `${currentAnim.name} - 帧${currentFrameIndex + 1}`;
                saveProject();
            }
        }
        
        // 复制动画
        function copyAnimation() {
            if (!currentAnim || !currentSprite) return;
            
            // 创建一个新的动画名称
            let newName = `${currentAnim.name}-复制`;
            let counter = 1;
            
            // 检查是否存在同名动画，如果存在则添加数字后缀
            while (currentSprite.mAnimList.some(anim => anim.name === newName)) {
                counter++;
                newName = `${currentAnim.name}-复制${counter}`;
            }
            
            // 创建新的动画对象
            const newAnim = new Anim(newName);
            
            // 深拷贝每一帧
            currentAnim.aframeList.forEach(animFrame => {
                // 克隆帧对象
                const clonedFrame = animFrame.frame.clone();
                // 创建新的动画帧
                const newAnimFrame = new AnimFrame(clonedFrame, animFrame.KeyFrameState);
                newAnim.aframeList.push(newAnimFrame);
            });
            
            // 添加到当前角色的动画列表
            currentSprite.mAnimList.push(newAnim);
            
            // 更新界面
            renderAnimList();
            saveProject();
        }
        
        // 上移动画
        function moveAnimationUp() {
            if (!currentSprite || !currentAnim) return;
            
            const currentIndex = currentSprite.mAnimList.indexOf(currentAnim);
            if (currentIndex > 0) {
                // 交换位置
                [currentSprite.mAnimList[currentIndex - 1], currentSprite.mAnimList[currentIndex]] = 
                [currentSprite.mAnimList[currentIndex], currentSprite.mAnimList[currentIndex - 1]];
                
                renderAnimList();
                saveProject();
            }
        }
        
        // 下移动画
        function moveAnimationDown() {
            if (!currentSprite || !currentAnim) return;
            
            const currentIndex = currentSprite.mAnimList.indexOf(currentAnim);
            if (currentIndex < currentSprite.mAnimList.length - 1) {
                // 交换位置
                [currentSprite.mAnimList[currentIndex], currentSprite.mAnimList[currentIndex + 1]] = 
                [currentSprite.mAnimList[currentIndex + 1], currentSprite.mAnimList[currentIndex]];
                
                renderAnimList();
                saveProject();
            }
        }
        
        // 置顶动画
        function moveAnimationToTop() {
            if (!currentSprite || !currentAnim) return;
            
            const currentIndex = currentSprite.mAnimList.indexOf(currentAnim);
            if (currentIndex > 0) {
                // 移除当前动画
                currentSprite.mAnimList.splice(currentIndex, 1);
                // 添加到数组开头
                currentSprite.mAnimList.unshift(currentAnim);
                
                renderAnimList();
                saveProject();
            }
        }
        
        // 置底动画
        function moveAnimationToBottom() {
            if (!currentSprite || !currentAnim) return;
            
            const currentIndex = currentSprite.mAnimList.indexOf(currentAnim);
            if (currentIndex < currentSprite.mAnimList.length - 1) {
                // 移除当前动画
                currentSprite.mAnimList.splice(currentIndex, 1);
                // 添加到数组末尾
                currentSprite.mAnimList.push(currentAnim);
                
                renderAnimList();
                saveProject();
            }
        }
        
        // 删除动画
        function deleteAnimation() {
            if (!currentAnim || !currentSprite) return;
            
            // 显示确认对话框，提示删除后无法恢复
            if (!confirm(`确定要删除动画 "${currentAnim.name}" 吗？此操作无法恢复！`)) {
                return;
            }
            
            const animIndex = currentSprite.mAnimList.indexOf(currentAnim);
            
            // 从角色的动画列表中删除动画
            currentSprite.mAnimList.splice(animIndex, 1);
            
            // 如果还有其他动画，选择第一个动画
            if (currentSprite.mAnimList.length > 0) {
                selectAnim(0);
            } else {
                // 如果没有其他动画，重置相关变量
                currentAnim = null;
                currentFrame = null;
                currentFrameIndex = -1;
                
                // 更新界面
                renderCanvas(20);
                document.getElementById('current-anim-name').textContent = '无动画';
            }
            
            // 更新动画列表
            renderAnimList();
            
            // 保存项目
            saveProject();
        }
        
        // 更新当前角色
        function createSprite() {
            const spriteName = document.getElementById('sprite-name').value.trim();
            if (!spriteName) {
                alert('请输入角色名称');
                return;
            }
            
            // 如果已有当前角色，更新其名称
            if (currentSprite) {
                currentSprite.name = spriteName;
            } else {
                // 如果没有当前角色，创建一个新角色（仅在必要时）
                currentSprite = new Sprite(spriteName);
                currentProject.addSprite(currentSprite);
            }
            
            // 更新界面
            renderSpriteList();
            hideNewSpriteModal();
        }
        
        // 显示新建动作模态框
        function showNewAnimModal() {
            if (!currentSprite) {
                alert('请先选择一个角色');
                return;
            }
            
            document.getElementById('new-anim-modal').style.display = 'flex';
            document.getElementById('anim-name').focus();
        }
        
        // 隐藏新建动作模态框
        function hideNewAnimModal() {
            document.getElementById('new-anim-modal').style.display = 'none';
            document.getElementById('anim-name').value = '';
        }
        
        // 创建动作
        function createAnim() {
            if (!currentSprite) return;
            
            const animName = document.getElementById('anim-name').value.trim();
            if (!animName) {
                alert('请输入动作名称');
                return;
            }
            
            const newAnim = new Anim(animName);
            currentSprite.mAnimList.push(newAnim);
            
            // 添加默认帧
            const defaultFrame = new Frame();
            const defaultAnimFrame = new AnimFrame(defaultFrame, true);
            newAnim.aframeList.push(defaultAnimFrame);
            
            // 更新界面
            renderAnimList();
            hideNewAnimModal();
        }
        
        // 显示上传图片模态框
        function showUploadImageModal() {
            document.getElementById('upload-image-modal').style.display = 'flex';
        }
        
        // 隐藏上传图片模态框
        function hideUploadImageModal() {
            document.getElementById('upload-image-modal').style.display = 'none';
            document.getElementById('modal-image-upload').value = '';
        }
        
        // 切换裁剪模式
        function toggleCropping() {
            if (!currentImage) {
                alert('请先选择或上传一张图片');
                return;
            }
            
            // 设置为裁剪模式
            editMode = 'crop';
            isCropping = true;
            
            // 更新按钮状态
            document.getElementById('crop-module').classList.add('active');
            document.getElementById('edit-module').classList.remove('active');
            
            // 重置编辑模块状态
            selectedImageModule = -1;
            
            // 重新绘制画布
            drawCurrentImage();
        }
        
        // 切换编辑模块模式
        function toggleEditModule() {
            if (!currentImage || (!currentSprite || !currentSprite.getImage(currentImageId) || currentSprite.getImage(currentImageId).modulesList.length === 0)) {
                alert('请先上传图片并创建至少一个模块');
                return;
            }
            
            // 设置为编辑模式
            editMode = 'edit';
            isCropping = false;
            
            // 更新按钮状态
            document.getElementById('crop-module').classList.remove('active');
            document.getElementById('edit-module').classList.add('active');
            
            // 重置裁剪参数
            cropLeft = 0;
            cropTop = 0;
            cropWidth = 0;
            cropHeight = 0;
            isImageModuleRangeMoving = false;
            resizeMode = null;
            
            // 隐藏模块信息提示
            if (moduleInfo) {
                moduleInfo.style.display = 'none';
            }
            
            // 重新绘制画布
            drawCurrentImage();
        }
        

        // 显示图片模块编辑区鼠标位置
        function showImageMousePosition(e) {
            //
            const rect = imageCanvas.getBoundingClientRect();
            const canvasScale = (imageCanvas.width/rect.width);
            const x = (e.clientX - rect.left)*canvasScale;
            const y = (e.clientY - rect.top)*canvasScale;
          

            // 计算相对于原始图片的坐标（考虑缩放）
            let imageX = 0;
            let imageY = 0;
            let imageOriX = 0;
            let imageOriY = 0;
            console.log('canvasScale:',canvasScale,'真像素imageCanvas.width:', imageCanvas.width, '区域rect.width:', rect.width, 'currentImage.width',currentImage.width,'zoomLevel:', zoomLevel);
            if(currentImage){
                
                // 计算图片在画布上的绘制位置
                imageOriX = Math.round((imageCanvas.width - currentImage.width * zoomLevel) / 2 );
                imageOriY = Math.round((imageCanvas.height - currentImage.height * zoomLevel) / 2 );
                console.debug('imageOriX:', imageOriX, 'imageOriY:', imageOriY);
                imageX = Math.round((x - imageOriX) / zoomLevel);
                imageY = Math.round((y - imageOriY) / zoomLevel);
            }
            
            // 更新鼠标位置显示
            document.getElementById('image-mouse-position').textContent = 
                `鼠标位置: 画布(${Math.round(x)}, ${Math.round(y)}) 原图左上角(${imageOriX}, ${imageOriY}) 原图(${imageX}, ${imageY}) 全局(${e.clientX}, ${e.clientY}))`;
        }

        function getImageEditXY(e){
            const rect = imageCanvas.getBoundingClientRect();
            const canvasScale = (imageCanvas.width/rect.width);
            const clickX = (e.clientX - rect.left)*canvasScale;
            const clickY = (e.clientY - rect.top)*canvasScale;

            if(!currentImage) return {clickX, clickY, imageOriX:0, imageOriY:0, imageX:0, imageY:0};
            // 计算图片在画布上的绘制位置
            const imageOriX = Math.round((imageCanvas.width - currentImage.width * zoomLevel) / 2 );
            const imageOriY = Math.round((imageCanvas.height - currentImage.height * zoomLevel) / 2 );
            imageX = Math.round((clickX - imageOriX) / zoomLevel);
            imageY = Math.round((clickY - imageOriY) / zoomLevel);
            return {clickX, clickY, imageOriX, imageOriY, imageX, imageY};
        }

        // 处理图片画布鼠标按下事件
        function handleImageMouseDown(e) {
            if (!currentImage) return;
            const {clickX, clickY, imageOriX, imageOriY, imageX, imageY} = getImageEditXY(e);
            // const rect = imageCanvas.getBoundingClientRect();
            // const canvasScale = (imageCanvas.width/rect.width);
            // // 计算相对于Canvas的实际坐标（考虑Canvas缩放）
            // const clickX = (e.clientX - rect.left) * canvasScale;
            // const clickY = (e.clientY - rect.top) * canvasScale;

            
            // 计算图片在画布上的绘制位置
            // const imageOriX = (imageCanvas.width - currentImage.width * zoomLevel) / 2;
            // const imageOriY = (imageCanvas.height - currentImage.height * zoomLevel) / 2;
            console.log('drawX:',imageOriX, imageOriY);


            // // 计算相对于图片的坐标（考虑缩放）
            // const imageX = (clickX - drawX) / zoomLevel;
            // const imageY = (clickY - drawY) / zoomLevel;
            

            
            // 根据当前模式执行不同的处理
            if (editMode === 'crop') {
                if (!isCropping) return;
                
                // 检查是否点击在虚拟裁剪框上
                const canvasLeft = imageOriX + cropLeft * zoomLevel;
                const canvasTop = imageOriY + cropTop * zoomLevel;
                const canvasWidth = cropWidth * zoomLevel;
                const canvasHeight = cropHeight * zoomLevel;
                
                // 判断点击位置，确定调整模式
                const borderWidth = 6; // 边缘检测宽度，扩大以便于操作
                if (cropWidth > 0 && cropHeight > 0 &&
                    clickX >= canvasLeft - borderWidth/2 && clickX <= canvasLeft + canvasWidth + borderWidth/2 &&
                    clickY >= canvasTop - borderWidth/2 && clickY <= canvasTop + canvasHeight + borderWidth/2) {
                    
                    isImageModuleRangeMoving = false;
                    
                    // 记录初始状态
                    initialLeft = cropLeft;
                    initialTop = cropTop;
                    initialWidth = cropWidth;
                    initialHeight = cropHeight;
                    dragStartX = clickX;
                    dragStartY = clickY;
                    
                    // 判断点击的是哪个边缘或角落
                    if (clickX <= canvasLeft + borderWidth) {
                        // 左边
                        if (clickY <= canvasTop + borderWidth) {
                            resizeMode = 'top-left';
                        } else if (clickY >= canvasTop + canvasHeight - borderWidth) {
                            resizeMode = 'bottom-left';
                        } else {
                            resizeMode = 'left';
                        }
                    } else if (clickX >= canvasLeft + canvasWidth - borderWidth) {
                        // 右边
                        if (clickY <= canvasTop + borderWidth) {
                            resizeMode = 'top-right';
                        } else if (clickY >= canvasTop + canvasHeight - borderWidth) {
                            resizeMode = 'bottom-right';
                        } else {
                            resizeMode = 'right';
                        }
                    } else if (clickY <= canvasTop + borderWidth) {
                        // 上边
                        resizeMode = 'top';
                    } else if (clickY >= canvasTop + canvasHeight - borderWidth) {
                        // 底边
                        resizeMode = 'bottom';
                    } else {
                        // 点击在主体上，移动模式
                        resizeMode = 'move';
                    }
                } else {
                    // 开始新的裁剪
                    isImageModuleRangeMoving = true;
                    resizeMode = null;
                    
                    // 计算实际的点击位置（考虑缩放）
                    cropStartX = imageX;
                    cropStartY = imageY;
                    
                    // 重置裁剪参数
                    cropLeft = cropStartX;
                    cropTop = cropStartY;
                    cropWidth = 0;
                    cropHeight = 0;
                    
                    // 重新绘制画布以显示空的裁剪框
                    drawCurrentImage();
                }
            } else if (editMode === 'edit') {
                // 编辑模式：选择和编辑现有模块
                const imageItem = currentSprite.getImage(currentImageId);
                if (!imageItem || !imageItem.modulesList) return;
                
                // 查找点击到的模块
                let clickedModuleIndex = -1;
                for (let i = 0; i < imageItem.modulesList.length; i++) {
                    const module = imageItem.modulesList[i];
                    const moduleLeft = module.x;
                    const moduleTop = module.y;
                    const moduleRight = module.x + module.width;
                    const moduleBottom = module.y + module.height;
                    
                    if (imageX >= moduleLeft && imageX <= moduleRight && imageY >= moduleTop && imageY <= moduleBottom) {
                        clickedModuleIndex = i;
                        break;
                    }
                }
                
                if (clickedModuleIndex !== -1) {
                    // 选中模块
                    selectedImageModule = clickedModuleIndex;
                    
                    // 获取选中模块的信息
                    const module = imageItem.modulesList[selectedImageModule];
                    
                    // 记录初始状态，用于拖动和调整大小
                    initialLeft = module.x;
                    initialTop = module.y;
                    initialWidth = module.width;
                    initialHeight = module.height;
                    dragStartX = clickX;
                    dragStartY = clickY;
                    
                    // 判断点击的是模块的哪个部分
                    const moduleLeft = imageOriX + module.x * zoomLevel;
                    const moduleTop = imageOriY + module.y * zoomLevel;
                    const moduleRight = moduleLeft + module.width * zoomLevel;
                    const moduleBottom = moduleTop + module.height * zoomLevel;
                    const borderWidth = 15; // 边缘检测宽度，扩大以便于操作
                    
                    if (clickX <= moduleLeft + borderWidth) {
                        // 左边
                        if (clickY <= moduleTop + borderWidth) {
                            resizeMode = 'top-left';
                        } else if (clickY >= moduleBottom - borderWidth) {
                            resizeMode = 'bottom-left';
                        } else {
                            resizeMode = 'left';
                        }
                    } else if (clickX >= moduleRight - borderWidth) {
                        // 右边
                        if (clickY <= moduleTop + borderWidth) {
                            resizeMode = 'top-right';
                        } else if (clickY >= moduleBottom - borderWidth) {
                            resizeMode = 'bottom-right';
                        } else {
                            resizeMode = 'right';
                        }
                    } else if (clickY <= moduleTop + borderWidth) {
                        // 上边
                        resizeMode = 'top';
                    } else if (clickY >= moduleBottom - borderWidth) {
                        // 底边
                        resizeMode = 'bottom';
                    } else {
                        // 点击在主体上，移动模式
                        resizeMode = 'move';
                    }
                } else {
                    // 没有点击到任何模块，取消选中
                    selectedImageModule = -1;
                    resizeMode = null;
                    
                    // 重新绘制画布
                    drawCurrentImage();
                }
            }
        }

        
        // 处理图片画布鼠标移动事件
        function handleImageMouseMove(e) {
            if (!currentImage) return;
            
            const rect = imageCanvas.getBoundingClientRect();
            const canvasScale = (imageCanvas.width/rect.width);
            
            // 计算相对于Canvas的实际坐标（考虑Canvas缩放）
            const clickX = (e.clientX - rect.left) * canvasScale;
            const clickY = (e.clientY - rect.top) * canvasScale;
            
            // 处理调整/移动模式
            if (resizeMode) {
                let newLeft = initialLeft;
                let newTop = initialTop;
                let newWidth = initialWidth;
                let newHeight = initialHeight;
                
                // 根据不同的调整模式计算新的位置和大小
                switch(resizeMode) {
                    case 'move':
                        // 计算相对于画布的移动距离，然后转换为图片坐标
                        const moveDeltaX = (clickX - dragStartX) / zoomLevel;
                        const moveDeltaY = (clickY - dragStartY) / zoomLevel;
                        newLeft = initialLeft + moveDeltaX;
                        newTop = initialTop + moveDeltaY;
                        break;
                    case 'left':
                        // 从左边调整，计算新的left和width
                        newLeft = initialLeft + (clickX - dragStartX) / zoomLevel;
                        newWidth = initialWidth - (clickX - dragStartX) / zoomLevel;
                        break;
                    case 'right':
                        // 从右边调整，计算新的width
                        newWidth = initialWidth + (clickX - dragStartX) / zoomLevel;
                        break;
                    case 'top':
                        // 从上边调整，计算新的top和height
                        newTop = initialTop + (clickY - dragStartY) / zoomLevel;
                        newHeight = initialHeight - (clickY - dragStartY) / zoomLevel;
                        break;
                    case 'bottom':
                        // 从下边调整，计算新的height
                        newHeight = initialHeight + (clickY - dragStartY) / zoomLevel;
                        break;
                    case 'top-left':
                        // 从左上角调整
                        newLeft = initialLeft + (clickX - dragStartX) / zoomLevel;
                        newTop = initialTop + (clickY - dragStartY) / zoomLevel;
                        newWidth = initialWidth - (clickX - dragStartX) / zoomLevel;
                        newHeight = initialHeight - (clickY - dragStartY) / zoomLevel;
                        break;
                    case 'top-right':
                        // 从右上角调整
                        newTop = initialTop + (clickY - dragStartY) / zoomLevel;
                        newWidth = initialWidth + (clickX - dragStartX) / zoomLevel;
                        newHeight = initialHeight - (clickY - dragStartY) / zoomLevel;
                        break;
                    case 'bottom-left':
                        // 从左下角调整
                        newLeft = initialLeft + (clickX - dragStartX) / zoomLevel;
                        newWidth = initialWidth - (clickX - dragStartX) / zoomLevel;
                        newHeight = initialHeight + (clickY - dragStartY) / zoomLevel;
                        break;
                    case 'bottom-right':
                        // 从右下角调整
                        newWidth = initialWidth + (clickX - dragStartX) / zoomLevel;
                        newHeight = initialHeight + (clickY - dragStartY) / zoomLevel;
                        break;
                }
                
                // 确保尺寸不为负且有最小尺寸
                if (newWidth < 5) newWidth = 5;
                if (newHeight < 5) newHeight = 5;
                
                // 限制在图片范围内
                const maxX = currentImage.width - newWidth;
                const maxY = currentImage.height - newHeight;
                newLeft = Math.max(0, Math.min(newLeft, maxX));
                newTop = Math.max(0, Math.min(newTop, maxY));
                
                // 根据当前模式更新相应的参数
                if (editMode === 'crop' && isCropping) {
                    // 裁剪模式
                    cropLeft = newLeft;
                    cropTop = newTop;
                    cropWidth = newWidth;
                    cropHeight = newHeight;
                } else if (editMode === 'edit' && selectedImageModule !== -1) {
                    // 编辑模式
                    const imageItem = currentSprite.getImage(currentImageId);
                    if (imageItem && imageItem.modulesList && imageItem.modulesList[selectedImageModule]) {
                        imageItem.modulesList[selectedImageModule].x = newLeft;
                        imageItem.modulesList[selectedImageModule].y = newTop;
                        imageItem.modulesList[selectedImageModule].width = newWidth;
                        imageItem.modulesList[selectedImageModule].height = newHeight;
                    }
                }
                
                // 重新绘制画布以显示更新后的裁剪框或模块
                drawCurrentImage();
            }
            // 处理新建裁剪（仅在裁剪模式下）
            else if (editMode === 'crop' && isCropping && isImageModuleRangeMoving) {
                // 计算图片在画布上的绘制位置
                const imageOriX = (imageCanvas.width - currentImage.width * zoomLevel) / 2;
                const imageOriY = (imageCanvas.height - currentImage.height * zoomLevel) / 2;
                
                // 计算当前鼠标位置时考虑canvas的缩放比例
                const currentX = (clickX - imageOriX) / zoomLevel;
                const currentY = (clickY - imageOriY) / zoomLevel;
                
                // 计算裁剪框的位置和大小
                const x = Math.min(cropStartX, currentX);
                const y = Math.min(cropStartY, currentY);
                const width = Math.abs(currentX - cropStartX);
                const height = Math.abs(currentY - cropStartY);
                
                // 限制在图片范围内
                const constrainedX = Math.max(0, x);
                const constrainedY = Math.max(0, y);
                const constrainedWidth = Math.min(width, currentImage.width - constrainedX);
                const constrainedHeight = Math.min(height, currentImage.height - constrainedY);
                
                // 更新虚拟裁剪框参数
                cropLeft = constrainedX;
                cropTop = constrainedY;
                cropWidth = constrainedWidth;
                cropHeight = constrainedHeight;
                
                // 重新绘制画布以显示更新后的裁剪框
                drawCurrentImage();
            }
            // 编辑模式：鼠标悬停时改变光标样式
            else if (editMode === 'edit') {
                const drawX = (imageCanvas.width - currentImage.width * zoomLevel) / 2;
                const drawY = (imageCanvas.height - currentImage.height * zoomLevel) / 2;
                
                const imageItem = currentSprite.getImage(currentImageId);
                if (!imageItem || !imageItem.modulesList) {
                    imageCanvas.style.cursor = 'default';
                    return;
                }
                
                const imageX = (e.clientX - rect.left - drawX) / zoomLevel;
                const imageY = (e.clientY - rect.top - drawY) / zoomLevel;
                
                // 检查鼠标是否悬停在某个模块上
                for (let i = 0; i < imageItem.modulesList.length; i++) {
                    const module = imageItem.modulesList[i];
                    const moduleLeft = drawX + module.x * zoomLevel;
                    const moduleTop = drawY + module.y * zoomLevel;
                    const moduleRight = moduleLeft + module.width * zoomLevel;
                    const moduleBottom = moduleTop + module.height * zoomLevel;
                    const borderWidth = 15; // 边缘检测宽度，扩大以便于操作
                    
                    if (clickX >= moduleLeft - borderWidth/2 && clickX <= moduleRight + borderWidth/2 &&
                        clickY >= moduleTop - borderWidth/2 && clickY <= moduleBottom + borderWidth/2) {
                        // 检查悬停在模块的哪个部分
                        if (clickX <= moduleLeft + borderWidth) {
                            // 左边
                            if (clickY <= moduleTop + borderWidth) {
                                imageCanvas.style.cursor = 'nwse-resize'; // 左上
                            } else if (clickY >= moduleBottom - borderWidth) {
                                imageCanvas.style.cursor = 'nesw-resize'; // 左下
                            } else {
                                imageCanvas.style.cursor = 'ew-resize'; // 左
                            }
                        } else if (clickX >= moduleRight - borderWidth) {
                            // 右边
                            if (clickY <= moduleTop + borderWidth) {
                                imageCanvas.style.cursor = 'nesw-resize'; // 右上
                            } else if (clickY >= moduleBottom - borderWidth) {
                                imageCanvas.style.cursor = 'nwse-resize'; // 右下
                            } else {
                                imageCanvas.style.cursor = 'ew-resize'; // 右
                            }
                        } else if (clickY <= moduleTop + borderWidth) {
                            // 上边
                            imageCanvas.style.cursor = 'ns-resize'; // 上
                        } else if (clickY >= moduleBottom - borderWidth) {
                            // 底边
                            imageCanvas.style.cursor = 'ns-resize'; // 下
                        } else {
                            // 悬停在模块主体上
                            imageCanvas.style.cursor = 'move'; // 移动
                        }
                        return;
                    }
                }
                
                // 没有悬停在任何模块上，恢复默认光标
                imageCanvas.style.cursor = 'default';
            }
        }

        
        // 处理图片画布鼠标释放事件
        function handleImageMouseUp() {
            if (!currentImage) return;

            isImageModuleRangeMoving = false;
            resizeMode = null;
            
            // 根据当前模式执行不同的处理
            if (editMode === 'crop' && isCropping) {
                // 当鼠标释放时，检查裁剪框是否有有效尺寸
                const scaledWidth = cropWidth * zoomLevel;
                const scaledHeight = cropHeight * zoomLevel;
                
                if (scaledWidth > 10 && scaledHeight > 10) {
                    // 显示提示信息，告知用户可以点击"保存模块"按钮确认
                    const moduleInfo = document.getElementById('module-info');
                    if (moduleInfo) {
                        moduleInfo.textContent = `已选择区域: ${Math.round(scaledWidth)}x${Math.round(scaledHeight)} - 双击区域确认`;
                        moduleInfo.style.display = 'block';
                    }
                    // 不自动保存模块，让用户点击按钮确认
                } else if (scaledWidth > 0 && scaledHeight > 0) {
                    // 如果尺寸太小，重置虚拟裁剪框参数
                    cropLeft = 0;
                    cropTop = 0;
                    cropWidth = 0;
                    cropHeight = 0;
                    
                    // 重新绘制画布以清除裁剪框
                    drawCurrentImage();
                    
                    const moduleInfo = document.getElementById('module-info');
                    if (moduleInfo) {
                        moduleInfo.style.display = 'none';
                    }
                }
            } else if (editMode === 'edit') {
                // 编辑模式：确保更新后的模块显示正确
                drawCurrentImage();
            }
        }

        
        function handleImageMouseDblClick(e) {
            console.log('dblclick1');
            if (!isCropping || !currentImage) return;
            // 阻止事件冒泡，避免触发其他元素的双击事件
            e.stopPropagation();
            console.log('dblclick2');

            
            const drawX = (imageCanvas.width - currentImage.width * zoomLevel) / 2;
            const drawY = (imageCanvas.height - currentImage.height * zoomLevel) / 2;
            console.log('图片在画布上的绘制位置：',drawX,drawY);
            
            const rect = imageCanvas.getBoundingClientRect();
            const canvasScale = (imageCanvas.width/rect.width);
            
            // 计算相对于图片的坐标（考虑Canvas缩放和图片缩放）
            const imageX = ((e.clientX - rect.left) * canvasScale - drawX) / zoomLevel;
            const imageY = ((e.clientY - rect.top) * canvasScale - drawY) / zoomLevel;

            console.log('imageX', imageX, 'imageY', imageY, 'cropRange:',cropLeft,cropTop,cropWidth,cropHeight);
            if (isCropping && imageX >= cropLeft && imageX <= cropLeft+cropWidth && imageY >= cropTop && imageY <= cropTop+cropHeight) {
                saveModule();
            }
        }

        // 保存模块
        function saveModule() {
            if (!currentImage || !isCropping) {
                alert('请先框选一个模块');
                return;
            }
            
            // 直接使用虚拟裁剪框参数（已在原始图片坐标系中）
            const x = cropLeft;
            const y = cropTop;
            const width = cropWidth;
            const height = cropHeight;
            
            // 检查模块大小是否有效
            if (width < 10 || height < 10) {
                alert('模块尺寸过小，请重新框选');
                return;
            }
            
            // 保存模块信息
            if (currentSprite && currentImageId) {
                const imageItem = currentSprite.getImage(currentImageId);
                if (imageItem) {
                    const moduleId = imageItem.modulesList.length;
                    imageItem.modulesList.push({ 
                        x: Math.round(x), 
                        y: Math.round(y), 
                        width: Math.round(width), 
                        height: Math.round(height) 
                    });
                    
                    // 重置虚拟裁剪框参数
                    cropLeft = 0;
                    cropTop = 0;
                    cropWidth = 0;
                    cropHeight = 0;
                    
                    // 更新按钮文本
                    // document.getElementById('crop-module').textContent = '框选模块';
                    
                    // // 隐藏模块信息提示
                    // const moduleInfo = document.getElementById('module-info');
                    // if (moduleInfo) {
                    //     moduleInfo.style.display = 'none';
                    // }
                    
                    // 重新绘制画布以清除裁剪框
                    drawCurrentImage();
                    
                    console.log('保存模块，并渲染');
                    // 更新模块列表
                    renderModulesList();
                }
            }
        }
        
        // 渲染模块列表
        function renderModulesList() {
            const modulesListEl = document.getElementById('modules-list');
            modulesListEl.innerHTML = '';
            
            if (!currentSprite || !currentImageId) return;
            
            const imageItem = currentSprite.getImage(currentImageId);
            if (!imageItem || imageItem.modulesList.length === 0) return;
            
            imageItem.modulesList.forEach((module, index) => {
                const moduleItem = document.createElement('div');
                moduleItem.className = 'module-item' + (selectedImageModule === index || selectedImageModules.includes(index) ? ' selected' : '');
                
                // 创建一个小画布来显示模块预览
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = 80;
                previewCanvas.height = 80;
                const previewCtx = previewCanvas.getContext('2d');
                
                // 计算缩放比例
                const scale = Math.min(80 / module.width, 80 / module.height);
                const scaledWidth = module.width * scale;
                const scaledHeight = module.height * scale;
                
                // 绘制预览
                previewCtx.drawImage(
                    currentImage,
                    module.x, module.y,
                    module.width, module.height,
                    (80 - scaledWidth) / 2, (80 - scaledHeight) / 2,
                    scaledWidth, scaledHeight
                );
                
                moduleItem.appendChild(previewCanvas);
                
                // 添加模块索引
                const indexText = document.createElement('div');
                indexText.style.position = 'absolute';
                indexText.style.bottom = '5px';
                indexText.style.right = '25px';
                indexText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                indexText.style.color = 'white';
                indexText.style.padding = '2px 5px';
                indexText.style.borderRadius = '3px';
                indexText.style.fontSize = '12px';
                indexText.textContent = index + 1;
                moduleItem.appendChild(indexText);
                
                // 添加删除按钮
                const deleteBtn = document.createElement('button');
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '5px';
                deleteBtn.style.right = '5px';
                deleteBtn.style.width = '16px';
                deleteBtn.style.height = '16px';
                deleteBtn.style.backgroundColor = '#ff4444';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '3px';
                deleteBtn.style.fontSize = '10px';
                deleteBtn.style.lineHeight = '14px';
                deleteBtn.style.textAlign = 'center';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.display = 'flex';
                deleteBtn.style.alignItems = 'center';
                deleteBtn.style.justifyContent = 'center';
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡，避免触发模块选择
                    if (confirm('确定要删除这个模块吗？')) {
                        // 从模块列表中删除该项
                        imageItem.modulesList.splice(index, 1);
                        // 重新渲染模块列表
                        renderModulesList();
                        drawCurrentImage();
                    }
                });
                moduleItem.appendChild(deleteBtn);
                
                // 添加点击事件
                moduleItem.addEventListener('click', (e) => {
                    // 如果按住Ctrl键，进行多选
                    if (isCtrlPressed) {
                        // 切换该模块的选中状态
                        const indexInArray = selectedImageModules.indexOf(index);
                        if (indexInArray === -1) {
                            selectedImageModules.push(index);
                        } else {
                            selectedImageModules.splice(indexInArray, 1);
                        }
                        selectedImageModule = -1; // 清除单选状态
                    } else {
                        // 单选
                        selectedImageModule = index;
                        selectedImageModules = []; // 清除多选状态
                    }
                    
                    renderModulesList();
                    drawCurrentImage();
                });
                
                modulesListEl.appendChild(moduleItem);
            });
        }
        
        // 显示添加模块模态框
        function showAddModuleModal() {
            // 如果正在编辑表情区域，不允许显示添加模块模态框
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame) {
                alert('请先选择一个帧');
                return;
            }
            
            // 如果没有可用的图片模块，提示用户去图片编辑tab
            if (!hasAvailableModules()) {
                alert('没有可用的图片模块，请先去图片编辑tab创建模块');
                switchTab('image');
                return;
            }
            
            // 如果有可用的模块，直接添加一个随机模块
            addRandomModule();
        }
        
        // 检查是否有可用的模块
        function hasAvailableModules() {
            if (!currentSprite) return false;
            
            for (const imageItem of currentSprite.m_imageList) {
                if (imageItem.modulesList.length > 0) {
                    return true;
                }
            }
            
            return false;
        }
        
        // 添加随机模块
        function addRandomModule() {
            // 如果正在编辑表情区域，不允许添加随机模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentSprite || !currentFrame) return;
            
            // 找到所有可用的模块
            const availableModules = [];
            
            currentSprite.m_imageList.forEach(imageItem => {
                imageItem.modulesList.forEach((moduleRect, moduleIndex) => {
                    availableModules.push({
                        imageId: imageItem.id,
                        moduleIndex: moduleIndex
                    });
                });
            });
            
            if (availableModules.length === 0) return;
            
            // 随机选择一个模块
            const randomModule = availableModules[Math.floor(Math.random() * availableModules.length)];
            
            // 创建FrameModule并添加到当前帧
            const module = new Module(randomModule.imageId, randomModule.moduleIndex);
            const frameModule = new FrameModule(module, 0, 0, 0);
            
            CommandManager.instance.addCommand(new AddFmCommand(currentFrame, frameModule));
            
            // 更新界面
            renderCanvas(3);
            
        }
        
        // 在当前帧后插入新帧
        function addFrame() {
            if (!currentAnim) {
                alert('请先选择一个动作');
                return;
            }
            
            // 创建新的空帧，不复制原有的fm数据
            const newFrame = new Frame();
            
            const newAnimFrame = new AnimFrame(newFrame, true);
            
            // 插入到当前帧之后
            currentAnim.aframeList.splice(currentFrameIndex + 1, 0, newAnimFrame);

            // 更新界面
            renderTimeline();
            
            // 选中新插入的帧
            selectFrame(currentFrameIndex + 1);
        }
        
        // 在动画末尾添加新帧
        function addFrameToEnd() {
            if (!currentAnim) {
                alert('请先选择一个动作');
                return;
            }
            
            // 创建新的空帧，不复制原有的fm数据
            const newFrame = new Frame();
            
            const newAnimFrame = new AnimFrame(newFrame, true);
            
            // 添加到动画的最后
            currentAnim.aframeList.push(newAnimFrame);

            // 更新界面
            renderTimeline();
            
            // 选中新添加的帧（最后一帧）
            selectFrame(currentAnim.aframeList.length - 1);
        }

        // 克隆帧
        function cloneFrame() {
            if (!currentAnim || !currentFrame) {
                alert('请先选择一个帧');
                return;
            }
            
            // 创建当前帧的克隆
            const clonedFrame = currentFrame.clone();
            
            // 获取当前帧的表情区域
            const originalAnimFrame = currentAnim.aframeList[currentFrameIndex];
            const originalExpressionRect = originalAnimFrame.expressionRect;
            
            // 创建新的动画帧对象，同时克隆表情区域
            const newAnimFrame = new AnimFrame(
                clonedFrame, 
                originalAnimFrame.KeyFrameState,
                originalExpressionRect ? { ...originalExpressionRect } : {x:0,y:0,width:50,height:60}
            );
            
            // 插入到当前帧之后
            currentAnim.aframeList.splice(currentFrameIndex + 1, 0, newAnimFrame);
            
            // 选择新克隆的帧
            selectFrame(currentFrameIndex + 1);
            
            // 显示克隆成功提示
            showNotification('帧已克隆');
            
            // 选择新创建的帧
            selectFrame(currentFrameIndex + 1);
        }
        
        // 删除帧
        function deleteFrame() {
            if (!currentAnim || currentAnim.aframeList.length <= 1) {
                alert('至少需要保留一帧');
                return;
            }
            
            // 删除当前帧
            currentAnim.aframeList.splice(currentFrameIndex, 1);
            
            // 选择上一帧或第一帧
            currentFrameIndex = Math.min(currentFrameIndex, currentAnim.aframeList.length - 1);
            currentFrame = currentAnim.aframeList[currentFrameIndex].frame;
            selectedModuleIndex = -1;
            
            // 更新界面
            renderTimeline();
            renderCanvas(4);
            
            document.getElementById('current-anim-name').textContent = `${currentAnim.name} - 帧${currentFrameIndex + 1}`;
        }
        
        // 撤销操作
        function undoAction() {
            CommandManager.instance.undo();
            renderCanvas(7); // 使用特定类型重新渲染画布以显示更新后的状态
            renderModulesList(); // 如果涉及模块列表变化，重新渲染
            renderTimeline(); // 如果涉及时间线变化，重新渲染
        }
        
        // 重做操作
        function redoAction() {
            CommandManager.instance.redo();
            renderCanvas(7); // 使用特定类型重新渲染画布以显示更新后的状态
            renderModulesList(); // 如果涉及模块列表变化，重新渲染
            renderTimeline(); // 如果涉及时间线变化，重新渲染
        }
        
        // 删除帧模块
        function deleteFrameModule() {
            // 如果正在编辑表情区域，不允许删除模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || selectedModuleIndex < 0) return;
            
            const frameModule = currentFrame.fmList[selectedModuleIndex];
            // 创建一个自定义的删除命令，记录删除前的状态
            const deleteCommand = {
                execute: function() {
                    // 已在外部执行删除操作
                },
                undo: function() {
                    // 撤销删除时，将模块添加回原位置
                    currentFrame.fmList.splice(selectedModuleIndex, 0, frameModule);
                    selectedModuleIndex = selectedModuleIndex;
                    renderCanvas(5);
                    updateModuleProperties(frameModule);
                }
            };
            
            CommandManager.instance.addCommand(deleteCommand);
            console.log('delete fm:', selectedModuleIndex);
            // 从当前帧中删除模块
            currentFrame.fmList.splice(selectedModuleIndex, 1);
            selectedModuleIndex = -1;
            
            // 更新界面
            renderCanvas(6);
            
        }
        
        // 复制选中的模块
        function copyModule() {
            // 如果正在编辑表情区域，不允许复制模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || (selectedModuleIndex < 0 && selectedModuleIndices.length === 0)) return;
            
            // 检查是否有多个模块被选中
            if (selectedModuleIndices.length > 1) {
                // 保存所有选中模块的信息
                copiedModuleInfos = [];
                
                for (const index of selectedModuleIndices) {
                    const fm = currentFrame.fmList[index];
                    copiedModuleInfos.push(fm.clone());
                }
                
                // 清除单个模块的复制信息
                copiedModuleInfo = null;
                
                // 显示复制成功提示
                showNotification(`已复制 ${selectedModuleIndices.length} 个模块，可以跨精灵粘贴`);
            } else if (selectedModuleIndex >= 0) {
                // 如果只有一个模块被选中，使用原有的复制逻辑
                const fm = currentFrame.fmList[selectedModuleIndex];
                
                // 保存模块信息，包括模块对象、位置、翻转/旋转标志和缩放信息
                copiedModuleInfo = fm.clone();
                // {
                //     module: fm.module,  // 模块对象
                //     x: fm.x,            // X坐标
                //     y: fm.y,            // Y坐标
                //     flag: fm.flag,      // 翻转/旋转标志
                //     angle: fm.angle ? fm.angle : 0,  // 角度信息
                //     scale: fm.scale ? fm.scale : 1  // 缩放信息
                // };
                
                // 清除多个模块的复制信息
                copiedModuleInfos = null;
                
                // 显示复制成功提示
                showNotification('模块已复制，可以跨精灵粘贴');
            }
        }
        
        // 粘贴模块
        function pasteModule() {
            // 如果正在编辑表情区域，不允许粘贴模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if ((!copiedModuleInfo && !copiedModuleInfos) || !currentFrame) return;
            
            // 创建一个组合命令来包含所有模块的添加命令
            const compositeCommand = new CompositeCommand();
            
            // 存储新粘贴的模块索引
            const newModuleIndices = [];
            
            // 检查是否有多个模块的复制信息
            if (copiedModuleInfos && copiedModuleInfos.length > 0) {
                // 粘贴多个模块
                for (const copiedInfo of copiedModuleInfos) {
                    // 从复制的信息创建新的FrameModule
                    const newFm = new FrameModule(
                        copiedInfo.module,  // 使用相同的模块
                        copiedInfo.x + 10,  // 稍微偏移一点，避免重叠
                        copiedInfo.y + 10,  // 稍微偏移一点，避免重叠
                        copiedInfo.flag,    // 使用相同的翻转/旋转标志
                        copiedInfo.scale ? copiedInfo.scale : 1,  // 缩放信息
                        copiedInfo.angle ? copiedInfo.angle : 0  // 角度信息
                    );
                    
                    // 创建添加模块命令并添加到组合命令
                    compositeCommand.addCommand(new AddFmCommand(currentFrame, newFm));
                }
                
                // 执行组合命令
                CommandManager.instance.addCommand(compositeCommand);
                
                // 选中所有新粘贴的模块
                const startIndex = currentFrame.fmList.length - copiedModuleInfos.length;
                selectedModuleIndices = [];
                for (let i = startIndex; i < currentFrame.fmList.length; i++) {
                    selectedModuleIndices.push(i);
                }
                
                // 设置主要选中模块为第一个新粘贴的模块
                selectedModuleIndex = selectedModuleIndices[0];
                
                // 更新控制面板属性
                updateModuleProperties(currentFrame.fmList[selectedModuleIndex]);
                
                // 强制重绘，确保选中状态正确显示
                renderCanvas(7);
                
                // 显示粘贴成功提示
                showNotification(`已粘贴 ${copiedModuleInfos.length} 个模块`);
            } else if (copiedModuleInfo) {
                // 如果只有一个模块被复制，使用原有的粘贴逻辑
                // 从复制的信息创建新的FrameModule
                const newFm = new FrameModule(
                    copiedModuleInfo.module,  // 使用相同的模块
                    copiedModuleInfo.x + 10,  // 稍微偏移一点，避免重叠
                    copiedModuleInfo.y + 10,  // 稍微偏移一点，避免重叠
                    copiedModuleInfo.flag,     // 使用相同的翻转/旋转标志
                    copiedModuleInfo.scale ? copiedModuleInfo.scale : 1,  // 缩放信息
                    copiedModuleInfo.angle ? copiedModuleInfo.angle : 0  // 角度信息
                );
                
                // 添加新模块到当前帧
                CommandManager.instance.addCommand(new AddFmCommand(currentFrame, newFm));
                
                // 选中新添加的模块
                selectedModuleIndex = currentFrame.fmList.length - 1;
                selectedModuleIndices = [selectedModuleIndex];
                
                // 更新控制面板属性
                updateModuleProperties(currentFrame.fmList[selectedModuleIndex]);
                
                // 强制重绘，确保选中状态正确显示
                renderCanvas(7);
                
                // 显示粘贴成功提示
                showNotification('模块已粘贴');
            }
        }
        
        // 显示通知提示
        function showNotification(message) {
            // 检查是否已存在通知元素
            let notification = document.getElementById('notification');
            if (!notification) {
                // 创建通知元素
                notification = document.createElement('div');
                notification.id = 'notification';
                document.body.appendChild(notification);
            }
            
            // 设置通知内容和样式
            notification.textContent = message;
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.padding = '10px 20px';
            notification.style.backgroundColor = '#333';
            notification.style.color = 'white';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '1000';
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            
            // 显示通知
            setTimeout(() => {
                notification.style.opacity = '1';
            }, 10);
            
            // 3秒后隐藏通知
            setTimeout(() => {
                notification.style.opacity = '0';
            }, 3000);
        }
        
        // 水平翻转
        function flipHorizontal() {
            // 如果正在编辑表情区域，不允许水平翻转模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || (selectedModuleIndex < 0 && selectedModuleIndices.length === 0)) return;
            
            // 创建一个组合命令来包含所有模块的变换命令
            const compositeCommand = new CompositeCommand();
            
            // 如果有多个模块被选中，同时水平翻转所有选中的模块
            if (selectedModuleIndices.length > 1) {
                for (const index of selectedModuleIndices) {
                    const fm = currentFrame.fmList[index];
                    compositeCommand.addCommand(new FlipHorizontalCommand(fm));
                }
            } else if (selectedModuleIndex >= 0) {
                console.log('水平翻转前:',currentFrame.fmList[selectedModuleIndex].flag);
                // 如果只有一个模块被选中，水平翻转这个模块
                const fm = currentFrame.fmList[selectedModuleIndex];
                compositeCommand.addCommand(new FlipHorizontalCommand(fm));
                console.log('水平翻转后:',fm.flag);
            }
            
            // 添加组合命令到命令管理器
            CommandManager.instance.addCommand(compositeCommand);
            
            // 更新界面
            renderCanvas(8);
        }
        
        // 垂直翻转
        function flipVertical() {
            // 如果正在编辑表情区域，不允许垂直翻转模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || (selectedModuleIndex < 0 && selectedModuleIndices.length === 0)) return;

            // 创建一个组合命令来包含所有模块的变换命令
            const compositeCommand = new CompositeCommand();
            
            // 如果有多个模块被选中，同时水平翻转所有选中的模块
            if (selectedModuleIndices.length > 1) {
                for (const index of selectedModuleIndices) {
                    const fm = currentFrame.fmList[index];
                    compositeCommand.addCommand(new FlipVerticalCommand(fm));
                }
            } else if (selectedModuleIndex >= 0) {
                // console.log('垂直翻转前:',currentFrame.fmList[selectedModuleIndex].flag);
                // 如果只有一个模块被选中，垂直翻转这个模块
                const fm = currentFrame.fmList[selectedModuleIndex];
                compositeCommand.addCommand(new FlipVerticalCommand(fm));

            }
            
            // 添加组合命令到命令管理器
            CommandManager.instance.addCommand(compositeCommand);
            
            // 更新界面
            renderCanvas(9);
        }
        
        // 旋转模块
        function rotateModule() {
            // 如果正在编辑表情区域，不允许旋转模块
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || selectedModuleIndex < 0) return;
            
            const fm = currentFrame.fmList[selectedModuleIndex];
            CommandManager.instance.addCommand(new TransformFmCommand(fm, fm.x, fm.y, fm.flag));
            
            // 切换旋转标志
            fm.flag ^= 4;
            
            // 更新界面
            renderCanvas(10);
            updateModuleProperties(fm);
        }
        
        // 改变动画速度
        function changeAnimationSpeed() {
            // 直接使用滑块的值作为毫秒间隔
            animationSpeed = parseInt(document.getElementById('speed-range').value);
            // 更新显示的毫秒值
            document.getElementById('speed-value').textContent = animationSpeed;
        }
        

        // 处理键盘按下事件
        function handleKeyDown(e) {
            
            if (e.code === 'Space') {
                isSpacePressed = true;
                // 当按下空格键且鼠标在画布上时，将鼠标变为手形
                if (canvas.matches(':hover')) {
                    canvas.style.cursor = 'grab';
                }
                e.preventDefault();
            }
            
            // 如果正在编辑表情区域，不允许对fm的键盘操作
            if (isEditingExpressionRect) {
                return;
            }

            if (e.code === 'Ctrl' || e.code === 'MetaLeft' || e.code === 'ControlLeft') {
                isCtrlPressed = true;
            }

            // 处理图片编辑模式下的键盘事件
            if (editMode === 'edit' && selectedImageModule !== -1) {
                const imageItem = currentSprite.getImage(currentImageId);
                if (imageItem && imageItem.modulesList && imageItem.modulesList[selectedImageModule]) {
                    const module = imageItem.modulesList[selectedImageModule];
                    
                    // 处理上下左右键移动选中的图片模块
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                        // 移动量
                        let dx = 0;
                        let dy = 0;
                        
                        // 根据按键方向设置移动量
                        if (e.code === 'ArrowUp') {
                            dy = -1; // 向上移动1个单位
                        } else if (e.code === 'ArrowDown') {
                            dy = 1; // 向下移动1个单位
                        } else if (e.code === 'ArrowLeft') {
                            dx = -1; // 向左移动1个单位
                        } else if (e.code === 'ArrowRight') {
                            dx = 1; // 向右移动1个单位
                        }

                        // 更新模块位置
                        module.x += dx;
                        module.y += dy;
                        
                        // 确保模块不超出图片范围
                        module.x = Math.max(0, module.x);
                        module.y = Math.max(0, module.y);
                        module.x = Math.min(module.x, currentImage.width - module.width);
                        module.y = Math.min(module.y, currentImage.height - module.height);
                        
                        // 重新绘制画布
                        drawCurrentImage();
                        
                        e.preventDefault(); // 阻止默认行为
                    } else if (e.code === 'Delete' || e.code === 'Backspace') {
                        // 处理删除键删除选中的图片模块
                        if (confirm('确定要删除选中的模块吗？此操作无法恢复。')) {
                            // 从模块列表中删除选中的模块
                            imageItem.modulesList.splice(selectedImageModule, 1);
                            
                            // 重置选中状态
                            selectedImageModule = -1;
                            resizeMode = null;
                            
                            // 重新绘制画布
                            drawCurrentImage();
                            
                            // 更新模块列表
                            renderModulesList();
                        }
                        
                        e.preventDefault(); // 阻止默认行为
                    }
                }
            }
            
            // 处理帧编辑模式下的键盘事件
            if (currentFrame && (selectedModuleIndex >= 0 || selectedModuleIndices.length > 0)) {
                // 检查是否有选中的模块
                let modulesToMove = [];
                
                if (selectedModuleIndices.length > 0) {
                    // 如果有多个模块被选中，移动所有选中的模块
                    modulesToMove = selectedModuleIndices.map(index => currentFrame.fmList[index]);
                } else if (selectedModuleIndex >= 0) {
                    // 如果只有一个模块被选中，移动这个模块
                    modulesToMove = [currentFrame.fmList[selectedModuleIndex]];
                }
                
                // 检查是否按下了箭头键
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    // 创建一个组合命令来包含所有模块的移动命令
                    const compositeCommand = new CompositeCommand();
                    
                    // 移动量
                    let dx = 0;
                    let dy = 0;
                    
                    // 根据按键方向设置移动量
                    if (e.code === 'ArrowUp') {
                        dy = 1; // 向上移动1个单位
                    } else if (e.code === 'ArrowDown') {
                        dy = -1; // 向下移动1个单位
                    } else if (e.code === 'ArrowLeft') {
                        dx = -1; // 向左移动1个单位
                    } else if (e.code === 'ArrowRight') {
                        dx = 1; // 向右移动1个单位
                    }

                    // 移动每个模块
                    modulesToMove.forEach(fm => {
                        // 先记录当前位置作为旧位置
                        const oldX = fm.x;
                        const oldY = fm.y;
                        
                        // 更新模块位置
                        fm.x += dx;
                        fm.y += dy;
                        
                        // 在位置更新后创建移动命令，并传入新的位置值
                        const moveCommand = {
                            execute: function() {
                                fm.x = oldX + dx;
                                fm.y = oldY + dy;
                            },
                            undo: function() {
                                fm.x = oldX;
                                fm.y = oldY;
                            }
                        };
                        compositeCommand.addCommand(moveCommand);
                    });

                    // 执行组合命令
                    CommandManager.instance.addCommand(compositeCommand);
                    
                    // 更新界面
                    renderCanvas(7);
                    
                    // 更新模块属性面板
                    if (selectedModuleIndex >= 0) {
                        updateModuleProperties(currentFrame.fmList[selectedModuleIndex]);
                    }
                    
                    e.preventDefault(); // 阻止默认行为
                } else if (e.code === 'Delete' || e.code === 'Backspace') {
                    // 处理删除键删除选中的模块
                    // 创建一个组合命令来包含所有模块的删除命令
                    const compositeCommand = new CompositeCommand();
                    let hasDeletedModules = false;
                    
                    if (selectedModuleIndices.length > 0) {
                        // 如果有多个模块被选中，按索引从大到小删除，避免索引错误
                        const sortedIndices = [...selectedModuleIndices].sort((a, b) => b - a);
                        
                        sortedIndices.forEach(index => {
                            if (index >= 0 && index < currentFrame.fmList.length) {
                                hasDeletedModules = true;
                                const fm = currentFrame.fmList[index];
                                // 保存索引，因为在删除后索引会变化
                                const originalIndex = index;
                                // 创建删除命令并添加到组合命令
                                const deleteCommand = {
                                    execute: function() {},
                                    undo: function() {
                                        // 使用原始索引插入，确保位置正确
                                        currentFrame.fmList.splice(originalIndex, 0, fm);
                                        renderCanvas(5);
                                        if (currentFrame.fmList.length > 0) {
                                            selectedModuleIndex = Math.min(originalIndex, currentFrame.fmList.length - 1);
                                            updateModuleProperties(currentFrame.fmList[selectedModuleIndex]);
                                        }
                                    }
                                };
                                compositeCommand.addCommand(deleteCommand);
                                
                                // 从当前帧中删除模块
                                currentFrame.fmList.splice(index, 1);
                            }
                        });
                    } else if (selectedModuleIndex >= 0 && selectedModuleIndex < currentFrame.fmList.length) {
                        // 如果只有一个模块被选中，删除这个模块
                        hasDeletedModules = true;
                        const fm = currentFrame.fmList[selectedModuleIndex];
                        // 保存索引，因为在删除后索引会变化
                        const originalIndex = selectedModuleIndex;
                        // 创建删除命令并添加到组合命令
                        const deleteCommand = {
                            execute: function() {},
                            undo: function() {
                                // 使用原始索引插入，确保位置正确
                                currentFrame.fmList.splice(originalIndex, 0, fm);
                                renderCanvas(5);
                                updateModuleProperties(fm);
                            }
                        };
                        compositeCommand.addCommand(deleteCommand);
                        
                        // 从当前帧中删除模块
                        currentFrame.fmList.splice(selectedModuleIndex, 1);
                    }
                    
                    // 只有在实际删除了模块的情况下才执行命令和更新界面
                    if (hasDeletedModules) {
                        // 执行组合命令
                        CommandManager.instance.addCommand(compositeCommand);
                        
                        // 重置选中状态
                        selectedModuleIndex = -1;
                        selectedModuleIndices = [];
                        
                        // 更新界面
                        renderCanvas(6);
                        
                        e.preventDefault(); // 阻止默认行为
                    }
                }
            }
        }
        
        // 处理键盘释放事件
        function handleKeyUp(e) {
            if (e.code === 'Space') {
                isSpacePressed = false;
                isDraggingOrigin = false;
                // 恢复鼠标形状
                canvas.style.cursor = 'default';
            }
            
            if (e.code === 'Ctrl' || e.code === 'MetaLeft' || e.code === 'ControlLeft') {
                isCtrlPressed = false;
            }
        }
        
        // 处理鼠标悬停事件 - 检测fm模块的 旋转控制点和调整尺寸控制点
        function handleFrameMouseHover(e) {

            //针对fm模块悬停时鼠标改变形状
            if (isDragging || isSpacePressed || !currentFrame || selectedModuleIndex < 0 || !currentSprite) {
                return;
            }
            // 如果正在编辑表情区域，不处理fm的鼠标悬停事件
            if (isEditingExpressionRect) {
                // canvas.style.cursor = 'default';
                return;
            }

            // const rect = canvas.getBoundingClientRect();
            // const mouseX = e.clientX - rect.left;
            // const mouseY = e.clientY - rect.top;
            const [mouseX, mouseY] = getCurrentXY(e);

            // 检查选中的模块的旋转控制点和尺寸控制点
            const fm = currentFrame.fmList[selectedModuleIndex];
            const module = fm.module;
            if (module) {
                const imageItem = currentSprite.getImage(module.imageId);
                if (imageItem && imageItem.modulesList[module.imageModuleId]) {
                    const rectModule = imageItem.modulesList[module.imageModuleId];
                    let width = rectModule.width;
                    let height = rectModule.height;
                    
                    // 应用缩放
                    if (fm.scale) {
                        width *= fm.scale;
                        height *= fm.scale;
                    }
                    
                    // 应用变换后的尺寸
                    if (fm.flag & 4) { // 90度旋转
                        [width, height] = [height, width];
                    }

                    // 计算旋转控制点位置（右下角向外延伸一点）
                    const rotateHandleX = fm.x + width + 10;
                    const rotateHandleY = fm.y - height;
                    
                    // 检查鼠标是否在旋转控制点上
                    const dx = mouseX - rotateHandleX;
                    const dy = mouseY - rotateHandleY;
                    if (dx * dx + dy * dy <= 16) { // 4px的点击范围
                        canvas.style.cursor = 'grabbing'; // 使用旋转光标
                        return;
                    }
                    
                    // 计算四个调整尺寸控制点的位置,相对于原点坐标系
                    const points = [
                        { x: fm.x, y: fm.y }, // 左上
                        { x: fm.x + width, y:  fm.y }, // 右上
                        { x: fm.x + width, y: fm.y - height }, // 右下
                        { x: fm.x, y: fm.y - height } // 左下
                    ];
                    
                    // 检查鼠标是否在任何一个尺寸控制点上
                    for (let i = 0; i < points.length; i++) {
                        const dx = mouseX - points[i].x;
                        const dy = mouseY - points[i].y;
                        if (dx * dx + dy * dy <= 16) { // 4px的点击范围
                            // 根据控制点位置设置相应的光标样式
                            if (i === 0 || i === 2) {
                                canvas.style.cursor = 'nwse-resize'; // 对角线光标
                            } else {
                                canvas.style.cursor = 'nesw-resize'; // 另一条对角线光标
                            }
                            return;
                        }
                    }
                    
                    // 检查鼠标是否在模块上
                    const left = fm.x;
                    const top = fm.y;
                    const right = left + width;
                    const bottom = top - height;
                    
                    if (mouseX >= left - 4 && mouseX <= right + 4 && mouseY <= top - 4 && mouseY >= bottom + 4) {
                        canvas.style.cursor = 'move'; // 移动光标
                        //console.log('in move');
                        return;
                    }
                }
            }
            
            // 如果没有悬停在旋转控制点、尺寸控制点或模块上，恢复默认光标
            if (canvas.style.cursor !== 'default' && canvas.style.cursor !== 'grab') {
                canvas.style.cursor = 'default';
            }
        };
        
        // 原始鼠标事件处理函数引用
        const originalHandleMouseDown = handleFrameMouseDown;
        const originalHandleMouseMove = handleFrameMouseMove;
        const originalHandleMouseUp = handleFrameMouseUp;
        
        // 保存模块拖拽开始时的状态
        let dragStartModuleState = null;
        
        // 旋转相关状态变量
        let isDraggingRotate = false;
        let originalAngle = 0;
        let moduleCenterX = 0;
        let moduleCenterY = 0;
        
        // 表情区域相关状态变量
        let isEditingExpressionRect = false; // 是否正在编辑表情区域
        let isDraggingExpressionRect = false; // 是否正在拖拽表情区域
        let isResizingExpressionRect = false; // 是否正在修改表情区域宽高
        let expressionResizeControlPoint = -1; // 表情区域的缩放控制点索引
        let expressionDragStartX = 0; // 表情区域拖拽开始时的X坐标
        let expressionDragStartY = 0; // 表情区域拖拽开始时的Y坐标
        let expressionOriginalX = 0; // 表情区域原始X坐标
        let expressionOriginalY = 0; // 表情区域原始Y坐标
        let expressionOriginalWidth = 0; // 表情区域原始宽度
        let expressionOriginalHeight = 0; // 表情区域原始高度
        let expressions = []; // 存储加载的表情数据
        let globalHorizontalMirrorFlag = 0; // 水平镜像标志，0表示不镜像，1表示镜像
        let isShowExpression = false; // 是否显示表情
        


        // 记录当前拖拽的控制点
        let resizeControlPoint = -1;
        let originalWidth = 0;
        let originalHeight = 0;
        let originalX = 0;
        let originalY = 0;
        

        function checkPointInFm(x, y, currentFrame) {
            if(!currentSprite) return [null, false, false, 0, 0];
            for (let i = currentFrame.fmList.length - 1; i >= 0; i--) {
                const fm = currentFrame.fmList[i];
                const module = fm.module;
                if (!module) continue;
        
                const imageItem = currentSprite.getImage(module.imageId);
                if (!imageItem || !imageItem.modulesList[module.imageModuleId]) continue;

                const rectModule = imageItem.modulesList[module.imageModuleId];
                let width = rectModule.width;
                let height = rectModule.height;

                // 应用缩放
                if (fm.scale) {
                    width *= fm.scale;
                    height *= fm.scale;
                }
                
                // 应用变换后的尺寸
                if (fm.flag & 4) { // 90度旋转
                    [width, height] = [height, width];
                }

                // 计算模块的边界框
                const left = fm.x;
                const top = fm.y;
                const right = left + width;
                const bottom = top - height;
                // console.log('xy:',x,y,',left:',left,',top:',top,',right:',right,',bottom:',bottom);
                if(x >= left-4 && x <= right+4 && y <= top+4 && y >= bottom-4) {
                    // console.log('点击模块')
                    return [fm, true, false, width, height];
                }

                // 计算旋转控制点位置（右下角向外延伸一点）
                const rotateHandleX = fm.x + width + 10;
                const rotateHandleY = fm.y - height;
                
                // 检查是否点击了旋转控制点
                const dxRotate = x - rotateHandleX;
                const dyRotate = y - rotateHandleY;
                // console.log('xy:',x,y,',rotateHandleX:',rotateHandleX,rotateHandleY);
                if (x >= rotateHandleX-4 && x <= rotateHandleX+4 && y >= rotateHandleY-4 && y <= rotateHandleY+4) {
                    // console.log('旋转点')
                    return [fm, false, true, width, height];
                }
            }

            return [null, false, false, 0, 0];
        }

        //计算相对于画布中心的坐标
        function getCurrentXY(e){
            const rect = canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left );
            let y = (e.clientY - rect.top );

            // 计算相对于画布中心的坐标
            x = Math.round((x - m_imageOriginPos.x)/zoomLevel);
            y = Math.round((m_imageOriginPos.y - y)/zoomLevel);
            return [x, y];
        }

        // 处理鼠标按下事件
        function handleFrameMouseDown(e) {
            // 如果空格键按下且没有选中模块，进入拖拽原点模式
            if (isSpacePressed && selectedModuleIndex === -1) {
                isDraggingOrigin = true;
                const rect = canvas.getBoundingClientRect();
                // 记录点击时的屏幕坐标和当前原点位置
                originDragScreenX = e.clientX;
                originDragScreenY = e.clientY;
                originDragStartPosX = m_imageOriginPos.x;
                originDragStartPosY = m_imageOriginPos.y;
                canvas.style.cursor = 'grabbing';
                return;
            }
            
            if (!currentFrame) return;
            
            const [x, y] = getCurrentXY(e);
            // console.log('click:',x, y);
            
            // 如果正在编辑表情区域，优先处理表情区域的交互
            if (isEditingExpressionRect && currentFrameIndex !== -1 && currentAnim && currentFrameIndex < currentAnim.aframeList.length && currentAnim.aframeList[currentFrameIndex] && currentAnim.aframeList[currentFrameIndex].expressionRect) {
                const rect = currentAnim.aframeList[currentFrameIndex].expressionRect;
                
                // 计算表情区域的边界
                const left = rect.x;
                const right = rect.x + rect.width;
                const top = rect.y;
                const bottom = rect.y - rect.height;
                
                // 计算控制点位置 左上、右上、右下、左下
                const points = [
                    { x: rect.x, y: rect.y },
                    { x: rect.x + rect.width, y: rect.y },
                    { x: rect.x + rect.width, y: rect.y - rect.height },
                    { x: rect.x, y: rect.y - rect.height }
                ];
                
                // 检查是否点击到了控制点
                let clickedControlPoint = -1;
                for (let i = 0; i < points.length; i++) {
                    const dx = x - points[i].x;
                    const dy = y - points[i].y;
                    if (dx * dx + dy * dy <= 16) { // 4px的点击范围
                        clickedControlPoint = i;
                        break;
                    }
                }
                
                if (clickedControlPoint !== -1) {
                    // 点击到了控制点，开始调整表情区域大小
                    expressionResizeControlPoint = clickedControlPoint;
                    isDragging = true;
                    expressionDragStartX = x;
                    expressionDragStartY = y;
                    expressionOriginalX = rect.x;
                    expressionOriginalY = rect.y;
                    expressionOriginalWidth = rect.width;
                    expressionOriginalHeight = rect.height;
                    isResizingExpressionRect = true;
                    console.log('resize表情区域');
                    return;
                } else if (x >= left && x <= right && y >= bottom && y <= top) {
                    // 点击到了表情区域内部，开始拖拽表情区域
                    // console.log('drag表情区域');
                    isDraggingExpressionRect = true;
                    expressionDragStartX = x;
                    expressionDragStartY = y;
                    expressionOriginalX = rect.x;
                    expressionOriginalY = rect.y;
                    return;
                }
            }
            
            // 如果正在编辑表情区域，不允许选中fm及对fm的其它操作
            if (isEditingExpressionRect) {
                canvas.style.cursor = 'default';
                return;
            }
            
            // 检查是否点击到了选中模块的控制点
            if (selectedModuleIndex >= 0 && !isCtrlPressed) {
                const fm = currentFrame.fmList[selectedModuleIndex];
                const module = fm.module;
                if (module) {
                    const imageItem = currentSprite.getImage(module.imageId);
                    if (imageItem && imageItem.modulesList[module.imageModuleId]) {
                        const rectModule = imageItem.modulesList[module.imageModuleId];
                        let width = rectModule.width;
                        let height = rectModule.height;
                        
                        // 应用变换后的尺寸
                        if (fm.flag & 4) { // 90度旋转
                            [width, height] = [height, width];
                        }
                        
                        // 计算控制点位置 左上、右上、右下、左下
                        const points = [
                            { x: (m_imageOriginPos.x + fm.x) , y: m_imageOriginPos.y - fm.y },
                            { x: m_imageOriginPos.x + fm.x + width, y: m_imageOriginPos.y - fm.y  },
                            { x: m_imageOriginPos.x + fm.x + width, y: m_imageOriginPos.y - fm.y + height },
                            { x: m_imageOriginPos.x + fm.x , y: m_imageOriginPos.y - fm.y + height }
                        ];
                        
                        // 检查是否点击到了控制点
                        for (let i = 0; i < points.length; i++) {
                            const dx = x - points[i].x;
                            const dy = y - points[i].y;
                            if (dx * dx + dy * dy <= 16) { // 4px的点击范围
                                //单个模块开始拖拽
                                resizeControlPoint = i;
                                isDragging = true;
                                dragStartX = x;
                                dragStartY = y;
                                originalWidth = width;
                                originalHeight = height;
                                originalX = fm.x;
                                originalY = fm.y;
                                console.log('控制点');
                                return;
                            }
                        }
                    }
                }
            }
            

            // 检查是否点击了某个模块
            // 从后往前检查，确保上层的模块先被选中
            const [fm, isClick, isRotate, width, height] = checkPointInFm(x, y, currentFrame);

            if(fm) {
                const module = fm.module;
                selectedModuleIndex = currentFrame.fmList.indexOf(fm);
                
                //渲染时使用的是selectedModuleIndices,因此必须添加其中
                if(!isCtrlPressed){
                    selectedModuleIndices = [];
                    selectedModuleIndices.push(selectedModuleIndex);
                }

                // console.log('点击了模块:', fm,'isClick:',isClick,'isRotate:',isRotate);         

                if(isRotate) {
                    console.log('准备旋转');
                    isDragging = true;
                    isDraggingRotate = true;
                    originalAngle = fm.angle;
                    
                    // 计算模块中心点
                    moduleCenterX = m_imageOriginPos.x + fm.x + width / 2;
                    moduleCenterY = m_imageOriginPos.y - fm.y + height / 2;
                    
                    dragStartX = x;
                    dragStartY = y;
                    
                    // 保存拖拽开始时的模块状态
                    dragStartModuleState = {
                        x: fm.x,
                        y: fm.y,
                        flag: fm.flag,
                        angle: fm.angle
                    };
                    
                    return;
                }

                if(isClick){

                    if (selectedModuleIndex >= 0 && selectedModuleIndices.length <= 1) {
                        isDragging = true;
                        dragStartX = x;
                        dragStartY = y;
                        
                        // 保存拖拽开始时的模块状态
                        dragStartModuleState = {
                            x: fm.x,
                            y: fm.y,
                            flag: fm.flag
                        };
                        
                        // console.log('选中',selectedModuleIndex);
                        // 更新控制面板属性
                        updateModuleProperties(fm);
                    } else if (isCtrlPressed) {

                        // 多选情况下按住Ctrl键，使用isMultiDragging变量来控制拖拽
                        isMultiDragging = true;
                        dragStartX = x;
                        dragStartY = y;
                        
                        // 保存所有选中模块的初始状态
                        dragStartModuleStates = [];
                        for (const index of selectedModuleIndices) {
                            const selectedFm = currentFrame.fmList[index];
                            dragStartModuleStates.push({
                                index: index,
                                x: selectedFm.x,
                                y: selectedFm.y,
                                flag: selectedFm.flag
                            });
                        }
                        
                        console.log('multy drag start');
                        // 更新控制面板属性
                        updateModuleProperties(fm);
                    } else {
                        // 多选情况下没有按住Ctrl键，不开始拖拽
                        // 只更新控制面板属性
                        updateModuleProperties(fm);
                    }
                    
                    renderCanvas(11);

                    // console.log('点击了模块 isDragging:', isDragging, 'isMultiDragging:', isMultiDragging);
                    return;
                }
            }
            
            // 如果没有点击到任何模块，开始框选操作
            isMarqueeSelecting = true;
            isDragging = false;
            marqueeStartX = x;
            marqueeStartY = y;
            marqueeEndX = x;
            marqueeEndY = y;
            
            // 如果没有按住Ctrl键，清空之前的选择
            if (!isCtrlPressed) {
                selectedModuleIndex = -1;
                selectedModuleIndices = [];
            }
            
            renderCanvas();
        }
        

        // 处理鼠标移动事件
        function handleFrameMouseMove(e) {
            // 如果处于拖拽原点模式
            if (isDraggingOrigin) {
                // 计算鼠标移动的屏幕偏移量
                const deltaX = e.clientX - originDragScreenX;
                const deltaY = e.clientY - originDragScreenY;
                
                // 根据当前缩放比例计算原点应该移动的距离
                m_imageOriginPos.x = originDragStartPosX + deltaX;// / zoomLevel;
                m_imageOriginPos.y = originDragStartPosY + deltaY;// / zoomLevel;
                renderCanvas();
                return;
            }

            let [x, y] = getCurrentXY(e);

            // 如果正在拖拽表情区域，优先处理表情区域的拖拽
            // console.log('isDraggingExpressionRect;',isDraggingExpressionRect,currentFrameIndex);
            if (isDraggingExpressionRect && currentAnim && currentFrameIndex !== -1 && currentFrameIndex < currentAnim.aframeList.length && currentAnim.aframeList[currentFrameIndex] && currentAnim.aframeList[currentFrameIndex].expressionRect) {
                const rect = currentAnim.aframeList[currentFrameIndex].expressionRect;
                const deltaX = x - expressionDragStartX;
                const deltaY = y - expressionDragStartY;
                
                // 更新表情区域的位置
                rect.x = expressionOriginalX + deltaX;
                rect.y = expressionOriginalY + deltaY;
                //console.log('drag表情区域1',rect);
                renderCanvas();
                return;
            }
            
            // 如果正在调整表情区域大小，处理表情区域的大小调整
            if (isResizingExpressionRect && expressionResizeControlPoint !== -1 && isDragging && currentAnim && currentFrameIndex !== -1 && currentFrameIndex < currentAnim.aframeList.length && currentAnim.aframeList[currentFrameIndex] && currentAnim.aframeList[currentFrameIndex].expressionRect) {
                const rect = currentAnim.aframeList[currentFrameIndex].expressionRect;
                const deltaX = x - expressionDragStartX;
                const deltaY = y - expressionDragStartY;
                
                let newWidth = expressionOriginalWidth;
                let newHeight = expressionOriginalHeight;
                let newX = expressionOriginalX;
                let newY = expressionOriginalY;
                
                switch (expressionResizeControlPoint) {
                    case 0: // 左上
                        newWidth = expressionOriginalWidth - deltaX;
                        newHeight = newWidth * 1.2; // 保持1:1.2的宽高比
                        newX = expressionOriginalX + deltaX;
                        newY = expressionOriginalY - (newHeight - expressionOriginalHeight);
                        break;
                    case 1: // 右上
                        newWidth = expressionOriginalWidth + deltaX;
                        newHeight = newWidth * 1.2; // 保持1:1.2的宽高比
                        newY = expressionOriginalY - (newHeight - expressionOriginalHeight);
                        break;
                    case 2: // 右下
                        newWidth = expressionOriginalWidth + deltaX;
                        newHeight = newWidth * 1.2; // 保持1:1.2的宽高比
                        break;
                    case 3: // 左下
                        newWidth = expressionOriginalWidth - deltaX;
                        newHeight = newWidth * 1.2; // 保持1:1.2的宽高比
                        newX = expressionOriginalX + deltaX;
                        break;
                }
                
                // 确保尺寸不为负数
                newWidth = Math.max(30, newWidth);
                newHeight = newWidth * 1.2; // 保持1:1.2的宽高比
                // newHeight = Math.max(1, newHeight);
                

                // 更新表情区域的尺寸和位置
                if(newWidth>40){
                    rect.x = newX;
                    rect.y = newY;
                }
                rect.width = newWidth;
                rect.height = newHeight;
                
                renderCanvas();
                return;
            }
            
            // 如果正在编辑表情区域，不允许执行fm相关操作
            if (isEditingExpressionRect) {
                // 更新鼠标样式
                if (currentFrameIndex !== -1 && currentAnim && currentFrameIndex < currentAnim.aframeList.length && currentAnim.aframeList[currentFrameIndex] && currentAnim.aframeList[currentFrameIndex].expressionRect) {
                    const rect = currentAnim.aframeList[currentFrameIndex].expressionRect;
                    
                    // 计算表情区域的边界
                    const left = rect.x;
                    const right = rect.x + rect.width;
                    const top = rect.y;
                    const bottom = rect.y - rect.height;
                    
                    // 计算控制点位置 左上、右上、右下、左下
                    const points = [
                        { x: rect.x, y: rect.y },
                        { x: rect.x + rect.width, y: rect.y },
                        { x: rect.x + rect.width, y: rect.y - rect.height },
                        { x: rect.x, y: rect.y - rect.height }
                    ];
                    
                    // 检查是否悬停在控制点上
                    let isOverControlPoint = false;
                    let controlPointIndex = -1;
                    for (let i = 0; i < points.length; i++) {
                        const dx = x - points[i].x;
                        const dy = y - points[i].y;
                        if (dx * dx + dy * dy <= 16) { // 4px的点击范围
                            isOverControlPoint = true;
                            controlPointIndex = i;
                            console.log('over control point',i);
                            break;
                        }
                    }
                    
                    //console.log('x,y',x,y,'left,right',left,right,'top, bottom',top,bottom);
                    // 设置对应的光标样式
                    if (isOverControlPoint) {
                         console.log('resize',controlPointIndex);
                        // 根据不同的控制点设置不同的光标
                        if (controlPointIndex === 0 || controlPointIndex === 2) {
                            canvas.style.cursor = 'nwse-resize';
                        } else {
                            canvas.style.cursor = 'nesw-resize';
                        }
                    } else if (x >= left && x <= right && y <= top && y >= bottom) {
                        canvas.style.cursor = 'move';
                        console.log('in move');
                    } else {
                        // console.log('no');
                        canvas.style.cursor = 'default';
                    }
                } else {
                    console.log('no2');
                    canvas.style.cursor = 'default';
                }
                
                return;
            }
            
            // 处理框选操作
            if (isMarqueeSelecting && currentFrame) {
                // 更新框选结束点
                marqueeEndX = x;
                marqueeEndY = y;
                
                // 重绘画布以显示框选矩形
                renderCanvas();
                return;
            }
            
            if ((!isDragging && !isMultiDragging) || !currentFrame || selectedModuleIndex < 0) return;
            
            
            // let x = (e.clientX - rect.left);// / zoomLevel;
            // let y = (e.clientY - rect.top);// / zoomLevel;
            
            // // 计算相对于画布中心的坐标
            // x = Math.round((x - m_imageOriginPos.x)/zoomLevel);
            // y = Math.round((m_imageOriginPos.y - y)/zoomLevel);
            // console.log('move:',x, y);
            
            const fm = currentFrame.fmList[selectedModuleIndex];
            
            if (isDraggingRotate) {
                // 处理旋转
                const rect = canvas.getBoundingClientRect();
                // 计算鼠标相对于模块中心点的位置
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // 计算鼠标与模块中心点之间的连线与水平线的夹角（弧度）
                const dx = mouseX - moduleCenterX;
                const dy = mouseY - moduleCenterY;
                const angle = Math.atan2(dy, dx);
                const degree = angle * 180 / Math.PI; // 弧度转角度
                fm.angle = originalAngle + degree;
                
                renderCanvas();
                updateModuleProperties(fm);
                return;
            }
            
            if (resizeControlPoint !== -1) {
                // 处理缩放
                const deltaX = x - dragStartX;
                const deltaY = y - dragStartY;
                
                let newWidth = originalWidth;
                let newHeight = originalHeight;
                let newX = originalX;
                let newY = originalY;
                
                switch (resizeControlPoint) {
                    case 0: // 左上
                        newWidth = originalWidth - deltaX;
                        newHeight = originalHeight + deltaY;
                        newX = originalX + deltaX / 2;
                        newY = originalY - deltaY / 2;
                        break;
                    case 1: // 右上
                        newWidth = originalWidth + deltaX;
                        newHeight = originalHeight + deltaY;
                        newX = originalX - deltaX / 2;
                        newY = originalY - deltaY / 2;
                        break;
                    case 2: // 右下
                        newWidth = originalWidth + deltaX;
                        newHeight = originalHeight - deltaY;
                        newX = originalX - deltaX / 2;
                        newY = originalY + deltaY / 2;
                        break;
                    case 3: // 左下
                        newWidth = originalWidth - deltaX;
                        newHeight = originalHeight - deltaY;
                        newX = originalX + deltaX / 2;
                        newY = originalY + deltaY / 2;
                        break;
                }
                
                // 确保尺寸不为负数
                newWidth = Math.max(1, newWidth);
                newHeight = Math.max(1, newHeight);
                
                // 保存原始模块尺寸
                const module = fm.module;
                if (module) {
                    const imageItem = currentSprite.getImage(module.imageId);
                    if (imageItem && imageItem.modulesList[module.imageModuleId]) {
                        // 计算缩放比例
                        const rectModule = imageItem.modulesList[module.imageModuleId];
                        
                        // 获取原始尺寸（不考虑之前的缩放）
                        let baseWidth = rectModule.width;
                        let baseHeight = rectModule.height;
                        
                        // 应用旋转变换
                        if (fm.flag & 4) { // 90度旋转
                            [baseWidth, baseHeight] = [baseHeight, baseWidth];
                        }
                        
                        // 计算新的缩放比例
                        const scaleX = newWidth / baseWidth;
                        // const scaleY = newHeight / baseHeight;
                        
                        // 更新模块位置和缩放
                        fm.x = newX;
                        fm.y = newY;
                        
                        // 保存缩放比例
                        if (!fm.scale) fm.scale = 1;
                        fm.scale = scaleX;
                        // fm.scale = scaleY;
                        

                    }
                }
            } else {
                const deltaX = x - dragStartX;
                const deltaY = y - dragStartY;
                // 根据拖拽类型处理模块移动
                if (isMultiDragging) {
                    // 如果是多选拖拽，同时拖拽所有选中的模块
                    // console.log('多选拖拽');
                    for (const index of selectedModuleIndices) {
                        const selectedFm = currentFrame.fmList[index];
                        selectedFm.x = selectedFm.x + deltaX;
                        selectedFm.y = selectedFm.y + deltaY;
                    }
                } else if (isDragging) {
                    // 如果是单选拖拽，只拖拽当前选中的模块
                    fm.x = fm.x + deltaX;
                    fm.y = fm.y + deltaY;
                    // console.log('单选拖拽');
                }
                
                dragStartX = x;
                dragStartY = y;

            }
            
            renderCanvas();
            updateModuleProperties(fm);
        }
        
        // 处理鼠标释放事件
        function handleFrameMouseUp(e) {
                        
            // 结束拖拽原点模式
            if (isDraggingOrigin) {
                isDraggingOrigin = false;
                if (isSpacePressed) {
                    canvas.style.cursor = 'grab';
                } else {
                    canvas.style.cursor = 'default';
                }
                return;
            }

            // 如果正在编辑表情区域，不允许执行fm相关操作
            if (isEditingExpressionRect) {
                if(isDraggingExpressionRect)
                    isDraggingExpressionRect = false;
                if(isResizingExpressionRect)
                    isResizingExpressionRect = false;
                return;
            }


            
            // 处理框选结束
            if (isMarqueeSelecting && currentFrame && currentSprite) {
                isMarqueeSelecting = false;
                
                // 计算框选区域
                const x1 = Math.min(marqueeStartX, marqueeEndX);
                const y1 = Math.min(marqueeStartY, marqueeEndY);
                const x2 = Math.max(marqueeStartX, marqueeEndX);
                const y2 = Math.max(marqueeStartY, marqueeEndY);
                
                // 遍历所有模块，检查是否在框选区域内
                for (let i = 0; i < currentFrame.fmList.length; i++) {
                    const fm = currentFrame.fmList[i];
                    const module = fm.module;
                    if (!module) continue;
                    
                    const imageItem = currentSprite.getImage(module.imageId);
                    if (!imageItem || !imageItem.modulesList[module.imageModuleId]) continue;
                    
                    const rectModule = imageItem.modulesList[module.imageModuleId];
                    let width = rectModule.width;
                    let height = rectModule.height;
                    
                    // 应用缩放
                    if (fm.scale) {
                        width *= fm.scale;
                        height *= fm.scale;
                    }
                    
                    // 应用变换后的尺寸
                    if (fm.flag & 4) { // 90度旋转
                        [width, height] = [height, width];
                    }
                    
                    // 计算模块的边界框
                    const left = fm.x;
                    const right = left + width;
                    const top = fm.y;
                    const bottom = top - height;
                    
                    // 检查模块是否完全在框选区域内
                    if (left >= x1 && right <= x2 && bottom >= y1 && top <= y2) {
                        // 如果模块已经在选中列表中，不重复添加
                        if (!selectedModuleIndices.includes(i)) {
                            selectedModuleIndices.push(i);
                        }
                    }
                }
                
                // 如果有选中的模块，设置第一个为当前选中的模块
                if (selectedModuleIndices.length > 0) {
                    selectedModuleIndex = selectedModuleIndices[0];
                    updateModuleProperties(currentFrame.fmList[selectedModuleIndex]);
                }
                
                // 重绘画布以显示选中状态
                renderCanvas();
                return;
            }else{
                isMarqueeSelecting = false;
            }
            
            // 如果是拖拽模块结束，创建变换命令
            if (isDragging && currentFrame && selectedModuleIndex >= 0) {
                // 如果有多个模块被选中，为所有选中的模块创建变换命令
                if (selectedModuleIndices.length > 1 && dragStartModuleStates.length > 0) {
                    // 创建一个组合命令来包含所有模块的变换命令
                    const compositeCommand = new CompositeCommand();
                    
                    for (const state of dragStartModuleStates) {
                        const fm = currentFrame.fmList[state.index];
                        const command = new TransformFmCommand(fm, state.x, state.y, state.flag);
                        compositeCommand.addCommand(command);
                    }
                    
                    CommandManager.instance.addCommand(compositeCommand);
                } else if (dragStartModuleState) {
                    // 如果只有一个模块被选中，为这个模块创建变换命令
                    const fm = currentFrame.fmList[selectedModuleIndex];
                    const command = new TransformFmCommand(fm, dragStartModuleState.x, dragStartModuleState.y, dragStartModuleState.flag);
                    CommandManager.instance.addCommand(command);
                }
                
                dragStartModuleState = null;
                dragStartModuleStates = [];
            }
            
            if(!currentFrame) return;

            let [x, y] = getCurrentXY(e);
            const [fm, isClick, isRotate] = checkPointInFm(x, y, currentFrame);

            if(fm && isClick && isCtrlPressed) {
                
                const index = selectedModuleIndices.indexOf(selectedModuleIndex);
                console.log('mouse up 选中模块:',index);
                if (index === -1) {
                    // 如果模块未被选中，则添加到选中列表
                    selectedModuleIndices.push(selectedModuleIndex);
                    selectedModuleIndex = selectedModuleIndex; // 将当前模块设为主要选中模块
                } else {
                    // 如果模块已被选中，则从选中列表中移除
                    selectedModuleIndices.splice(index, selectedModuleIndex);
                    // 如果选中列表为空，设置selectedModuleIndex为-1
                    // 否则，设置selectedModuleIndex为第一个选中的模块
                    selectedModuleIndex = selectedModuleIndices.length > 0 ? selectedModuleIndices[0] : -1;
                }
                renderCanvas(21);
            }


            isDragging = false;
            isMultiDragging = false;
            resizeControlPoint = -1;
            isDraggingRotate = false;
            isDraggingExpressionRect = false;
            expressionResizeControlPoint = -1;
            
            // 注意：不要在这里重置isEditingExpressionRect，因为我们希望保持编辑模式
            // 只有当用户明确取消选中复选框时，才会退出编辑模式
        }
        
        // 更新模块属性显示
        function updateModuleProperties(fm) {
            // 如果正在编辑表情区域，不允许更新模块属性
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!fm) return;

        }
        
        // 更新模块位置
        function updateModulePosition() {
            // 如果正在编辑表情区域，不允许更新模块位置
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || selectedModuleIndex < 0) return;
            
            const fm = currentFrame.fmList[selectedModuleIndex];
            const command = new TransformFmCommand(fm, fm.x, fm.y, fm.flag);
            
            // fm.x = parseInt(document.getElementById('module-x').value) || 0;
            // fm.y = parseInt(document.getElementById('module-y').value) || 0;
            
            CommandManager.instance.addCommand(command);
            renderCanvas(14);
        }
        
        // 更新模块尺寸
        function updateModuleSize() {
            // 如果正在编辑表情区域，不允许更新模块尺寸
            if (isEditingExpressionRect) {
                return;
            }
            
            if (!currentFrame || selectedModuleIndex < 0) return;
            
            const fm = currentFrame.fmList[selectedModuleIndex];
            const module = fm.module;
            
            if (module) {
                const imageItem = currentSprite.getImage(module.imageId);
                if (imageItem && imageItem.modulesList[module.imageModuleId]) {
                    const rectModule = imageItem.modulesList[module.imageModuleId];
                    let origWidth = rectModule.width;
                    let origHeight = rectModule.height;
                    
                    // 应用变换后的尺寸
                    if (fm.flag & 4) { // 90度旋转
                        [origWidth, origHeight] = [origHeight, origWidth];
                    }
                    
                    const width = parseInt(document.getElementById('module-width').value) || origWidth;
                    const height = parseInt(document.getElementById('module-height').value) || origHeight;
                    
                    // 创建缩放命令
                    const command = new TransformFmCommand(fm, fm.x, fm.y, fm.flag);
                    
                    // 计算缩放比例
                    const scaleX = width / origWidth;
                    // const scaleY = height / origHeight;
                    
                    // 保存缩放比例到frameModule对象，以便在draw时使用
                    if (!fm.scale) fm.scale = 1;
                    fm.scale = scaleX;
                    
                    CommandManager.instance.addCommand(command);
                    renderCanvas(15);
                    updateModuleProperties(fm);
                }
            }
        }
        
        // 检查图片在动作帧中的使用情况
        function checkImageUsage(imageId) {
            const usageInfo = [];
            
            if (!currentSprite) return usageInfo;
            
            // 遍历所有动作
            currentSprite.mAnimList.forEach((anim, animIndex) => {
                // 遍历所有动画帧
                anim.aframeList.forEach((aframe, frameIndex) => {
                    const frame = aframe.frame;
                    // 检查帧中是否使用了该图片的模块
                    const usesImage = frame.fmList.some(fm => 
                        fm.module && fm.module.imageId === imageId
                    );
                    
                    if (usesImage) {
                        usageInfo.push({
                            animName: anim.name,
                            animIndex: animIndex,
                            frameIndex: frameIndex
                        });
                    }
                });
            });
            
            return usageInfo;
        }
        
        // 删除图片功能
        function deleteImage(imageItem) {
            // 检查图片是否在动作帧中被使用
            const usageInfo = checkImageUsage(imageItem.id);
            
            // 如果有使用，提示用户
            if (usageInfo.length > 0) {
                let message = '该图片在以下动作帧中被使用：\n';
                usageInfo.forEach(info => {
                    message += `- 动作 ${info.animName} (第 ${info.frameIndex + 1} 帧)\n`;
                });
                message += '删除后，这些帧中使用该图片的模块也将被删除。\n确认要删除吗？';
                
                if (!confirm(message)) {
                    return; // 用户取消删除
                }
                
                // 删除所有使用该图片的帧模块
                usageInfo.forEach(info => {
                    const anim = currentSprite.mAnimList[info.animIndex];
                    const aframe = anim.aframeList[info.frameIndex];
                    const frame = aframe.frame;
                    
                    // 过滤掉使用该图片的模块
                    frame.fmList = frame.fmList.filter(fm => 
                        !fm.module || fm.module.imageId !== imageItem.id
                    );
                });
            }
            
            // 从角色中删除图片
            const imageIndex = currentSprite.m_imageList.findIndex(img => img.id === imageItem.id);
            if (imageIndex !== -1) {
                currentSprite.m_imageList.splice(imageIndex, 1);
            }
            
            // 从图像管理器中删除图片
            imageManager.removeImage(imageItem.id);
            
            // 如果删除的是当前选中的图片，重置当前图片
            if (currentImageId === imageItem.id) {
                currentImageId = null;
                currentImage = null;
                
                // 清空画布
                imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
                renderModulesList(); // 清空模块列表

            }
            
            // 重新渲染图片列表
            renderImagesList();
            
            // 如果当前在动作编辑模式，也需要重新渲染动画画布
            if (currentTab === 'animation' && currentFrame) {
                renderCanvas();
            }
        }
        
        // 替换图片功能
        function replaceImage(imageItem) {
            // 创建文件选择对话框
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    const newImage = new Image();
                    newImage.onload = function() {
                        // 检查新图片尺寸是否与原图片一致
                        if (newImage.width !== imageItem.image.width || 
                            newImage.height !== imageItem.image.height) {
                            alert(`新图片尺寸 (${newImage.width}x${newImage.height}) 必须与原图片尺寸 (${imageItem.image.width}x${imageItem.image.height}) 一致，否则会出现未知错误。`);
                            return;
                        }
                        
                        // 替换图片，但保持模块不变
                        imageItem.image = newImage;
                        imageItem.src = event.target.result;
                        
                        // 如果替换的是当前选中的图片，重新绘制
                        if (currentImageId === imageItem.id) {
                            currentImage = newImage;
                            drawCurrentImage();
                        }
                        
                        // 重新渲染图片列表
                        renderImagesList();
                        
                        // 如果当前在动作编辑模式，也需要重新渲染动画画布
                        if (currentTab === 'animation' && currentFrame) {
                            renderCanvas();
                        }
                    };
                    newImage.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };
            
            // 触发文件选择对话框
            fileInput.click();
        }
        
        // 渲染角色列表
        function renderSpriteList() {
            const spriteListEl = document.getElementById('sprite-list');
            spriteListEl.innerHTML = '';
            
            currentProject.m_spriteList.forEach((sprite, index) => {
                const li = document.createElement('li');
                li.textContent = sprite.name;
                if (currentSprite === sprite) {
                    li.classList.add('active');
                }
                li.addEventListener('click', () => {
                    selectSprite(index);
                });
                spriteListEl.appendChild(li);
            });
        }
        
        // 渲染动作列表
        function renderAnimList() {
            const animListEl = document.getElementById('anim-list');
            animListEl.innerHTML = '';
            
            if (!currentSprite) return;
            
            currentSprite.mAnimList.forEach((anim, index) => {
                const li = document.createElement('li');
                li.className = 'anim-item' + (currentAnim === anim ? ' active' : '');
                
                // 动画名称
                const nameSpan = document.createElement('span');
                nameSpan.className = 'anim-name';
                nameSpan.textContent = anim.name;
                nameSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectAnim(index);
                });
                
                // 操作按钮容器
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'anim-actions';
                
                // 复制按钮
                const copyBtn = document.createElement('button');
                copyBtn.className = 'anim-action-btn';
                copyBtn.textContent = '复制';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        copyAnimation();
                    } else {
                        selectAnim(index);
                        setTimeout(copyAnimation, 100);
                    }
                });
                actionsDiv.appendChild(copyBtn);
                
                // 重命名按钮
                const renameBtn = document.createElement('button');
                renameBtn.className = 'anim-action-btn';
                renameBtn.textContent = '重命名';
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        renameAnimation();
                    } else {
                        selectAnim(index);
                        setTimeout(renameAnimation, 100);
                    }
                });
                
                // 上移按钮
                const upBtn = document.createElement('button');
                upBtn.className = 'anim-action-btn';
                upBtn.textContent = '上移';
                upBtn.disabled = index === 0;
                upBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        moveAnimationUp();
                    } else {
                        selectAnim(index);
                        setTimeout(moveAnimationUp, 100);
                    }
                });
                
                // 下移按钮
                const downBtn = document.createElement('button');
                downBtn.className = 'anim-action-btn';
                downBtn.textContent = '下移';
                downBtn.disabled = index === currentSprite.mAnimList.length - 1;
                downBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        moveAnimationDown();
                    } else {
                        selectAnim(index);
                        setTimeout(moveAnimationDown, 100);
                    }
                });
                
                // 置顶按钮
                const topBtn = document.createElement('button');
                topBtn.className = 'anim-action-btn';
                topBtn.textContent = '置顶';
                topBtn.disabled = index === 0;
                topBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        moveAnimationToTop();
                    } else {
                        selectAnim(index);
                        setTimeout(moveAnimationToTop, 100);
                    }
                });
                
                // 置底按钮
                const bottomBtn = document.createElement('button');
                bottomBtn.className = 'anim-action-btn';
                bottomBtn.textContent = '置底';
                bottomBtn.disabled = index === currentSprite.mAnimList.length - 1;
                bottomBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        moveAnimationToBottom();
                    } else {
                        selectAnim(index);
                        setTimeout(moveAnimationToBottom, 100);
                    }
                });
                
                // 创建删除按钮
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'anim-action-btn';
                deleteBtn.textContent = '删除';
                deleteBtn.style.backgroundColor = '#ff6b6b'; // 红色背景
                deleteBtn.style.color = 'white';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAnim === anim) {
                        deleteAnimation();
                    } else {
                        selectAnim(index);
                        setTimeout(deleteAnimation, 100);
                    }
                });
                
                // 添加按钮到容器
                actionsDiv.appendChild(renameBtn);
                actionsDiv.appendChild(deleteBtn);
                
                // 添加元素到li
                li.appendChild(nameSpan);
                li.appendChild(actionsDiv);
                
                animListEl.appendChild(li);
            });
        }
        
        // 渲染时间轴
        function renderTimeline() {
            const timelineEl = document.getElementById('timeline');
            timelineEl.innerHTML = '';
            
            if (!currentAnim) return;
            
            // 允许拖放操作
            timelineEl.setAttribute('ondragover', 'event.preventDefault()');
            timelineEl.setAttribute('ondrop', 'handleTimelineDrop(event)');
            
            currentAnim.aframeList.forEach((animFrame, index) => {
                const frameEl = document.createElement('div');
                frameEl.className = 'timeline-frame' + (index === currentFrameIndex ? ' active' : '');
                if (animFrame.KeyFrameState) {
                    frameEl.classList.add('keyframe');
                }
                frameEl.textContent = index + 1;
                
                // 添加拖拽属性和事件监听
                frameEl.setAttribute('draggable', 'true');
                frameEl.setAttribute('data-index', index);
                frameEl.setAttribute('ondragstart', 'handleFrameDragStart(event)');
                frameEl.setAttribute('ondragend', 'handleFrameDragEnd(event)');
                frameEl.setAttribute('ondragover', 'event.preventDefault()');
                frameEl.setAttribute('ondrop', 'handleFrameDrop(event)');
                frameEl.setAttribute('ondragenter', 'handleFrameDragEnter(event)');
                frameEl.setAttribute('ondragleave', 'handleFrameDragLeave(event)');
                
                frameEl.addEventListener('click', () => {
                    selectFrame(index);
                });
                timelineEl.appendChild(frameEl);
            });
        }
        
        // 处理帧拖拽开始
        let draggedFrameIndex = -1;
        function handleFrameDragStart(event) {
            draggedFrameIndex = parseInt(event.target.getAttribute('data-index'));
            event.dataTransfer.effectAllowed = 'move';
            
            // 设置拖拽时的视觉效果
            event.target.style.opacity = '0.5';
        }
        
        // 处理帧拖拽结束
        function handleFrameDragEnd(event) {
            // 恢复样式
            event.target.style.opacity = '1';
            
            // 清除所有帧的高亮状态
            const frames = document.querySelectorAll('.timeline-frame');
            frames.forEach(frame => {
                frame.style.backgroundColor = '';
            });
        }
        
        // 处理鼠标进入拖拽目标
        function handleFrameDragEnter(event) {
            if (event.target.classList.contains('timeline-frame')) {
                // 添加高亮效果
                event.target.style.backgroundColor = '#e0e0e0';
            }
        }
        
        // 处理鼠标离开拖拽目标
        function handleFrameDragLeave(event) {
            if (event.target.classList.contains('timeline-frame')) {
                // 移除高亮效果
                event.target.style.backgroundColor = '';
            }
        }
        
        // 处理帧拖放
        function handleFrameDrop(event) {
            event.preventDefault();
            
            if (!currentAnim || draggedFrameIndex === -1) return;
            
            // 获取目标帧的索引
            const targetFrame = event.target.closest('.timeline-frame');
            if (!targetFrame) return;
            
            const targetIndex = parseInt(targetFrame.getAttribute('data-index'));
            
            // 如果拖拽到自己身上，不做任何操作
            if (draggedFrameIndex === targetIndex) {
                draggedFrameIndex = -1;
                return;
            }
            
            // 保存被拖拽的帧
            const draggedFrame = currentAnim.aframeList[draggedFrameIndex];
            
            // 从原位置移除
            currentAnim.aframeList.splice(draggedFrameIndex, 1);
            
            // 如果拖拽到原位置前面，插入位置不变
            // 如果拖拽到原位置后面，插入位置减一（因为原位置的元素已经被移除）
            const insertIndex = targetIndex > draggedFrameIndex ? targetIndex : targetIndex;
            
            // 插入到新位置
            currentAnim.aframeList.splice(insertIndex, 0, draggedFrame);
            
            // 更新当前帧索引
            if (currentFrameIndex === draggedFrameIndex) {
                currentFrameIndex = insertIndex;
            } else if (currentFrameIndex > draggedFrameIndex && currentFrameIndex <= insertIndex) {
                currentFrameIndex--;
            } else if (currentFrameIndex < draggedFrameIndex && currentFrameIndex >= insertIndex) {
                currentFrameIndex++;
            }
            
            // 重新选择当前帧
            currentFrame = currentAnim.aframeList[currentFrameIndex].frame;
            
            // 重新渲染时间轴
            renderTimeline();
            
            // 保存项目
            saveProject();
            
            // 重置拖拽状态
            draggedFrameIndex = -1;
        }
        
        // 处理时间轴区域拖放（用于添加新位置）
        function handleTimelineDrop(event) {
            event.preventDefault();
            
            // 这个功能暂时不实现，主要通过拖放帧到其他帧上实现排序
        }
        
        function renderXY() {
            // 先不应用缩放，绘制网格线和坐标轴
            // 如果需要显示网格
            if (showGrid) { 

                ctx.strokeStyle = gridColor;
                ctx.lineWidth = 1; // 线宽固定
                
                // 绘制垂直网格线
                ctx.beginPath();
                for (let x = 0; x <= canvas.width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                }
                ctx.stroke();
                
                // 绘制水平网格线
                ctx.beginPath();    
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                }
                ctx.stroke();
            }
        
            // 绘制X轴和Y轴
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            // X轴
            ctx.beginPath();
            ctx.moveTo(0, m_imageOriginPos.y);
            ctx.lineTo(canvas.width, m_imageOriginPos.y);
            ctx.stroke();
            
            // Y轴
            ctx.beginPath();
            ctx.moveTo(m_imageOriginPos.x, 0);
            ctx.lineTo(m_imageOriginPos.x, canvas.height);
            ctx.stroke();
            
            // 重置线条样式
            ctx.setLineDash([]);
            
            // 绘制原点
            // ctx.fillStyle = 'red';
            // ctx.beginPath();
            // ctx.arc(m_imageOriginPos.x, m_imageOriginPos.y, 4, 0, 2 * Math.PI);
            // ctx.fill();
            
            // 绘制原点十字线
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo((m_imageOriginPos.x) - 8, m_imageOriginPos.y);
            ctx.lineTo((m_imageOriginPos.x) + 8, m_imageOriginPos.y); 
            ctx.moveTo(m_imageOriginPos.x, (m_imageOriginPos.y) - 8);
            ctx.lineTo(m_imageOriginPos.x, (m_imageOriginPos.y) + 8);
            ctx.stroke();
        }

        // 渲染画布
        function renderCanvas(i = -1) {
            if(i !== -1){
                console.log('renderCanvas:',i);
            }
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            renderXY();

 
            if (!currentFrame) {
                // 即使没有当前帧，如果需要显示预览，也要显示
                if (showPreviewWithMouse) {
                    drawMouseFollowPreview(ctx);
                }
                ctx.restore();
                return;
            }

            ctx.restore();
            // 应用缩放
            ctx.save();
            ctx.scale(zoomLevel, zoomLevel);
                
            //     // 获取当前帧
            //     const aframe = currentAnim.aframeList[currentFrameIndex];
            //     // 绘制当前帧
            //     aframe.draw(ctx, currentSprite, m_imageOriginPos.x / zoomLevel, m_imageOriginPos.y / zoomLevel, currentFrameExpressionImg, globalHorizontalMirrorFlag,1,0);// 1 表示应用全局水平镜像

            //表情图片
            let currentFrameExpressionImg = null;
            // console.log('显示表情:',currentSelectedExpression,isShowExpression);
            if (isShowExpression && currentSelectedExpression && currentFrameIndex >= 0 ) {
                // 查找表情对象
                const expression = expressions.find(expr => expr.name === currentSelectedExpression);
                if(expression && currentFrameIndex < expression.images.length){
                    currentFrameExpressionImg = expression.images[currentFrameIndex];
                }
            } 

            //绘制当前帧
            if( currentAnim && currentFrameIndex >= 0 && currentFrameIndex < currentAnim.aframeList.length && currentAnim.aframeList[currentFrameIndex]) {
                // 获取当前帧
                const aframe = currentAnim.aframeList[currentFrameIndex];
                // 绘制当前帧
                aframe.draw(ctx, currentSprite, m_imageOriginPos.x / zoomLevel, m_imageOriginPos.y / zoomLevel, currentFrameExpressionImg, globalHorizontalMirrorFlag,1,0);
            }
            
            // 绘制表情区域矩形框
            if (!isPlaying && isEditingExpressionRect && currentAnim && currentFrameIndex >= 0 && currentAnim.aframeList[currentFrameIndex]) {
                const animFrame = currentAnim.aframeList[currentFrameIndex];
                if (animFrame.expressionRect) {
                    const rect = animFrame.expressionRect;
                    
                    // 绘制表情区域矩形框
                    ctx.strokeStyle = isEditingExpressionRect ? 'purple' : 'blue';
                    ctx.lineWidth = 2 / zoomLevel;
                    ctx.strokeRect(
                        m_imageOriginPos.x / zoomLevel + rect.x, 
                        m_imageOriginPos.y / zoomLevel - rect.y, 
                        rect.width, 
                        rect.height
                    );

                    // 绘制四个角的控制点
                    const points = [
                        { x: m_imageOriginPos.x/zoomLevel + rect.x, y: m_imageOriginPos.y/zoomLevel - rect.y },
                        { x: m_imageOriginPos.x/zoomLevel + rect.x + rect.width, y: m_imageOriginPos.y/zoomLevel - rect.y },
                        { x: m_imageOriginPos.x/zoomLevel + rect.x + rect.width, y: m_imageOriginPos.y/zoomLevel - rect.y + rect.height },
                        { x: m_imageOriginPos.x/zoomLevel + rect.x, y: m_imageOriginPos.y/zoomLevel - rect.y + rect.height }
                    ];
                    
                    ctx.fillStyle = 'purple';
                    points.forEach(point => {
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 4 / zoomLevel, 0, 2 * Math.PI);
                        ctx.fill();
                    });

                }
            }
            
            // 绘制所有选中的模块的选中框
            if (selectedModuleIndices.length > 0 && currentFrame) {
                for (const index of selectedModuleIndices) {
                    const fm = currentFrame.fmList[index];
                    if(!fm) continue;
                    const module = fm.module;
                    if (!module) continue;
                    
                    const imageItem = currentSprite.getImage(module.imageId);
                    if (!imageItem || !imageItem.modulesList[module.imageModuleId]) continue;
                    
                    const rectModule = imageItem.modulesList[module.imageModuleId];
                    let width = rectModule.width;
                    let height = rectModule.height;
                    
                    // 应用缩放
                    if (fm.scale) {
                        width *= fm.scale;
                        height *= fm.scale;
                    }
                    
                    // 应用变换后的尺寸
                    if (fm.flag & 4) { // 90度旋转
                        [width, height] = [height, width];
                    }
                    
                    // 对于非主要选中的模块，使用不同的选中框样式
                    const isMainSelected = index === selectedModuleIndex;
                    const strokeStyle = isMainSelected ? 'blue' : '#666';
                    const lineWidth = isMainSelected ? 2 / zoomLevel : 1 / zoomLevel;
                    
                    // 绘制选中框
                    ctx.strokeStyle = strokeStyle;
                    ctx.lineWidth = lineWidth;
                    ctx.strokeRect(
                        m_imageOriginPos.x / zoomLevel + fm.x - 2 / zoomLevel,
                        m_imageOriginPos.y / zoomLevel - fm.y - 2 / zoomLevel,
                        width + 4 / zoomLevel,
                        height + 4 / zoomLevel
                    );
                    
                    // 只为主选中的模块绘制控制点和旋转控制手柄
                    if (isMainSelected) {
                        // 绘制控制点
                        const points = [
                            { x: m_imageOriginPos.x/zoomLevel + fm.x, y: m_imageOriginPos.y/zoomLevel - fm.y },
                            { x: m_imageOriginPos.x/zoomLevel + fm.x + width, y: m_imageOriginPos.y/zoomLevel - fm.y },
                            { x: m_imageOriginPos.x/zoomLevel + fm.x + width, y: m_imageOriginPos.y/zoomLevel - fm.y + height },
                            { x: m_imageOriginPos.x/zoomLevel + fm.x, y: m_imageOriginPos.y/zoomLevel - fm.y + height }
                        ];
                        
                        ctx.fillStyle = 'blue';
                        points.forEach(point => {
                            ctx.beginPath();
                            ctx.arc(point.x, point.y, 4 / zoomLevel, 0, 2 * Math.PI);
                            ctx.fill();
                        });
                        
                        // 绘制旋转控制点（右下角向外延伸一点）
                        const rotateHandleX = m_imageOriginPos.x/zoomLevel + fm.x + width + 10 / zoomLevel;
                        const rotateHandleY = m_imageOriginPos.y/zoomLevel - fm.y + height;
                        
                        // 绘制旋转控制线
                        ctx.strokeStyle = 'blue';
                        ctx.lineWidth = 1 / zoomLevel;
                        ctx.beginPath();
                        ctx.moveTo(points[2].x, points[2].y);
                        ctx.lineTo(rotateHandleX, rotateHandleY);
                        ctx.stroke();
                        
                        // 绘制旋转控制手柄
                        ctx.fillStyle = 'blue';
                        ctx.beginPath();
                        ctx.arc(rotateHandleX, rotateHandleY, 4 / zoomLevel, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // 绘制坐标信息
                        ctx.fillStyle = 'black';
                        ctx.font = (12 / zoomLevel) + 'px Arial';
                        ctx.fillText(`X: ${Math.round(fm.x)}`, m_imageOriginPos.x / zoomLevel + fm.x + width / 2 + 10 / zoomLevel, m_imageOriginPos.y / zoomLevel - fm.y - height / 2 - 10 / zoomLevel);
                        ctx.fillText(`Y: ${Math.round(fm.y)}`, m_imageOriginPos.x / zoomLevel + fm.x + width / 2 + 10 / zoomLevel, m_imageOriginPos.y / zoomLevel - fm.y - height / 2);
                    }
                }
            }else if(selectedModuleIndex !== -1) {
                // 处理其他模块的点击事件

            }
            
            // 绘制框选矩形
            if (isMarqueeSelecting && currentFrame) {
                const x1 = Math.min(marqueeStartX, marqueeEndX);
                const y1 = Math.min(marqueeStartY, marqueeEndY);
                const x2 = Math.max(marqueeStartX, marqueeEndX);
                const y2 = Math.max(marqueeStartY, marqueeEndY);
                
                // 计算框选矩形在画布中的位置和大小
                const rectX = m_imageOriginPos.x / zoomLevel + x1;
                const rectY = m_imageOriginPos.y / zoomLevel - y1;
                const rectWidth = x2 - x1;
                const rectHeight = y1 - y2; // 注意Y轴方向是向下为负
                
                // 设置虚线样式
                ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel]);
                
                // 绘制框选矩形
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 1 / zoomLevel;
                ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
                
                // 填充半透明区域
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                
                // 重置线条样式
                ctx.setLineDash([]);
            }
            
            // 恢复缩放
            ctx.restore();
            
            // 绘制鼠标跟随预览
            if (showPreviewWithMouse) {
                drawMouseFollowPreview(ctx);
            }
        }
        
        // 选择角色
        function selectSprite(index) {
            if (index < 0 || index >= currentProject.m_spriteList.length) return;
            
            currentSprite = currentProject.m_spriteList[index];
            currentAnim = null;
            currentFrame = null;
            currentFrameIndex = 0;
            selectedModuleIndex = -1;
            selectedModuleIndices = []; // 清空选中的模块列表
            
            // 更新界面
            renderSpriteList();
            renderAnimList();
            renderTimeline();
            renderCanvas(16);
            renderImagesList();

            
            document.getElementById('current-anim-name').textContent = '选择一个动作开始编辑';
        }
        
        // 选择动作
        function selectAnim(index) {
            if (!currentSprite || index < 0 || index >= currentSprite.mAnimList.length) return;
            
            currentAnim = currentSprite.mAnimList[index];
            currentFrame = currentAnim.aframeList.length > 0 ? currentAnim.aframeList[0].frame : null;
            currentFrameIndex = 0;
            selectedModuleIndex = -1;
            selectedModuleIndices = []; // 清空选中的模块列表
            
            // 更新界面
            renderAnimList();
            renderTimeline();
            renderCanvas(17);

            
            document.getElementById('current-anim-name').textContent = currentAnim.name + (currentFrame ? ` - 帧${currentFrameIndex + 1}` : ' - 无帧');
        }
        
        // 选择帧
        function selectFrame(index) {
            if (!currentAnim || index < 0 || index >= currentAnim.aframeList.length) return;
            
            currentFrameIndex = index;
            currentFrame = currentAnim.aframeList[index].frame;
            selectedModuleIndex = -1;
            selectedModuleIndices = []; // 清空选中的模块列表
            
            // 更新界面
            renderTimeline();
            renderCanvas(18);
            
            document.getElementById('current-anim-name').textContent = `${currentAnim.name} - 帧${currentFrameIndex + 1}`;
            
        }
        
        // 切换播放动画
        function togglePlayAnimation() {
            if (!currentAnim || currentAnim.aframeList.length === 0) {
                alert('没有可播放的动画');
                return;
            }
            
            isPlaying = !isPlaying;
            const playButton = document.getElementById('play-animation');
            playButton.textContent = isPlaying ? '暂停' : '播放';
            
            if (isPlaying) {
                lastFrameTime = performance.now();
                playAnimation();
            } else if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        }
        
        // 播放动画
        function playAnimation(timestamp) {
            if (!isPlaying) return;
            
            if (!timestamp) timestamp = performance.now();
            const elapsed = timestamp - lastFrameTime;
            
            if (elapsed >= animationSpeed) {
                lastFrameTime = timestamp;
                
                // 切换到下一帧
                currentFrameIndex = (currentFrameIndex + 1) % currentAnim.aframeList.length;
                currentFrame = currentAnim.aframeList[currentFrameIndex].frame;
                
                // 更新界面
                renderTimeline();
                renderCanvas(19);
                
                document.getElementById('current-anim-name').textContent = `${currentAnim.name} - 帧${currentFrameIndex + 1}`;
            }
            
            animationFrameId = requestAnimationFrame(playAnimation);
        }
        
        let hidDebug = false;
        function showDebugInfo() {
            let debugInfo = document.getElementById('debug-info');
            if (debugInfo) {
                debugInfo.hidden = hidDebug;
                hidDebug = !hidDebug;
                return;
            }
            // 创建调试信息显示区域
            debugInfo = document.createElement('div');
            debugInfo.id = 'debug-info';
            debugInfo.style.cssText = 'position: fixed; bottom: 0; left: 0; width: 100%; height: 150px; background-color: #000; color: #fff; overflow-y: auto; font-size: 12px; z-index: 1000; border-top: 2px solid #333;';
            
            const debugContent = document.createElement('div');
            debugContent.style.padding = '10px';
            
            const debugTitle = document.createElement('h4');
            debugTitle.style.marginTop = '0';
            debugTitle.style.color = '#fff';
            debugTitle.textContent = '控制台调试信息';
            
            const debugLogs = document.createElement('div');
            debugLogs.id = 'debug-logs';
            
            debugContent.appendChild(debugTitle);
            debugContent.appendChild(debugLogs);
            debugInfo.appendChild(debugContent);
            
            document.body.appendChild(debugInfo);
            
            // 重写console.log以同时显示在调试面板
            window.oldConsoleLog = console.log;
            window.oldConsoleWarn = console.warn;
            window.oldConsoleError = console.error;
            
            console.log = function() {
                oldConsoleLog.apply(console, arguments);
                const logEl = document.createElement('div');
                logEl.textContent = 'LOG: ' + Array.from(arguments).join(' ');
                logEl.style.color = '#fff';
                logEl.style.marginBottom = '2px';
                
                // 检查并移除复杂对象的显示
                if (logEl.textContent.includes('{') || logEl.textContent.includes('[')) {
                    try {
                        const parsed = JSON.parse(logEl.textContent.substring(4));
                        logEl.textContent = 'LOG: ' + JSON.stringify(parsed, null, 2);
                    } catch (e) {
                        // 不是有效的JSON，保持原样
                    }
                }
                
                document.getElementById('debug-logs').appendChild(logEl);
                document.getElementById('debug-info').scrollTop = document.getElementById('debug-info').scrollHeight;
            };
            
            console.warn = function() {
                oldConsoleWarn.apply(console, arguments);
                const logEl = document.createElement('div');
                logEl.textContent = 'WARN: ' + Array.from(arguments).join(' ');
                logEl.style.color = '#ffaa00';
                logEl.style.marginBottom = '2px';
                document.getElementById('debug-logs').appendChild(logEl);
                document.getElementById('debug-info').scrollTop = document.getElementById('debug-info').scrollHeight;
            };
            
            console.error = function() {
                oldConsoleError.apply(console, arguments);
                const logEl = document.createElement('div');
                logEl.textContent = 'ERROR: ' + Array.from(arguments).join(' ');
                logEl.style.color = '#ff4444';
                logEl.style.marginBottom = '2px';
                document.getElementById('debug-logs').appendChild(logEl);
                document.getElementById('debug-info').scrollTop = document.getElementById('debug-info').scrollHeight;
            };
            
            console.log('调试面板已初始化');
        }

        // 处理表情区域复选框点击事件
        function handleShowExpressionRectChange() {
            if (!currentAnim || !currentFrame || currentFrameIndex < 0) {
                this.checked = false; // 如果不满足条件，取消选中
                alert('请先选择一个帧');
                return;
            }
            
            // 如果复选框被选中，确保当前帧有expressionRect属性
            if (this.checked) {
                if (!currentAnim.aframeList[currentFrameIndex].expressionRect) {
                    currentAnim.aframeList[currentFrameIndex].expressionRect = {
                        x: 0,
                        y: 0,
                        width: 50,
                        height: 60
                    };
                }
                
                // 进入编辑模式
                isEditingExpressionRect = true;
                
                // 确保不会同时选中其他模块
                selectedModuleIndex = -1;
                selectedModuleIndices = [];
            } else {
                // 退出编辑模式
                isEditingExpressionRect = false;
            }

            renderCanvas();
        }
        

        function handleHorizontalMirrorChange() {
            // 根据复选框状态设置水平镜像标志
            globalHorizontalMirrorFlag = this.checked ? 1 : 0;
            console.log('水平镜像状态变更为:', globalHorizontalMirrorFlag);
            renderCanvas();
        }
        
        // 在switchTab函数中更新复选框状态
        function updateExpressionCheckboxState() {
            const checkbox = document.getElementById('add-expression-rect');
            if (checkbox && currentFrameIndex >= 0) {
                checkbox.checked = isEditingExpressionRect;
            } else if (checkbox) {
                checkbox.checked = false;
            }
        }
        
        // 在现有函数中调用updateExpressionCheckboxState以同步复选框状态
        // 例如在switchTab函数中添加调用
        
        
        
        // 修改selectFrame函数，确保每帧都有expressionRect属性
        const originalSelectFrame = selectFrame;
        selectFrame = function(index) {
            originalSelectFrame(index);
            
            // 确保每帧都有expressionRect属性
            if (currentAnim && currentFrameIndex >= 0 && currentAnim.aframeList[currentFrameIndex]) {
                if (!currentAnim.aframeList[currentFrameIndex].expressionRect) {
                    currentAnim.aframeList[currentFrameIndex].expressionRect = {
                        x: 0,
                        y: 0,
                        width: 50,
                        height: 60
                    };
                }
            }
        };
        

        
        // 选项卡切换功能
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化选项卡切换
            const tabAnimationControlBtn = document.getElementById('tab-animation-control');//btn
            const tabExpressionBtn = document.getElementById('tab-expression-list');//btn
            const tabContentAnimation = document.getElementById('animation-control-section');
            const tabContentExpression = document.getElementById('expression-list-section');
            
            if (tabAnimationControlBtn && tabExpressionBtn && tabContentAnimation && tabContentExpression) {
                // 切换到图片控制选项卡
                tabAnimationControlBtn.addEventListener('click', function() {
                    // 激活当前选项卡，取消激活其他选项卡
                    tabAnimationControlBtn.classList.add('active');
                    tabExpressionBtn.classList.remove('active');
                    
                    // 显示当前选项卡内容，隐藏其他内容
                    // tabContentAnimation.classList.add('active');
                    // tabContentExpression.classList.remove('active');
                    tabContentAnimation.style.display = 'flex';
                    tabContentExpression.style.display = 'none';
                    
                    // 清除图片模块编辑的框选模块操作与编辑模块操作
                    if (isMultiDragging) {
                        isMultiDragging = false;
                    }
                    if (dragStartModuleStates.length > 0) {
                        dragStartModuleStates = [];
                    }
                });
                
                // 切换到表情列表选项卡
                tabExpressionBtn.addEventListener('click', function() {
                    // 激活当前选项卡，取消激活其他选项卡
                    tabExpressionBtn.classList.add('active');
                    tabAnimationControlBtn.classList.remove('active');
                    
                    // 显示当前选项卡内容，隐藏其他内容
                    // tabContentExpression.classList.add('active');
                    // tabContentAnimation.classList.remove('active');
                    tabContentAnimation.style.display = 'none';
                    tabContentExpression.style.display = 'flex';
                    
                    
                    // 初始化表情列表
                    initExpressionList();
                    // 初始化分组按钮事件监听
                    initExpressionGroupButtons();
                });
            }
        });
        
        // 全局变量：当前选中的表情
        let currentSelectedExpression = null;
        // 当前选中的表情分组
        let currentExpressionGroup = 'all'; // 'all', 'common', 'male', 'female'
        
        // 初始化分组按钮事件监听
        function initExpressionGroupButtons() {
            const groupButtons = document.querySelectorAll('#expression-group-buttons .tab-button');
            groupButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // 移除所有按钮的选中状态
                    groupButtons.forEach(btn => btn.classList.remove('active'));
                    // 添加当前按钮的选中状态
                    this.classList.add('active');
                    // 更新当前选中的分组
                    currentExpressionGroup = this.dataset.group;
                    // 重新初始化表情列表
                    initExpressionList();
                });
            });
        }
        
        // 初始化表情列表
        function initExpressionList() {
            const expressionListContainer = document.getElementById('expression-list-container');
            if (!expressionListContainer) return;
            
            // 清空容器
            expressionListContainer.innerHTML = '';
            
            // 获取已加载的表情数据
            if (!expressions || expressions.length === 0) {
                console.log('没有加载到表情数据',window.expressions,expressions);
                return;
            }            // 创建表情网格容器
            const expressionGrid = document.createElement('div');
            expressionGrid.className = 'expression-grid';
            
            // 根据当前选中的分组筛选表情
            let filteredExpressions = [];
            switch (currentExpressionGroup) {
                case 'all':
                    filteredExpressions = expressions;
                    break;
                case 'common':
                    filteredExpressions = expressions.filter(expr => expr.type === 0);
                    break;
                case 'male':
                    filteredExpressions = expressions.filter(expr => expr.type === 1);
                    break;
                case 'female':
                    filteredExpressions = expressions.filter(expr => expr.type === 2);
                    break;
            }
            
            // 如果筛选后没有表情，显示提示信息
            if (filteredExpressions.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.padding = '20px';
                emptyMessage.style.color = '#666';
                emptyMessage.textContent = '当前分组没有表情';
                expressionGrid.appendChild(emptyMessage);
            } else {
                // 创建表情列表项
                filteredExpressions.forEach(expression => {
                    const expressionItem = document.createElement('div');
                    expressionItem.className = `expression-item ${currentSelectedExpression === expression.name ? 'selected' : ''}`;
                    expressionItem.dataset.expressionId = expression.name;
                    
                    // 创建表情图片
                    const expressionImage = document.createElement('img');
                    expressionImage.className = 'expression-image';
                    expressionImage.src = expression.imageUrls[0]; // 使用第一张图片
                    expressionImage.alt = expression.name;
                    expressionImage.onerror = function() {
                        // 如果图片加载失败，显示默认样式
                        this.style.display = 'none';
                        const defaultDiv = document.createElement('div');
                        defaultDiv.style.width = '60px';
                        defaultDiv.style.height = '60px';
                        defaultDiv.style.backgroundColor = '#f0f0f0';
                        defaultDiv.style.margin = '0 auto 5px';
                        defaultDiv.style.borderRadius = '4px';
                        defaultDiv.style.display = 'flex';
                        defaultDiv.style.alignItems = 'center';
                        defaultDiv.style.justifyContent = 'center';
                        defaultDiv.textContent = expression.name;
                        this.parentNode.appendChild(defaultDiv);
                    };
                    
                    // 创建表情名称
                    const expressionName = document.createElement('div');
                    expressionName.textContent = expression.name;
                    expressionName.style.fontSize = '12px';
                    
                    // 添加到表情项
                    expressionItem.appendChild(expressionImage);
                    expressionItem.appendChild(expressionName);
                    
                    // 添加点击事件
                    expressionItem.addEventListener('click', function() {
                        // 移除其他选中项的选中状态
                        document.querySelectorAll('.expression-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        
                        // 添加当前项的选中状态
                        this.classList.add('selected');
                        
                        // 保存选中的表情到全局变量
                        currentSelectedExpression = expression.name;
                        
                        console.log(`已选择表情: ${expression.name}`);
                        
                        // 重新渲染画布，将表情绘制到当前帧
                        renderCanvas(20);
                    });
                    
                    // 添加到表情网格
                    expressionGrid.appendChild(expressionItem);
                });
            }
            
            // 添加表情网格到容器
            expressionListContainer.appendChild(expressionGrid);
        }
        
        // 在渲染当前帧时绘制表情
        function drawFrameExpression() {
            if (!currentAnim || !currentFrameIndex || currentFrameIndex < 0 || !currentAnim.aframeList[currentFrameIndex]) {
                return;
            }
            
            // 获取当前帧
            const aframe = currentAnim.aframeList[currentFrameIndex];
            
            // 获取表情区域
            const expressionRect = aframe.expressionRect;
            
            // 检查表情区域是否有效
            if (!expressionRect || !expressionRect.x || !expressionRect.y || !expressionRect.width || !expressionRect.height) {
                return;
            }
            
            // 检查是否有选中的表情
            if (!currentSelectedExpression || !expressions) {
                return;
            }
            
            // 查找表情对象
            const expression = expressions.find(expr => expr.name === currentSelectedExpression);
            if (!expression || !expression.imageUrls || expression.imageUrls.length === 0) {
                // 如果找不到表情，绘制简单的方块代替
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(expressionRect.x, expressionRect.y, expressionRect.width, expressionRect.height);
                
                // 绘制表情名称
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(currentSelectedExpression, expressionRect.x + expressionRect.width / 2, expressionRect.y + expressionRect.height / 2);
                return;
            }
            
            // 尝试使用表情图片
            const expressionImage = new Image();
            expressionImage.src = expression.imageUrls[0]; // 使用第一张图片
            
            // 图片加载完成后绘制
            expressionImage.onload = function() {
                // 创建一个临时canvas来绘制表情图片
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                // 设置临时canvas尺寸
                tempCanvas.width = expressionRect.width;
                tempCanvas.height = expressionRect.height;
                
                // 绘制表情图片到临时canvas
                tempCtx.drawImage(expressionImage, 0, 0, expressionRect.width, expressionRect.height);
                
                // 将临时canvas的内容绘制到主canvas
                ctx.drawImage(tempCanvas, expressionRect.x, expressionRect.y);
            };
            
            // 如果图片加载失败，绘制简单的方块
            expressionImage.onerror = function() {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(expressionRect.x, expressionRect.y, expressionRect.width, expressionRect.height);
                
                // 绘制表情名称
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(currentSelectedExpression, expressionRect.x + expressionRect.width / 2, expressionRect.y + expressionRect.height / 2);
            };
        }