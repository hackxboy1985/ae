
// 上传图片
function uploadImage() {
    const fileInput = document.getElementById('modal-image-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('请选择一张图片');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        const imageId = Date.now().toString();
        const imageName = file.name;
        
        ////////////////////////////////////
        //TODO: 要增加上传OSS的逻辑，并返回url
        ////////////////////////////////////

        console.log('imageUrl',imageUrl,imageName);
        // 创建图片项
        const imageItem = new ImageItem(imageId, imageUrl, imageName);
        
        // 添加到角色和图像管理器
        if (currentSprite) {
            currentSprite.addImage(imageItem);
        }
        imageManager.addImage(imageItem);
        
        // 设置当前图片
        currentImage = imageItem.image;
        currentImageId = imageId;
        
        // 绘制图片到画布
        currentImage.onload = function() {
            // 调整画布大小以适应图片
            imageCanvas.width = currentImage.width;
            imageCanvas.height = currentImage.height;
            
            // 重置缩放
            zoomLevel = 1;
            updateZoomLevel();
            

            // 绘制图片
            drawCurrentImage();
            
            // 清空之前的模块
            if (currentSprite && currentImageId) {
                const imageItem = currentSprite.getImage(currentImageId);
                if (imageItem) {
                    imageItem.modulesList = [];
                }
            }
            
            renderModulesList();
            renderImagesList();
        };
    };
    
    reader.readAsDataURL(file);
    hideUploadImageModal();
}

// 加载表情数据
function loadExpression() {
    // 使用mock数据模拟API返回
    const mockExpressions = [
        {
            name: "普通1",
            type: 0,//0是通用表情、1是男专用，2是女专用
            imageUrls: ["https://mints-web.oss-cn-beijing.aliyuncs.com/sdtool/express/n1.png", "https://mints-web.oss-cn-beijing.aliyuncs.com/sdtool/express/n2.png"]
        },
        {
            name: "普通2",
            type: 0,//0是通用表情、1是男专用，2是女专用
            imageUrls: ["https://mints-web.oss-cn-beijing.aliyuncs.com/sdtool/express/n3.png", "https://mints-web.oss-cn-beijing.aliyuncs.com/sdtool/express/n4.png"]
        },
        {
            name: "开心",
            type: 0,//0是通用表情、1是男专用，2是女专用
            imageUrls: ["https://mints-web.oss-cn-beijing.aliyuncs.com/sdtool/express/happy1.png", "https://mints-web.oss-cn-beijing.aliyuncs.com/sdtool/express/happy2.png"]
        }
    ];
    
    // 创建Expression对象
    mockExpressions.forEach(exprData => {
        const expression = new Expression(exprData.name,exprData.type, exprData.imageUrls);
        expressions.push(expression);
    });
    
    console.log('表情数据已加载:', expressions);
    // 这里可以添加UI来展示加载的表情
}

// 新建项目函数
function newProject() {

    // 清空所有数据
    imageManager.clearImages();
    // expressions = [];
    currentProject = new Avatar();
    imageManager = currentProject.imageManager;
    currentSprite = null;
    currentAnim = null;

    currentImage = null;
    currentImageId = null;
    renderAfterInit();

    // 重置UI
    // renderAnimList();
    // // 重置帧
    // renderTimeline();
    // renderImagesList();
    // renderModulesList();
    // renderExpressionsList();
    showNewSpriteModal();

}

