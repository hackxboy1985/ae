// 帧类定义
class Frame {
    constructor() {
        this.fmList = []; // 存储FrameModule对象
    }
    
    // 添加模块
    addModule(module) {
        this.fmList.push(module);
    }

    draw(ctx, sprite, originX, originY,expressionRect = null,expressionImg = null) {
        this.fmList.forEach(fm => {
            fm.draw(ctx, sprite, originX, originY,expressionRect);
        });
        
        if(expressionRect && expressionImg) {
            ctx.save();
            console.log('draw Image');
            // 移动到原点 - 与ActionEditor相同的原点逻辑
        
            // 2. 平移坐标系到图片中心（关键：所有变换围绕中心进行）
            const centerX = originX + expressionRect.x + expressionRect.width / 2;
            const centerY = originY - expressionRect.y - expressionRect.height / 2; //-y是因为坐标系统不同  
            ctx.translate(centerX, centerY);
            console.log('expression centerX',centerX, centerY);
            // ctx.drawImage(expressionImg,0,0,expressionRect.width,expressionRect.height);
            ctx.drawImage(expressionImg,0,0,expressionImg.width,expressionImg.height
                ,
                -expressionRect.width / 2,  // 相对于中心的X坐标
                -expressionRect.height / 2, // 相对于中心的Y坐标
                expressionRect.width, expressionRect.height
            );

            ctx.restore();
        }
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
    constructor(frame, keyFrameState = false, expressionRect = {x:0,y:0,width:50,height:60}) {
        this.frame = frame;
        this.KeyFrameState = keyFrameState;
        this.expressionRect = expressionRect;
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