// 帧类定义
class Frame {
    constructor() {
        this.fmList = []; // 存储FrameModule对象
    }
    
    // 添加模块
    addModule(module) {
        this.fmList.push(module);
    }

    draw(ctx, sprite, originX, originY) {
        this.fmList.forEach(fm => {
            fm.draw(ctx, sprite, originX, originY);
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
    constructor(frame, keyFrameState = false, expressionRect = {x:0,y:0,width:50,height:60}) {
        this.frame = frame;
        this.KeyFrameState = keyFrameState;
        this.expressionRect = expressionRect;
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