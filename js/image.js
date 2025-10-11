// 图像管理器类定义
class LWImageManager {
    constructor() {
        this.m_imageMap = new Map(); // 存储所有图像
    }
    
    addImage(imageItem) {
        this.m_imageMap.set(imageItem.id, imageItem);
    }
    
    getImage(imageId) {
        return this.m_imageMap.get(imageId);
    }
    
    removeImage(imageId) {
        this.m_imageMap.delete(imageId);
    }
    clearImages() {
        this.m_imageMap.clear();
    }
}