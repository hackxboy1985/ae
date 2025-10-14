// 动画类定义
class Anim {
    constructor(name) {
        this.name = name;
        this.aframeList = []; // 存储AnimFrame对象
        this.frameInterval = 300; // 动画帧间隔
    }

    getFrameNum() {
        return this.aframeList.length;
    }

    draw(ctx, sprite, frameIdx, originX, originY, expressionImg = null, globalFlag = 0, globalScale = 1,globalAngle=0) {
        if(frameIdx < 0 || frameIdx >= this.aframeList.length){
            return;
        }
        const aframe = this.aframeList[frameIdx];
        aframe.draw(ctx, sprite, originX, originY, expressionImg, globalFlag, globalScale,globalAngle);
    }
}

// 角色类定义
class Sprite {
    constructor(name) {
        this.name = name;
        this.mAnimList = []; // 存储Anim对象
        this.m_imageList = []; // 存储ImageItem对象
    }

    draw(ctx, animIdx, aframeIdx, expressionImg, posX, posY, globalFlag = 0, globalScale = 1,globalAngle=0) {
        if(this.mAnimList.length === 0) {
            return;
        }
        if(animIdx < 0 || animIdx >= this.mAnimList.length){
            return;
        }

        const anim = this.mAnimList[animIdx];
        if(aframeIdx < 0 || aframeIdx >= anim.aframeList.length){
            return;
        }
        
        const aframe = anim.aframeList[aframeIdx];
        // const expressionImg = null;
        // if(aframeIdx < expression.images.length){
        //     expressionImg = expression.images[aframeIdx];
        // }
        if (this.m_imageList.length > 0) {
            aframe.draw(ctx, this, posX, posY, expressionImg, globalFlag, globalScale,globalAngle);
        }
    }

    addImage(imageItem) {
        this.m_imageList.push(imageItem);
    }
    
    getImage(imageId) {
        return this.m_imageList.find(img => img.id === imageId);
    }

    getAnim(animIdx) {
        if(animIdx < 0 || animIdx >= this.mAnimList.length){
            return null;
        }
        return this.mAnimList[animIdx];
    }

    getAnimName(animIdx) {
        if(animIdx < 0 || animIdx >= this.mAnimList.length){
            return null;
        }
        return this.mAnimList[animIdx].name;
    }
}
