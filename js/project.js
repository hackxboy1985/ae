// 项目类定义
class Project {
    constructor() {
        this.m_spriteList = []; // 存储Sprite对象
        this.imageManager = new LWImageManager(); // 图像管理器
    }
    
    addSprite(sprite) {
        this.m_spriteList.push(sprite);
    }
}