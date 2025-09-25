// 帧类定义
class Frame {
    constructor() {
        this.fmList = []; // 存储FrameModule对象
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
    constructor(frame, keyFrameState = false) {
        this.frame = frame;
        this.KeyFrameState = keyFrameState;
    }
}