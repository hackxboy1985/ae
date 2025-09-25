// 项目类定义
class Project {
    constructor() {
        this.m_spriteList = []; // 存储Sprite对象
    }
    
    addSprite(sprite) {
        this.m_spriteList.push(sprite);
    }
}