// 保存项目函数
function saveProject() {
    try {
        // 准备项目数据进行保存
        const avatarData = {
            // 保存所有图片数据（包括Base64编码的图片）
            images: Array.from(currentProject.imageManager.m_imageMap.entries()).map(([id, imageItem]) => ({
                id: imageItem.id,
                name: imageItem.name,
                src: imageItem.src,
                modulesList: imageItem.modulesList
            })),
            // 保存项目的角色、动作、帧等数据
            project: {
                m_spriteList: currentProject.m_spriteList.map(sprite => ({
                    name: sprite.name,
                    mAnimList: sprite.mAnimList.map(anim => ({
                        name: anim.name,
                        aframeList: anim.aframeList.map(aframe => ({
                            KeyFrameState: aframe.KeyFrameState,
                            frame: {
                                fmList: aframe.frame.fmList.map(fm => ({
                                    module: fm.module,
                                    x: fm.x,
                                    y: fm.y,
                                    flag: fm.flag,
                                    angle: fm.angle,
                                }))
                            },
                            // 保存表情区域数据
                            expressionRect: aframe.expressionRect
                        }))
                    }))
                }))
            }
        };
        // console.log('avatarData', JSON.stringify(avatarData));
        // 使用localStorage保存项目数据
        localStorage.setItem('animationEditorProject', JSON.stringify(avatarData));
        
        // alert('项目保存成功！');
        notification('项目保存成功！');
    } catch (error) {
        console.error('保存项目失败:', error);
        alert('保存项目失败，请检查网络后，重新尝试，请勿刷新页面，否则数据可能丢失。可先选择本地保存，稍后再尝试同步。');
    }
}

// 加载项目函数
function loadProject(callback) {
    try {
        const savedData = localStorage.getItem('animationEditorProject');
        if (!savedData) {
            console.log('没有找到保存的项目数据');
            return false;
        }
        // 重建项目、角色、动作、帧等数据
        currentProject = new Avatar();
        imageManager = currentProject.imageManager;
        const avatarData = JSON.parse(savedData);
        // console.log('load projectData', projectData);
        // 重建图像管理器和所有图片

        
        
        setTimeout(() => {
            avatarData.images.forEach(savedImage => {
                const imageItem = new ImageItem(savedImage.id, savedImage.src, savedImage.name);
                imageItem.modulesList = savedImage.modulesList || [];
                imageManager.addImage(imageItem);
            });
            

            avatarData.project.m_spriteList.forEach(savedSprite => {
                const sprite = new Sprite(savedSprite.name);
                currentProject.addSprite(sprite);
                
                // 为角色添加图片引用
                avatarData.images.forEach(savedImage => {
                    const imageItem = imageManager.getImage(savedImage.id);
                    if (imageItem) {
                        sprite.addImage(imageItem);
                    }
                });
                
                // 重建动作
                savedSprite.mAnimList.forEach(savedAnim => {
                    const anim = new Anim(savedAnim.name);
                    sprite.mAnimList.push(anim);
                    
                    // 重建动画帧
                    savedAnim.aframeList.forEach(savedAFrame => {
                        const frame = new Frame();
                        frame.fmList = savedAFrame.frame.fmList.map(savedFm => {
                            const fm = new FrameModule(savedFm.module, savedFm.x, savedFm.y, savedFm.flag);
                            return fm;
                        });
                        const aframe = new AnimFrame(frame, savedAFrame.KeyFrameState);
                        
                        // 恢复表情区域数据
                        if (savedAFrame.expressionRect) {
                            aframe.expressionRect = savedAFrame.expressionRect;
                        }
                        
                        anim.aframeList.push(aframe);
                    });
                });
            });
            
            // 选择默认的角色和动作
            if (currentProject.m_spriteList.length > 0) {
                currentSprite = currentProject.m_spriteList[0];
                if (currentSprite.mAnimList.length > 0) {
                    currentAnim = currentSprite.mAnimList[0];
                    if (currentAnim.aframeList.length > 0) {
                        currentFrame = currentAnim.aframeList[0].frame;
                    }
                }
            }

            
            console.log('项目异步加载成功！');
            callback(true);
        }, 500);

        // console.log('项目加载成功！');
        // renderCanvas(0);
        return true;
    } catch (error) {
        console.error('加载项目失败:', error);
        alert('加载项目失败，请尝试重新创建项目。');
        return false;
    }

}

