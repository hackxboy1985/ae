// 项目类定义
class Avatar {
    constructor() {
        this.m_spriteList = []; // 存储Sprite对象
        this.imageManager = new LWImageManager(); // 图像管理器
    }
    
    addSprite(sprite) {
        this.m_spriteList.push(sprite);
    }

    draw(ctx, animIdx, aframeIdx, expression, posX, posY, globalFlag = 0, globalScale = 1,globalAngle=0)  {
        this.m_spriteList.forEach(sprite => {
            sprite.draw(ctx, animIdx, aframeIdx, expression, posX, posY, globalFlag, globalScale,globalAngle);
        });
    }
}