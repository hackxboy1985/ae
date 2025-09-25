// 角色类定义
class Sprite {
    constructor(name) {
        this.name = name;
        this.mAnimList = []; // 存储Anim对象
        this.m_imageList = []; // 存储ImageItem对象
    }
    
    addImage(imageItem) {
        this.m_imageList.push(imageItem);
    }
    
    getImage(imageId) {
        return this.m_imageList.find(img => img.id === imageId);
    }
}