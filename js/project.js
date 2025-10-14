// 项目类定义
class Avatar {
    constructor() {
        this.m_spriteList = []; // 存储Sprite对象
        this.imageManager = new LWImageManager(); // 图像管理器
        this.id = 0;
    }
    
    addSprite(sprite) {
        this.m_spriteList.push(sprite);
    }

    draw(ctx, animIdx, aframeIdx,  posX, posY, expression = null,globalFlag = 0, globalScale = 1,globalAngle=0)  {
    //    console.log('expression:',expression);
        this.m_spriteList.forEach(sprite => {
            const expressionImg = expression != null ? expression.getFrame(aframeIdx) : null;
            sprite.draw(ctx, animIdx, aframeIdx, expressionImg, posX, posY, globalFlag, globalScale,globalAngle);
        });
    }

    getSprite() {
        if(this.m_spriteList.length === 0) {
            return null;
        }
        return this.m_spriteList[0];
    }

    getAnimation(animIdx) {
        return this.getSprite().getAnim(animIdx);
    }

    getAnimationName(animIdx) {
        return this.getSprite().getAnimName(animIdx);
    }
}