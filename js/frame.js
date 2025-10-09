// 帧类定义
class Frame {
    constructor() {
        this.fmList = []; // 存储FrameModule对象
    }
    
    // 添加模块
    addModule(module) {
        this.fmList.push(module);
    }

    draw(ctx, sprite, originX, originY, globalFlag = 0) {

        this.fmList.forEach(fm => {
            fm.draw(ctx, sprite, originX, originY, globalFlag);
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

    draw(ctx, sprite, originX, originY, expressionImg = null, globalFlag = 0) {
        this.frame.draw(ctx, sprite, originX, originY, globalFlag);

        if(this.expressionRect && expressionImg) {
            ctx.save();
            // console.log('draw Image');
            // 移动到原点 - 与ActionEditor相同的原点逻辑
        
            // 2. 平移坐标系到图片中心（关键：所有变换围绕中心进行）
            const centerX = originX + this.expressionRect.x + this.expressionRect.width / 2;
            const centerY = originY - this.expressionRect.y - this.expressionRect.height / 2; //-y是因为坐标系统不同  
            ctx.translate(centerX, centerY);

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
                - this.expressionRect.width / 2,  // 相对于中心的X坐标
                - this.expressionRect.height / 2, // 相对于中心的Y坐标
                this.expressionRect.width, this.expressionRect.height
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