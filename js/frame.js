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
            ctx.save();
            // console.log('draw Image');
            // 移动到原点 - 与ActionEditor相同的原点逻辑
        
            let drawX = this.expressionRect.x  * globalScale;
            let drawY = this.expressionRect.y  * globalScale;
            let drawWidth = this.expressionRect.width * globalScale;
            let drawHeight = this.expressionRect.height * globalScale;

            // 2. 平移坐标系到图片中心（关键：所有变换围绕中心进行）
            const centerX = originX + drawX + drawWidth / 2;
            const centerY = originY - drawY + drawHeight / 2; //-y是因为坐标系统不同，绘制时要换算成左上角原点坐标系
            if(globalFlag & 1){ //水平镜像
                const centerX_FlipY = originX - (drawX + drawWidth / 2);
                console.log('原点x:',originX,'drawX:',drawX,'width/2:',drawWidth/2,'算出的centerX:',centerX,'水平镜像的X',centerX_FlipY);
                ctx.translate(centerX_FlipY, centerY);
            }else{
                ctx.translate(centerX, centerY);
            }
            // 3. 应用旋转
            // if(globalAngle !== 0) {
            //     ctx.rotate(globalAngle);
            // }

            // 4. 应用翻转（结合模块翻转和全局翻转参数）
            if(this.expressionFlag != 0 || globalFlag != 0){
                // 计算水平翻转状态：如果模块和全局参数中奇数个设置了水平翻转(bit 0)，最终就是翻转
                const isHorizontalFlip = ((this.expressionFlag & 1) !== 0) !== ((globalFlag & 1) !== 0);
                // 计算垂直翻转状态：如果模块和全局参数中奇数个设置了垂直翻转(bit 1)，最终就是翻转
                const isVerticalFlip = ((this.expressionFlag & 2) !== 0) !== ((globalFlag & 2) !== 0);
                
                const scaleX = isHorizontalFlip ? -1 : 1;
                const scaleY = isVerticalFlip ? -1 : 1;
                console.log(this.expressionFlag,globalFlag,isHorizontalFlip,isVerticalFlip,scaleX,scaleY)
                ctx.scale(scaleX, scaleY);
            }


            // console.log('expression centerX',centerX, centerY);
            // ctx.drawImage(expressionImg,0,0,expressionRect.width,expressionRect.height);
            ctx.drawImage(expressionImg,0,0,expressionImg.width,expressionImg.height
                ,
                - drawWidth / 2,  // 相对于中心的X坐标
                - drawHeight / 2, // 相对于中心的Y坐标
                drawWidth, drawHeight
            );

            ctx.restore();
        }

    }

    // 添加模块
    addModule(module) {
        this.frame.addModule(module);
    }
}

class Expression {
    constructor(name,imageUrls) {
        this.name = name;
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
}