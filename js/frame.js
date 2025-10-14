// 帧类定义
class Frame {
    constructor() {
        this.fmList = []; // 存储FrameModule对象
    }
    
    // 添加模块
    addModule(module) {
        this.fmList.push(module);
    }

    draw(ctx, sprite, originX, originY, globalFlag = 0, globalScale = 1,globalAngle=0) {
        this.fmList.forEach(fm => {
            fm.draw(ctx, sprite, originX, originY, globalFlag, globalScale,globalAngle);
        });
    }
    
    clone() {
        const newFrame = new Frame();
        this.fmList.forEach(fm => {
            newFrame.fmList.push(fm.clone());
        });
        return newFrame;
    }
}

// 动画帧类定义
class AnimFrame {

    constructor(frame, keyFrameState = false, expressionRect = {x:0,y:0,width:50,height:60}, expressionFlag = 0) {
        this.frame = frame;
        this.KeyFrameState = keyFrameState;
        this.expressionRect = expressionRect;
        this.expressionFlag = expressionFlag;
    }


    draw(ctx, sprite, originX, originY, expressionImg = null, globalFlag = 0, globalScale = 1,globalAngle=0) {
        // console.log('globalScale',globalScale)
        this.frame.draw(ctx, sprite, originX, originY, globalFlag,globalScale,globalAngle);

        if(this.expressionRect && expressionImg) {
            if (!expressionImg || !expressionImg.complete) return;
            const rotateOrigin = { x:originX,y:originY};
            const config = {
                source: { x: 0, y: 0, width: expressionImg.width, height: expressionImg.height },
                drawPosition: { x: this.expressionRect.x, y: -this.expressionRect.y, width: this.expressionRect.width, height: this.expressionRect.height },  // 相对于旋转原点的位置
                flipX: false,
                flipY: false,  // 自身垂直翻转
                selfRotate: 0, // 自身旋转角度（弧度）默认表情无旋转
                color: 'blue',
                drawInfo: false,
            };
            DrawApi.drawAPI(ctx,rotateOrigin,config,expressionImg,globalFlag===1,globalScale,globalAngle);
        }

        // config.drawInfo=true;
        const drawInfo = false;
        if(drawInfo===true){
            // 绘制辅助边框（基于绘制宽高）
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(originX-50, originY-50, 100, 100);
        }


        // 标记自身中心点（基于绘制宽高）导出视频时不应该绘制
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(
            originX,  // 绘制区域中心点X
            originY, // 绘制区域中心点Y
            3, 0, 2 * Math.PI
        );
        ctx.fill();
    }

    draw2(ctx, sprite, originX, originY, expressionImg = null, globalFlag = 0, globalScale = 1,globalAngle=0) {
        // console.log('globalScale',globalScale)
        this.frame.draw(ctx, sprite, originX, originY, globalFlag,globalScale,globalAngle);

        if(this.expressionRect && expressionImg) {
            // 保存当前的变换状态
            ctx.save();
            
            let drawX = this.expressionRect.x;
            let drawY = this.expressionRect.y;
            let drawWidth = this.expressionRect.width;
            let drawHeight = this.expressionRect.height;
            
            // 计算相对于旋转原点的位置
            // 注意：这里需要考虑Y轴的转换
            const relativeX = drawX;
            const relativeY = -drawY; // 考虑Y轴的转换
            
            // 1. 平移到旋转原点（Canvas中心）
            ctx.translate(originX, originY);
            
            // 2. 应用全局水平镜像（基于旋转原点）
            const isGlobalFlipped = (globalFlag & 1) !== 0;
            const globalScaleX = isGlobalFlipped ? -1 : 1;
            ctx.scale(globalScaleX, 1);
            
            // 3. 应用全局缩放
            
            ctx.scale(globalScale, globalScale);
            
            // 4. 应用旋转（共享角度）
            if(globalAngle !== 0) {
                const rotateRad = globalAngle * Math.PI / 180;
                ctx.rotate(rotateRad);//globalAngle
            }
            
            // 5. 平移到配置项的相对位置
            ctx.translate(relativeX, relativeY);
            
            // 6. 自身水平翻转（基于自身中心点）
            const isModuleFlippedX = (this.expressionFlag & 1) !== 0;
            if (isModuleFlippedX) {
                // 先平移到自身中心点
                ctx.translate(drawWidth / 2, drawHeight / 2);
                // 水平翻转
                ctx.scale(-1, 1);
                // 平移回原位置
                ctx.translate(-drawWidth / 2, -drawHeight / 2);
            }
            
            // 7. 自身垂直翻转（基于自身中心点）
            const isModuleFlippedY = (this.expressionFlag & 2) !== 0;
            if (isModuleFlippedY) {
                ctx.translate(drawWidth / 2, drawHeight / 2);
                ctx.scale(1, -1);  // Y轴缩放为-1实现垂直翻转
                ctx.translate(-drawWidth / 2, -drawHeight / 2);
            }
            
            // 8. 绘制图片
            ctx.drawImage(
                expressionImg,
                0, 0, expressionImg.width, expressionImg.height,
                0, 0, drawWidth, drawHeight
            );
            
            // 9. 恢复之前的变换状态
            ctx.restore();
        }

    }

    // 添加模块
    addModule(module) {
        this.frame.addModule(module);
    }
}

class Expression {
    constructor(id,name,type,imageUrls) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.imageUrls = imageUrls;
        this.images = [];
        this.loadImages();
    }

    loadImages() {
        this.imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
            this.images.push(img);
        });
    }

    getFrame(index) {
        return this.images[index];
    }
}